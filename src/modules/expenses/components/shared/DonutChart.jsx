export default function DonutChart({ categories = [], children }) {
    //ex: #ef4444 0% 40%, #3b82f6 40% 70%, #22c55e 70% 100%
    const stops = categories
        .reduce(
            (result, category, index) => {
                const previous = index === 0 ? 0 : result.total;
                const next = previous + category.percentage;
                result.total = next;
                result.items.push(`${category.color} ${previous}% ${next}%`);
                return result;
            },
            { items: [], total: 0 },
        )
        .items.join(", ");

    return (
        <div
            className="category-spending-card__chart"
            style={{ "--chart-stops": stops || "var(--expense-border) 0% 100%" }}
        >
            {children ? <div className="category-spending-card__chart-center">{children}</div> : null}
        </div>
    );
}
