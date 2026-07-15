import { AudioLines, Gauge, Scissors, SlidersHorizontal, Video } from "lucide-react";
import {
    AUDIO_BITRATES,
    MEDIA_OPERATIONS,
    MEDIA_SOURCE_TYPES,
    VIDEO_CUT_MODES,
} from "../constants/mediaCutterConstants";

const operationOptions = [
    {
        description: "Lấy toàn bộ phần âm thanh trong video.",
        icon: AudioLines,
        id: MEDIA_OPERATIONS.EXTRACT_AUDIO,
        label: "Tách toàn bộ âm thanh",
    },
    {
        description: "Chỉ lấy âm thanh trong khoảng đã chọn.",
        icon: Scissors,
        id: MEDIA_OPERATIONS.TRIM_AUDIO,
        label: "Cắt âm thanh",
    },
    {
        description: "Xuất đoạn video đã chọn thành MP4.",
        icon: Video,
        id: MEDIA_OPERATIONS.TRIM_VIDEO,
        label: "Cắt video",
    },
];

export default function MediaExportOptions({
    bitrate,
    capabilities,
    disabled,
    error,
    filenameError,
    isFfmpegReady,
    onBitrateChange,
    onOperationChange,
    onOutputBasenameChange,
    onVideoCutModeChange,
    operation,
    outputBasename,
    outputFormat,
    sourceType,
    videoCutMode,
}) {
    const isVideo = operation === MEDIA_OPERATIONS.TRIM_VIDEO;
    const isAudioSource = sourceType === MEDIA_SOURCE_TYPES.AUDIO;
    const supportsAccurateVideo = capabilities.libx264 || capabilities.mpeg4;
    const audioCodecUnavailable = isFfmpegReady && !capabilities.libmp3lame;
    const availableOperationOptions = isAudioSource
        ? operationOptions.filter(({ id }) => id === MEDIA_OPERATIONS.TRIM_AUDIO)
        : operationOptions;

    return (
        <section className="media-cutter-card media-export-options" aria-labelledby="media-export-title">
            <div className="media-cutter-section-heading">
                <span className="media-cutter-section-heading__icon" aria-hidden="true"><SlidersHorizontal size={19} /></span>
                <div>
                    <span>Bước 3</span>
                    <h2 id="media-export-title">Chọn kết quả</h2>
                </div>
            </div>

            <fieldset
                className={`media-operation-options${isAudioSource ? " media-operation-options--single" : ""}`}
                disabled={disabled}
            >
                <legend>Thao tác</legend>
                {availableOperationOptions.map(({ description, icon: Icon, id, label }) => {
                    const isAudioOption = id !== MEDIA_OPERATIONS.TRIM_VIDEO;
                    const optionDisabled = disabled || (isAudioOption && audioCodecUnavailable);

                    return (
                        <label className={operation === id ? "is-selected" : ""} key={id}>
                            <input
                                checked={operation === id}
                                disabled={optionDisabled}
                                name="media-operation"
                                onChange={() => onOperationChange(id)}
                                type="radio"
                                value={id}
                            />
                            <span aria-hidden="true"><Icon size={19} /></span>
                            <strong>{label}</strong>
                            <small>{description}</small>
                        </label>
                    );
                })}
            </fieldset>

            {audioCodecUnavailable ? (
                <p className="media-cutter-field-error">Core FFmpeg hiện tại không báo cáo codec MP3.</p>
            ) : null}

            <div className="media-export-options__fields">
                {isVideo ? (
                    <fieldset className="media-cut-mode" disabled={disabled}>
                        <legend>Chế độ cắt MP4</legend>
                        <label>
                            <input
                                checked={videoCutMode === VIDEO_CUT_MODES.FAST}
                                name="video-cut-mode"
                                onChange={() => onVideoCutModeChange(VIDEO_CUT_MODES.FAST)}
                                type="radio"
                            />
                            <span><strong>Cắt nhanh</strong><small>Stream copy, nhanh nhưng phụ thuộc keyframe.</small></span>
                        </label>
                        <label>
                            <input
                                checked={videoCutMode === VIDEO_CUT_MODES.ACCURATE}
                                disabled={isFfmpegReady && !supportsAccurateVideo}
                                name="video-cut-mode"
                                onChange={() => onVideoCutModeChange(VIDEO_CUT_MODES.ACCURATE)}
                                type="radio"
                            />
                            <span>
                                <strong>Cắt chính xác</strong>
                                <small>
                                    {capabilities.libx264
                                        ? "Re-encode bằng H.264 và AAC."
                                        : "Dùng MPEG-4 fallback nếu core hỗ trợ."}
                                </small>
                            </span>
                        </label>
                    </fieldset>
                ) : (
                    <label className="media-export-options__select">
                        <span><Gauge aria-hidden="true" size={17} /> Chất lượng MP3</span>
                        <select disabled={disabled} onChange={(event) => onBitrateChange(event.target.value)} value={bitrate}>
                            {AUDIO_BITRATES.map((value) => (
                                <option key={value} value={value}>{value} kbps</option>
                            ))}
                        </select>
                    </label>
                )}

                <label className="media-export-options__filename">
                    <span>Tên file đầu ra</span>
                    <div>
                        <input
                            aria-invalid={Boolean(filenameError)}
                            disabled={disabled}
                            maxLength="100"
                            onChange={(event) => onOutputBasenameChange(event.target.value)}
                            type="text"
                            value={outputBasename}
                        />
                        <span>.{outputFormat}</span>
                    </div>
                    {filenameError ? <small className="media-cutter-field-error" role="alert">{filenameError}</small> : null}
                </label>
            </div>

            {error ? <p className="media-cutter-field-error" role="alert">{error}</p> : null}
        </section>
    );
}
