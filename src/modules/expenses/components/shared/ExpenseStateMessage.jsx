export default function ExpenseStateMessage({
    as: Component = "p",
    children,
    className = "",
    message,
    ...messageProps
}) {
    return (
        <Component {...messageProps} className={className || undefined}>
            {message ?? children}
        </Component>
    );
}
