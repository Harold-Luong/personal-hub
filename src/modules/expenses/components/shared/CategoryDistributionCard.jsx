import AmountText from "./AmountText";
import DonutChart from "./DonutChart";
import SectionCard from "./SectionCard";
import { distributionFallbackColors } from "../../constant/expensesMetaData";

function getPercent(amount, total) {
    return total > 0 ? Math.round((amount / total) * 1000) / 10 : 0;
}

function getSortedCategories(categories, totalAmount) {
    return [...categories]
        .map((category, index) => {
            const amount = category.amount ?? 0;

            return {
                ...category,
                amount,
                color: category.color || distributionFallbackColors[index % distributionFallbackColors.length],
                percentage: category.percentage ?? getPercent(amount, totalAmount),
            };
        })
        .sort((firstCategory, secondCategory) => (secondCategory.amount ?? 0) - (firstCategory.amount ?? 0));
}

function getDistributionRows(categories, limit) {
    if (!limit || categories.length <= limit) {
        return {
            chartCategories: categories,
            hiddenCategories: [],
            visibleCategories: categories,
        };
    }

    const visibleCategories = categories.slice(0, limit);
    const hiddenCategories = categories.slice(limit);

    return {
        chartCategories: categories,
        hiddenCategories,
        visibleCategories,
    };
}

function CategoryLegend({ categories }) {
    return (
        <div className="category-distribution-card__legend">
            {categories.map((category) => (
                <span className="category-distribution-card__legend-item" key={category.id} title={category.name}>
                    <i style={{ "--category-color": category.color }} />
                    <span>{category.name}</span>
                </span>
            ))}
        </div>
    );
}

function CategoryDistributionContent({ chartCategories, showDonut, totalAmount, totalLabel, visibleCategories }) {
    return (
        <div className="category-distribution-card__body">
            {showDonut ? (
                <DonutChart categories={chartCategories}>
                    <span>{totalLabel}</span>
                    <strong>
                        <AmountText amount={totalAmount} />
                    </strong>
                </DonutChart>
            ) : null}
            <CategoryLegend categories={visibleCategories} />
        </div>
    );
}

export default function CategoryDistributionCard({
    actionLabel = "Xem tất cả",
    categories = [],
    className = "",
    limit,
    monthLabel,
    onViewAll,
    showDonut = true,
    title = "Chi tiêu theo danh mục",
    totalAmount,
    totalLabel = "Tổng",
    variant = "desktop",
}) {
    const resolvedTotalAmount = totalAmount ?? categories.reduce((sum, category) => sum + (category.amount ?? 0), 0);
    const sortedCategories = getSortedCategories(categories, resolvedTotalAmount);
    const { chartCategories, visibleCategories } = getDistributionRows(sortedCategories, limit);
    const content = (
        <CategoryDistributionContent
            chartCategories={chartCategories}
            showDonut={showDonut}
            totalAmount={resolvedTotalAmount}
            totalLabel={totalLabel}
            visibleCategories={visibleCategories}
        />
    );
    const cardClassName = [
        "category-distribution-card",
        `category-distribution-card--${variant}`,
        "category-spending-card",
        `category-spending-card--${variant}`,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <SectionCard
            actionLabel={actionLabel}
            className={cardClassName}
            monthLabel={monthLabel}
            onAction={onViewAll}
            title={title}
        >
            {content}
        </SectionCard>
    );
}
