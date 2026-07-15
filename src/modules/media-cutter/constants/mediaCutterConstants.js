export const MEDIA_OPERATIONS = {
    EXTRACT_AUDIO: "extract-audio",
    TRIM_AUDIO: "trim-audio",
    TRIM_VIDEO: "trim-video",
};

export const OUTPUT_FORMATS = {
    MP3: "mp3",
    MP4: "mp4",
};

export const MEDIA_SOURCE_TYPES = {
    AUDIO: "audio",
    VIDEO: "video",
};

export const VIDEO_CUT_MODES = {
    ACCURATE: "accurate",
    FAST: "fast",
};

export const FFMPEG_STATUSES = {
    CANCELLED: "cancelled",
    COMPLETED: "completed",
    FAILED: "failed",
    IDLE: "idle",
    LOADING: "loading-ffmpeg",
    PREPARING: "preparing",
    PROCESSING: "processing",
    READY: "ready",
};

export const AUDIO_BITRATES = [128, 192, 256, 320];
export const DEFAULT_AUDIO_BITRATE = 192;
export const DEFAULT_OPERATION = MEDIA_OPERATIONS.TRIM_AUDIO;
export const DEFAULT_VIDEO_CUT_MODE = VIDEO_CUT_MODES.FAST;

export const SUPPORTED_AUDIO_MIME_TYPES = [
    "audio/mpeg",
    "audio/mp3",
    "audio/mpeg3",
    "audio/x-mp3",
    "audio/x-mpeg-3",
];

export const SUPPORTED_VIDEO_MIME_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
];

export const SUPPORTED_AUDIO_EXTENSIONS = [".mp3"];
export const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];
export const SUPPORTED_MEDIA_MIME_TYPES = [
    ...SUPPORTED_AUDIO_MIME_TYPES,
    ...SUPPORTED_VIDEO_MIME_TYPES,
];
export const SUPPORTED_MEDIA_EXTENSIONS = [
    ...SUPPORTED_AUDIO_EXTENSIONS,
    ...SUPPORTED_VIDEO_EXTENSIONS,
];
export const MEDIA_FILE_ACCEPT = [...SUPPORTED_MEDIA_MIME_TYPES, ...SUPPORTED_MEDIA_EXTENSIONS].join(",");

export const DESKTOP_MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
export const MOBILE_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MIN_SELECTION_DURATION_SECONDS = 0.1;
export const MAX_OUTPUT_BASENAME_LENGTH = 100;

export const OUTPUT_MIME_TYPES = {
    [OUTPUT_FORMATS.MP3]: "audio/mpeg",
    [OUTPUT_FORMATS.MP4]: "video/mp4",
};

export const FFMPEG_STATUS_LABELS = {
    [FFMPEG_STATUSES.CANCELLED]: "Đã hủy xử lý.",
    [FFMPEG_STATUSES.COMPLETED]: "Đã xử lý xong.",
    [FFMPEG_STATUSES.FAILED]: "Không thể xử lý file.",
    [FFMPEG_STATUSES.IDLE]: "Chưa có tác vụ.",
    [FFMPEG_STATUSES.LOADING]: "Đang tải bộ xử lý media...",
    [FFMPEG_STATUSES.PREPARING]: "Đang chuẩn bị media...",
    [FFMPEG_STATUSES.PROCESSING]: "Đang xử lý media...",
    [FFMPEG_STATUSES.READY]: "Bộ xử lý media đã sẵn sàng.",
};
