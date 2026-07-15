import { fetchFile } from "@ffmpeg/util";
import {
    MEDIA_OPERATIONS,
    OUTPUT_FORMATS,
    OUTPUT_MIME_TYPES,
    VIDEO_CUT_MODES,
} from "../constants/mediaCutterConstants";
import {
    buildOutputFilename,
    createVirtualMediaFilename,
    getFileExtension,
} from "../utils/mediaFile";
import { formatFfmpegTime, getSelectionDuration } from "../utils/mediaTime";

export class MediaProcessingError extends Error {
    constructor(code, message, details = "") {
        super(message);
        this.name = "MediaProcessingError";
        this.code = code;
        this.details = details;
    }
}

export function parseEncoderCapabilities(logText = "") {
    const normalizedLogs = String(logText);

    return {
        aac: /\baac\b/i.test(normalizedLogs),
        libmp3lame: /\blibmp3lame\b/i.test(normalizedLogs),
        libx264: /\blibx264\b/i.test(normalizedLogs),
        mpeg4: /\bmpeg4\b/i.test(normalizedLogs),
    };
}

export function buildExtractAudioArgs({ bitrate, input, output }) {
    return [
        "-i",
        input,
        "-map",
        "0:a:0",
        "-vn",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        `${bitrate}k`,
        output,
    ];
}

export function buildTrimAudioArgs({ bitrate, endTime, input, output, startTime }) {
    return [
        "-ss",
        formatFfmpegTime(startTime),
        "-i",
        input,
        "-t",
        formatFfmpegTime(getSelectionDuration(startTime, endTime)),
        "-map",
        "0:a:0",
        "-vn",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        `${bitrate}k`,
        output,
    ];
}

export function buildFastTrimVideoArgs({ endTime, input, output, startTime }) {
    return [
        "-ss",
        formatFfmpegTime(startTime),
        "-i",
        input,
        "-t",
        formatFfmpegTime(getSelectionDuration(startTime, endTime)),
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        output,
    ];
}

export function buildAccurateTrimVideoArgs({
    endTime,
    hasAudio = true,
    input,
    output,
    startTime,
    videoEncoder = "libx264",
}) {
    const videoEncodingArgs = videoEncoder === "libx264"
        ? ["-c:v", "libx264", "-preset", "medium", "-crf", "23"]
        : ["-c:v", "mpeg4", "-q:v", "4"];

    return [
        "-ss",
        formatFfmpegTime(startTime),
        "-i",
        input,
        "-t",
        formatFfmpegTime(getSelectionDuration(startTime, endTime)),
        "-map",
        "0:v:0",
        ...(hasAudio ? ["-map", "0:a:0?", "-c:a", "aac", "-b:a", "192k"] : []),
        ...videoEncodingArgs,
        "-movflags",
        "+faststart",
        output,
    ];
}

export function buildMediaCommand({
    bitrate,
    capabilities,
    endTime,
    hasAudio,
    input,
    operation,
    output,
    startTime,
    videoCutMode,
}) {
    if (operation !== MEDIA_OPERATIONS.TRIM_VIDEO && !capabilities.libmp3lame) {
        throw new MediaProcessingError(
            "unsupported-codec",
            "Codec MP3 chưa được hỗ trợ trong phiên bản FFmpeg hiện tại.",
        );
    }

    if (operation === MEDIA_OPERATIONS.EXTRACT_AUDIO) {
        return buildExtractAudioArgs({ bitrate, input, output });
    }

    if (operation === MEDIA_OPERATIONS.TRIM_AUDIO) {
        return buildTrimAudioArgs({ bitrate, endTime, input, output, startTime });
    }

    if (videoCutMode === VIDEO_CUT_MODES.FAST) {
        return buildFastTrimVideoArgs({ endTime, input, output, startTime });
    }

    const videoEncoder = capabilities.libx264 ? "libx264" : (capabilities.mpeg4 ? "mpeg4" : null);

    if (!videoEncoder || (hasAudio && !capabilities.aac)) {
        throw new MediaProcessingError(
            "unsupported-codec",
            "Codec cần thiết cho chế độ cắt chính xác chưa được hỗ trợ.",
        );
    }

    return buildAccurateTrimVideoArgs({
        endTime,
        hasAudio,
        input,
        output,
        startTime,
        videoEncoder,
    });
}

async function safeDeleteFile(ffmpeg, filename) {
    if (!filename) {
        return;
    }

    try {
        await ffmpeg.deleteFile(filename);
    } catch {
        // A terminated worker has already released its whole in-memory filesystem.
    }
}

async function executeWithCapturedLogs(ffmpeg, command) {
    const messages = [];
    const logHandler = ({ message }) => messages.push(message);
    ffmpeg.on?.("log", logHandler);

    try {
        const exitCode = await command();
        return { exitCode, logs: messages.join("\n") };
    } finally {
        ffmpeg.off?.("log", logHandler);
    }
}

function inspectStreamsFromFfmpegLogs(logs) {
    const normalizedLogs = String(logs);

    return {
        hasAudio: /^\s*Stream #.*Audio:/im.test(normalizedLogs),
        isReadableMedia: /^\s*Input #\d+/im.test(normalizedLogs)
            && /^\s*Stream #/im.test(normalizedLogs),
    };
}

