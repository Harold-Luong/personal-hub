import {
    MAX_OUTPUT_BASENAME_LENGTH,
    MEDIA_OPERATIONS,
    MEDIA_SOURCE_TYPES,
    OUTPUT_FORMATS,
    SUPPORTED_AUDIO_EXTENSIONS,
    SUPPORTED_AUDIO_MIME_TYPES,
    SUPPORTED_VIDEO_EXTENSIONS,
    SUPPORTED_VIDEO_MIME_TYPES,
} from "../constants/mediaCutterConstants";

export function getFileExtension(filename = "") {
    const match = String(filename).toLowerCase().match(/\.[a-z0-9]+$/);
    return match?.[0] ?? "";
}

export function stripFileExtension(filename = "") {
    return String(filename).replace(/\.[^.]+$/, "");
}

export function getMediaSourceType(file) {
    const extension = getFileExtension(file?.name);
    const mimeType = typeof file?.type === "string" ? file.type.trim().toLowerCase() : "";
    const hasKnownMimeType = mimeType.length > 0;

    if (SUPPORTED_AUDIO_EXTENSIONS.includes(extension)
        && (!hasKnownMimeType || SUPPORTED_AUDIO_MIME_TYPES.includes(mimeType))) {
        return MEDIA_SOURCE_TYPES.AUDIO;
    }

    if (SUPPORTED_VIDEO_EXTENSIONS.includes(extension)
        && (!hasKnownMimeType || SUPPORTED_VIDEO_MIME_TYPES.includes(mimeType))) {
        return MEDIA_SOURCE_TYPES.VIDEO;
    }

    return null;
}

export function sanitizeOutputBasename(value) {
    const valueWithoutControlCharacters = Array.from(stripFileExtension(value))
        .filter((character) => {
            const characterCode = character.charCodeAt(0);
            return characterCode > 31 && characterCode !== 127;
        })
        .join("");
    const sanitizedValue = valueWithoutControlCharacters
        .replace(/[\\/]/g, "-")
        .replace(/\.\.+/g, "-")
        .replace(/[<>:"|?*]/g, "-")
        .replace(/\s+/g, " ")
        .replace(/-+/g, "-")
        .trim()
        .replace(/^[. ]+|[. ]+$/g, "")
        .slice(0, MAX_OUTPUT_BASENAME_LENGTH)
        .trim();

    return sanitizedValue || "media-output";
}

export function getDefaultOutputBasename(sourceName, operation, sourceType = MEDIA_SOURCE_TYPES.VIDEO) {
    const sourceBasename = sanitizeOutputBasename(sourceName);
    const suffix = operation === MEDIA_OPERATIONS.TRIM_VIDEO
        || (sourceType === MEDIA_SOURCE_TYPES.AUDIO && operation === MEDIA_OPERATIONS.TRIM_AUDIO)
        ? "cut"
        : "audio";
    const maximumSourceLength = Math.max(1, MAX_OUTPUT_BASENAME_LENGTH - suffix.length - 1);

    return sanitizeOutputBasename(`${sourceBasename.slice(0, maximumSourceLength)}-${suffix}`);
}

export function getOutputFormatForOperation(operation) {
    return operation === MEDIA_OPERATIONS.TRIM_VIDEO ? OUTPUT_FORMATS.MP4 : OUTPUT_FORMATS.MP3;
}

export function buildOutputFilename({ basename, format }) {
    const normalizedFormat = format === OUTPUT_FORMATS.MP4 ? OUTPUT_FORMATS.MP4 : OUTPUT_FORMATS.MP3;
    return `${sanitizeOutputBasename(basename)}.${normalizedFormat}`;
}

export function formatFileSize(sizeInBytes) {
    const size = Number(sizeInBytes) || 0;

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function createVirtualMediaFilename(prefix, sourceName, fallbackExtension) {
    const sourceExtension = getFileExtension(sourceName) || fallbackExtension;
    const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${uniquePart}${sourceExtension}`;
}
