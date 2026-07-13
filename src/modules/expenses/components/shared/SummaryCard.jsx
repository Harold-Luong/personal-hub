import AmountText from "./AmountText";
import ExpenseIcon from "../../icon/ExpenseIcon";

function renderIcon(icon, label, size) {
    if (!icon) {
        return null;
    }

    return <ExpenseIcon icon={icon} label={label} size={size} />;
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
                    <ExpenseIcon bare icon={trend < 0 ? "trend-down" : "trend-up"} size={13} />
                    <span>{`${Math.abs(trend)}% ${trendLabel}`}</span>
                </small>
            ) : null}
        </article>
    );
}