async function sourceHasAudioStream(ffmpeg, inputFilename, probeFilename) {
    const probe = await executeWithCapturedLogs(ffmpeg, () => ffmpeg.ffprobe([
        "-v",
        "error",
        "-select_streams",
        "a:0",
        "-show_entries",
        "stream=codec_name",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        inputFilename,
        "-o",
        probeFilename,
    ]));

    if (probe.exitCode === 0) {
        const probeResult = await ffmpeg.readFile(probeFilename, "utf8");
        return typeof probeResult === "string" && probeResult.trim().length > 0;
    }

    // Some ffmpeg.wasm builds can execute ffmpeg while ffprobe still fails.
    // Asking ffmpeg to inspect an input without an output is fast and prints the
    // stream table, even though the command intentionally exits with an error.
    const fallback = await executeWithCapturedLogs(ffmpeg, () => ffmpeg.exec([
        "-hide_banner",
        "-i",
        inputFilename,
    ]));
    const streamInfo = inspectStreamsFromFfmpegLogs(fallback.logs);

    if (streamInfo.isReadableMedia) {
        return streamInfo.hasAudio;
    }

    const details = [probe.logs, fallback.logs].filter(Boolean).join("\n");
    throw new MediaProcessingError(
        "invalid-media",
        "Không thể đọc cấu trúc của video.",
        details,
    );
}

function getProcessingFailure(operation, videoCutMode, logs) {
    const normalizedLogs = String(logs).toLowerCase();

    if (normalizedLogs.includes("out of memory") || normalizedLogs.includes("memory access out of bounds")) {
        return new MediaProcessingError(
            "out-of-memory",
            "Trình duyệt không đủ bộ nhớ để xử lý file này.",
            logs,
        );
    }

    if (normalizedLogs.includes("unknown encoder") || normalizedLogs.includes("encoder not found")) {
        return new MediaProcessingError(
            "unsupported-codec",
            "Codec cần thiết chưa được hỗ trợ trong phiên bản FFmpeg hiện tại.",
            logs,
        );
    }

    const hasNoAudioStream = normalizedLogs.includes("does not contain any stream")
        || normalizedLogs.includes("matches no streams")
        || normalizedLogs.includes("stream map '0:a:0' matches no streams");

    if (operation !== MEDIA_OPERATIONS.TRIM_VIDEO && hasNoAudioStream) {
        return new MediaProcessingError(
            "no-audio",
            "Video này không có luồng âm thanh.",
            logs,
        );
    }

    if (operation === MEDIA_OPERATIONS.TRIM_VIDEO && videoCutMode === VIDEO_CUT_MODES.FAST) {
        return new MediaProcessingError(
            "fast-cut-incompatible",
            "Không thể cắt nhanh file này. Hãy thử lại với chế độ cắt chính xác.",
            logs,
        );
    }

    return new MediaProcessingError(
        "ffmpeg-failed",
        "Không thể xử lý media. Vui lòng thử lại với một file khác.",
        logs,
    );
}

export async function processMedia({
    bitrate,
    capabilities,
    endTime,
    execute,
    fetchFileImpl = fetchFile,
    ffmpeg,
    file,
    operation,
    outputBasename,
    startTime,
    videoCutMode,
}) {
    const outputFormat = operation === MEDIA_OPERATIONS.TRIM_VIDEO ? OUTPUT_FORMATS.MP4 : OUTPUT_FORMATS.MP3;
    const outputFilename = buildOutputFilename({ basename: outputBasename, format: outputFormat });
    const inputFilename = createVirtualMediaFilename("media-input", file.name, ".mp4");
    const virtualOutputFilename = createVirtualMediaFilename("media-output", outputFilename, `.${outputFormat}`);
    const probeFilename = createVirtualMediaFilename("media-probe", "audio.txt", ".txt");

    try {
        await ffmpeg.writeFile(inputFilename, await fetchFileImpl(file));
        const needsAudioProbe = operation === MEDIA_OPERATIONS.TRIM_VIDEO
            && videoCutMode === VIDEO_CUT_MODES.ACCURATE;
        const hasAudio = needsAudioProbe
            ? await sourceHasAudioStream(ffmpeg, inputFilename, probeFilename)
            : operation !== MEDIA_OPERATIONS.TRIM_VIDEO;

        const args = buildMediaCommand({
            bitrate,
            capabilities,
            endTime,
            hasAudio,
            input: inputFilename,
            operation,
            output: virtualOutputFilename,
            startTime,
            videoCutMode,
        });
        const { exitCode, logs } = await execute(args);

        if (exitCode !== 0) {
            throw getProcessingFailure(operation, videoCutMode, logs);
        }

        const data = await ffmpeg.readFile(virtualOutputFilename);

        if (!(data instanceof Uint8Array) || data.byteLength === 0) {
            throw new MediaProcessingError("missing-output", "FFmpeg không tạo được file đầu ra.");
        }

        return {
            bitrate: outputFormat === OUTPUT_FORMATS.MP3 ? Number(bitrate) : null,
            blob: new Blob([data], { type: OUTPUT_MIME_TYPES[outputFormat] }),
            duration: operation === MEDIA_OPERATIONS.EXTRACT_AUDIO
                ? null
                : getSelectionDuration(startTime, endTime),
            filename: outputFilename,
            format: outputFormat,
            mimeType: OUTPUT_MIME_TYPES[outputFormat],
            sourceExtension: getFileExtension(file.name),
        };
    } finally {
        await Promise.all([
            safeDeleteFile(ffmpeg, inputFilename),
            safeDeleteFile(ffmpeg, virtualOutputFilename),
            safeDeleteFile(ffmpeg, probeFilename),
        ]);
    }
}
