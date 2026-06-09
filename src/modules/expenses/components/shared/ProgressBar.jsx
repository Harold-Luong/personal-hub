export default function ProgressBar({ value = 0, max = 100, color }) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

    return (
        <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin="0"
            aria-valuemax={max}
        >
            <span style={{ width: `${percentage}%`, backgroundColor: color }} />
        </div>
    );
}
