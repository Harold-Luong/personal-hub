import SummaryCard from "./SummaryCard";

export default function SummaryCardList({
    ariaLabel,
    cardVariant = "default",
    className = "",
    items = [],
    variant = "grid",
}) {
    const Component = ariaLabel ? "section" : "div";
    const classNames = ["summary-card-list", `summary-card-list--${variant}`, className].filter(Boolean).join(" ");

    return (
        <Component aria-label={ariaLabel} className={classNames}>
            {items.map((item) => (
                <SummaryCard key={item.id ?? item.label} variant={item.variant ?? cardVariant} {...item} />
            ))}
        </Component>
    );
}
