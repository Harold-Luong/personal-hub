import AmountText from "./AmountText";
import ExpenseIcon from "./ExpenseIcon";

function renderIcon(icon, label, size) {
    if (!icon) {
        return null;
    }

    if (typeof icon === "function") {
        const Icon = icon;

        return <Icon size={size} />;
    }

    return <ExpenseIcon appearance="emoji" icon={icon} label={label} />;
}

function getTrendTone(tone, trend) {
    if (trend === 0) {
        return "neutral";
    }

    if (tone === "danger" || tone === "expense" || tone === "red") {
        return trend > 0 ? "bad" : "good";
    }

    return trend < 0 ? "bad" : "good";
}

function getTrendText(trend, trendLabel) {
    const direction = trend < 0 ? "↓" : "↑";

    return `${direction} ${Math.abs(trend)}% ${trendLabel}`;
}

export default function SummaryCard({
    emphasizeValue = false,
    icon,
    iconSize = 22,
    label,
    tone = "neutral",
    trend,
    trendLabel = "so với tháng trước",
    trendTone,
    value,
    valueType = "currency",
    variant = "default",
}) {
    const hasTrend = typeof trend === "number";
    const resolvedTrendTone = trendTone ?? getTrendTone(tone, trend);
    const cardClassName = [
        "summary-card",
        `summary-card--${tone}`,
        `summary-card--${variant}`,
        emphasizeValue ? "summary-card--emphasis" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <article className={cardClassName}>
            <div className="summary-card__top">
                <span className="summary-card__label">{label}</span>
                {icon ? (
                    <span className="summary-card__icon" aria-hidden="true">
                        {renderIcon(icon, label, iconSize)}
                    </span>
                ) : null}
            </div>
            <strong className="summary-card__value">
                {valueType === "currency" ? <AmountText amount={value} /> : value}
            </strong>
            {hasTrend ? (
                <small className={`summary-card__meta summary-card__meta--${resolvedTrendTone}`}>
                    {getTrendText(trend, trendLabel)}
                </small>
            ) : null}
        </article>
    );
}
