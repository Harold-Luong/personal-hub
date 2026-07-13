import ExpenseIcon from "../../icon/ExpenseIcon";

function ExpenseButtonIcon({ appearance, icon, size }) {
    if (!icon) {
        return null;
    }

    return <ExpenseIcon appearance={appearance} bare icon={icon} size={size} />;
}

export default function ExpenseButton({
    ariaLabel,
    children,
    className = "",
    disabled = false,
    icon,
    iconAppearance = "auto",
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
            <ExpenseButtonIcon appearance={iconAppearance} icon={icon} size={iconSize} />
            {LabelTag && content !== undefined ? <LabelTag>{content}</LabelTag> : content}
        </button>
    );
}
