import AmountText from "../shared/AmountText";
import CategoryIcon from "../shared/CategoryIcon";
import HiddenItems from "../shared/HiddenItems";
import ProgressBar from "../shared/ProgressBar";
import SectionCard from "../shared/SectionCard";
import DonutChart from "../shared/DonutChart";

export default function CategorySpendingCard({
    categories = [],
    limit,
    variant = "desktop",
}) {
    const sortedCategories = [...categories].sort(
        (firstCategory, secondCategory) =>
            (secondCategory.percentage ?? 0) - (firstCategory.percentage ?? 0),
    );
    const visibleCategories = limit ? sortedCategories.slice(0, limit) : sortedCategories;
    const hiddenCategories = sortedCategories.slice(limit);
    const shouldShowDonut = variant === "desktop";
    const totalAmount = shouldShowDonut
        ? sortedCategories.reduce(
              (total, category) => total + (category.amount ?? 0),
              0,
          )
        : 0;

    return (
        <SectionCard
            className={`category-spending-card category-spending-card--${variant}`}
            title="Chi tiêu theo danh mục"
        >
            {shouldShowDonut ? (
                <DonutChart categories={sortedCategories}>
                    <span>Tổng</span>
                    <strong>
                        <AmountText amount={totalAmount} />
                    </strong>
                </DonutChart>
            ) : null}

            <div className="category-spending-card__list">
                {visibleCategories.map((category) => (
                    <div className="category-row" key={category.id}>
                        <CategoryIcon
                            appearance="emoji"
                            color={category.color}
                            icon={category.icon}
                            label={category.name}
                        />
                        <div className="category-row__body">
                            <div>
                                <span className="category-row__name">
                                    {category.name}
                                </span>
                                <span className="category-row__amount">
                                    <AmountText amount={category.amount} />
                                </span>
                            </div>
                            <ProgressBar
                                color={category.color}
                                value={category.percentage}
                            />
                        </div>
                        <small className="category-row__percentage">
                            {category.percentage}%
                        </small>
                    </div>
                ))}
                <HiddenItems
                    hiddenItems={hiddenCategories}
                    showHiddenAmount={true}
                />
            </div>
        </SectionCard>
    );
}
