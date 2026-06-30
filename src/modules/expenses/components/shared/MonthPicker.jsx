export default function MonthPicker({ value, onChange }) {
    return (
        <input
            className="month-picker"
            type="month"
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
        />
    );
}
