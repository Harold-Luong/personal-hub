import { forwardRef } from "react";
import { Film, Music2 } from "lucide-react";
import { MEDIA_SOURCE_TYPES } from "../constants/mediaCutterConstants";
import { formatFileSize } from "../utils/mediaFile";
import { formatMediaTime } from "../utils/mediaTime";

const MediaPreview = forwardRef(function MediaPreview({ file, metadata, sourceType, sourceUrl }, ref) {
    const isAudio = sourceType === MEDIA_SOURCE_TYPES.AUDIO;
    const SourceIcon = isAudio ? Music2 : Film;
    const resolution = metadata?.width && metadata?.height
        ? `${metadata.width} × ${metadata.height}`
        : "Không xác định";

    return (
        <section className="media-cutter-card media-preview" aria-labelledby="media-preview-title">
            <div className="media-cutter-section-heading">
                <span className="media-cutter-section-heading__icon" aria-hidden="true"><SourceIcon size={19} /></span>
                <div>
                    <span>Xem trước</span>
                    <h2 id="media-preview-title">{isAudio ? "Nhạc nguồn" : "Video nguồn"}</h2>
                </div>
            </div>

            {isAudio ? (
                <audio controls preload="metadata" ref={ref} src={sourceUrl}>
                    Trình duyệt của bạn không hỗ trợ phát file MP3 này.
                </audio>
            ) : (
                <video controls playsInline preload="metadata" ref={ref} src={sourceUrl}>
                    Trình duyệt của bạn không hỗ trợ xem video này.
                </video>
            )}

            <div className="media-preview__filename" title={file.name}>{file.name}</div>
            <dl className="media-preview__metadata">
                <div><dt>Dung lượng</dt><dd>{formatFileSize(file.size)}</dd></div>
                <div><dt>Thời lượng</dt><dd>{formatMediaTime(metadata?.duration ?? 0, metadata?.duration >= 3600)}</dd></div>
                <div><dt>Định dạng</dt><dd>{file.type || "Không xác định"}</dd></div>
                {isAudio ? (
                    <div><dt>Loại nguồn</dt><dd>Âm thanh</dd></div>
                ) : (
                    <div><dt>Độ phân giải</dt><dd>{resolution}</dd></div>
                )}
            </dl>
        </section>
    );
});

export default MediaPreview;
