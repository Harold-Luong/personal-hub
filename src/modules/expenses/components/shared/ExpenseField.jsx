export default function ExpenseField({
    children,
    className = "",
    label,
    labelClassName = "",
    ...labelProps
}) {
    return (
        <label {...labelProps} className={className || undefined}>
            {label !== undefined ? (
                <span className={labelClassName || undefined}>{label}</span>
            ) : null}
            {children}
        </label>
    );
}
