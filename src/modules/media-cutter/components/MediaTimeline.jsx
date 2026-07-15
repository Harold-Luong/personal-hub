import { Clock3, Pause, Play, ScanLine } from "lucide-react";
import { MIN_SELECTION_DURATION_SECONDS } from "../constants/mediaCutterConstants";
import { formatMediaTime, getSelectionDuration } from "../utils/mediaTime";
import MediaTimeInputs from "./MediaTimeInputs";

export default function MediaTimeline({
    duration,
    endTime,
    endTimeInput,
    error,
    isPreviewing,
    onEndBlur,
    onEndInput,
    onEndSlider,
    onPreviewSelection,
    onSetEndFromPlayer,
    onSetStartFromPlayer,
    onStartBlur,
    onStartInput,
    onStartSlider,
    startTime,
    startTimeInput,
}) {
    const selectionDuration = getSelectionDuration(startTime, endTime);
    const forceHours = duration >= 3600;

    return (
        <section className="media-cutter-card media-timeline" aria-labelledby="media-timeline-title">
            <div className="media-cutter-section-heading">
                <span className="media-cutter-section-heading__icon" aria-hidden="true"><ScanLine size={19} /></span>
                <div>
                    <span>Bước 2</span>
                    <h2 id="media-timeline-title">Chọn đoạn cần xử lý</h2>
                </div>
            </div>

            <div className="media-timeline__summary">
                <Clock3 aria-hidden="true" size={17} />
                <span>Độ dài đoạn đã chọn</span>
                <strong>{formatMediaTime(selectionDuration, forceHours)}</strong>
            </div>

            <div className="media-timeline__ranges">
                <label>
                    <span>Bắt đầu · {formatMediaTime(startTime, forceHours)}</span>
                    <input
                        aria-label="Thời gian bắt đầu"
                        max={Math.max(0, endTime - MIN_SELECTION_DURATION_SECONDS)}
                        min="0"
                        onChange={(event) => onStartSlider(Number(event.target.value))}
                        step="0.1"
                        type="range"
                        value={startTime}
                    />
                </label>
                <label>
                    <span>Kết thúc · {formatMediaTime(endTime, forceHours)}</span>
                    <input
                        aria-label="Thời gian kết thúc"
                        max={duration}
                        min={Math.min(duration, startTime + MIN_SELECTION_DURATION_SECONDS)}
                        onChange={(event) => onEndSlider(Number(event.target.value))}
                        step="0.1"
                        type="range"
                        value={endTime}
                    />
                </label>
            </div>

            <MediaTimeInputs
                duration={duration}
                endTimeInput={endTimeInput}
                error={error}
                onEndBlur={onEndBlur}
                onEndInput={onEndInput}
                onStartBlur={onStartBlur}
                onStartInput={onStartInput}
                startTimeInput={startTimeInput}
            />

            <div className="media-timeline__player-actions">
                <button onClick={onSetStartFromPlayer} type="button">Đặt bắt đầu tại vị trí hiện tại</button>
                <button onClick={onSetEndFromPlayer} type="button">Đặt kết thúc tại vị trí hiện tại</button>
                <button className="is-primary" onClick={onPreviewSelection} type="button">
                    {isPreviewing ? <Pause aria-hidden="true" size={17} /> : <Play aria-hidden="true" size={17} />}
                    {isPreviewing ? "Dừng xem thử" : "Xem thử đoạn đã chọn"}
                </button>
            </div>
        </section>
    );
}
