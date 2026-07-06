import CategoryDistributionCard from "../shared/CategoryDistributionCard";

export default function CategorySpendingCard({ categories = [], limit, monthLabel, onViewAll, variant = "desktop" }) {
    return (
        <CategoryDistributionCard
            categories={categories}
            limit={limit}
            monthLabel={monthLabel}
            onViewAll={onViewAll}
            showDonut={variant === "desktop"}
            title="Chi tiêu theo danh mục"
            variant={variant}
        />
    );
}
