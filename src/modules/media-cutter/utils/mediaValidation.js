import {
    AUDIO_BITRATES,
    DESKTOP_MAX_FILE_SIZE_BYTES,
    MEDIA_OPERATIONS,
    MOBILE_MAX_FILE_SIZE_BYTES,
    OUTPUT_FORMATS,
    MEDIA_SOURCE_TYPES,
    VIDEO_CUT_MODES,
} from "../constants/mediaCutterConstants";
import { getMediaSourceType, sanitizeOutputBasename } from "./mediaFile";
import { validateTimeRange } from "./mediaTime";

export function isMobileMediaEnvironment() {
    if (typeof window === "undefined") {
        return false;
    }

    const compactViewport = window.matchMedia?.("(max-width: 767px)").matches ?? false;
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    return compactViewport || coarsePointer;
}

export function getMediaFileSizeLimit(isMobile) {
    return isMobile ? MOBILE_MAX_FILE_SIZE_BYTES : DESKTOP_MAX_FILE_SIZE_BYTES;
}

export function validateMediaFile(file, { isMobile = false } = {}) {
    if (!file) {
        return "Vui lòng chọn một file video hoặc MP3.";
    }

    if (!getMediaSourceType(file)) {
        return "Định dạng media này chưa được hỗ trợ.";
    }

    const maximumSize = getMediaFileSizeLimit(isMobile);

    if (file.size > maximumSize) {
        return `File vượt quá giới hạn ${Math.round(maximumSize / (1024 * 1024))} MB.`;
    }

    if (file.size <= 0) {
        return "File media đang trống hoặc không thể đọc được.";
    }

    return "";
}

export function validateOutputBasename(value) {
    if (!String(value ?? "").trim()) {
        return "Vui lòng nhập tên file đầu ra.";
    }

    if (sanitizeOutputBasename(value) === "media-output" && value.trim() !== "media-output") {
        return "Tên file đầu ra chưa hợp lệ.";
    }

    return "";
}

export function validateProcessingOptions({
    bitrate,
    duration,
    endTime,
    file,
    isFfmpegReady,
    isMobile,
    operation,
    outputBasename,
    outputFormat,
    startTime,
    videoCutMode,
}) {
    const errors = {};
    const fileError = validateMediaFile(file, { isMobile });
    const sourceType = getMediaSourceType(file);

    if (fileError) {
        errors.file = fileError;
    }

    if (!isFfmpegReady) {
        errors.ffmpeg = "Bộ xử lý media chưa sẵn sàng.";
    }

    if (!Object.values(MEDIA_OPERATIONS).includes(operation)) {
        errors.operation = "Thao tác xử lý chưa hợp lệ.";
    } else if (sourceType === MEDIA_SOURCE_TYPES.AUDIO && operation !== MEDIA_OPERATIONS.TRIM_AUDIO) {
        errors.operation = "File MP3 chỉ hỗ trợ thao tác cắt âm thanh.";
    }

    if (operation !== MEDIA_OPERATIONS.EXTRACT_AUDIO) {
        const timeError = validateTimeRange(startTime, endTime, duration);

        if (timeError) {
            errors.time = timeError;
        }
    }

    if (operation === MEDIA_OPERATIONS.TRIM_VIDEO) {
        if (outputFormat !== OUTPUT_FORMATS.MP4 || !Object.values(VIDEO_CUT_MODES).includes(videoCutMode)) {
            errors.output = "Tùy chọn xuất video chưa hợp lệ.";
        }
    } else if (outputFormat !== OUTPUT_FORMATS.MP3 || !AUDIO_BITRATES.includes(Number(bitrate))) {
        errors.output = "Tùy chọn xuất âm thanh chưa hợp lệ.";
    }

    const filenameError = validateOutputBasename(outputBasename);

    if (filenameError) {
        errors.filename = filenameError;
    }

    return errors;
}
