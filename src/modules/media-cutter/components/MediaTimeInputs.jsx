export default function MediaTimeInputs({
    duration,
    endTimeInput,
    error,
    onEndBlur,
    onEndInput,
    onStartBlur,
    onStartInput,
    startTimeInput,
}) {
    const placeholder = duration >= 3600 ? "HH:MM:SS" : "MM:SS";

    return (
        <div className="media-time-inputs">
            <label>
                <span>Bắt đầu</span>
                <input
                    aria-invalid={Boolean(error)}
                    inputMode="numeric"
                    onBlur={onStartBlur}
                    onChange={(event) => onStartInput(event.target.value)}
                    placeholder={placeholder}
                    spellCheck="false"
                    type="text"
                    value={startTimeInput}
                />
            </label>
            <span aria-hidden="true">→</span>
            <label>
                <span>Kết thúc</span>
                <input
                    aria-invalid={Boolean(error)}
                    inputMode="numeric"
                    onBlur={onEndBlur}
                    onChange={(event) => onEndInput(event.target.value)}
                    placeholder={placeholder}
                    spellCheck="false"
                    type="text"
                    value={endTimeInput}
                />
            </label>
            {error ? <p className="media-cutter-field-error" role="alert">{error}</p> : null}
        </div>
    );
}
