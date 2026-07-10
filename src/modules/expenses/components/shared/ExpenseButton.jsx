export default function ExpenseButton({
    ariaLabel,
    children,
    className = "",
    disabled = false,
    icon: Icon,
    iconSize = 18,
    isLoading = false,
    label,
    labelTag: LabelTag,
    loadingLabel,
    title,
    type = "button",
    ...buttonProps
}) {
    const content = isLoading && loadingLabel ? loadingLabel : (label ?? children);

    return (
        <button
            {...buttonProps}
            aria-label={ariaLabel}
            className={className || undefined}
            disabled={disabled || isLoading}
            title={title}
            type={type}
        >
            {Icon ? <Icon size={iconSize} /> : null}
            {LabelTag && content !== undefined ? <LabelTag>{content}</LabelTag> : content}
        </button>
    );
}
