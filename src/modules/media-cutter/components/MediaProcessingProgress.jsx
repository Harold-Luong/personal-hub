import { LoaderCircle, RotateCcw, Square } from "lucide-react";
import { FFMPEG_STATUS_LABELS, FFMPEG_STATUSES } from "../constants/mediaCutterConstants";

export default function MediaProcessingProgress({
    canCancel,
    error,
    isDeterminate,
    onCancel,
    onRetry,
    progress,
    status,
}) {
    const percentage = Math.round((progress ?? 0) * 100);
    const showRetry = [FFMPEG_STATUSES.CANCELLED, FFMPEG_STATUSES.FAILED].includes(status);
    const isBusy = [
        FFMPEG_STATUSES.LOADING,
        FFMPEG_STATUSES.PREPARING,
        FFMPEG_STATUSES.PROCESSING,
    ].includes(status);

    return (
        <section className={`media-processing media-processing--${status}`} aria-live="polite">
            <div className="media-processing__copy">
                {isBusy ? <LoaderCircle aria-hidden="true" className="media-processing__spinner" size={20} /> : null}
                <div>
                    <strong>{FFMPEG_STATUS_LABELS[status] ?? "Đang chuẩn bị..."}</strong>
                    {error ? <span role="alert">{error}</span> : null}
                </div>
                {isDeterminate && status === FFMPEG_STATUSES.PROCESSING ? <b>{percentage}%</b> : null}
            </div>

            {isBusy ? (
                <div
                    aria-label={isDeterminate ? `Tiến độ xử lý ${percentage}%` : "Đang xử lý"}
                    aria-valuemax={isDeterminate ? 100 : undefined}
                    aria-valuemin={isDeterminate ? 0 : undefined}
                    aria-valuenow={isDeterminate ? percentage : undefined}
                    className={`media-processing__bar${isDeterminate ? "" : " is-indeterminate"}`}
                    role="progressbar"
                >
                    <span style={isDeterminate ? { width: `${percentage}%` } : undefined} />
                </div>
            ) : null}

            {canCancel ? (
                <button onClick={onCancel} type="button"><Square aria-hidden="true" size={14} /> Hủy xử lý</button>
            ) : null}
            {showRetry ? (
                <button onClick={onRetry} type="button"><RotateCcw aria-hidden="true" size={15} /> Tải lại bộ xử lý</button>
            ) : null}
        </section>
    );
}
