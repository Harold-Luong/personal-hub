import AmountText from "./AmountText";

export default function HiddenItems({
    hiddenItems = [],
    itemLabel = "danh mục khác",
    summaryLabel = "Đã tính trong tổng",
    showHiddenAmount = false,
}) {
    if (hiddenItems.length === 0) {
        return null;
    }

    const hiddenTotalAmount = hiddenItems.reduce((total, item) => total + (item.amount ?? 0), 0);

    return (
        <div className="hidden-items">
            <span>
                +{hiddenItems.length} {itemLabel}
            </span>

            {showHiddenAmount && (
                <small>
                    {summaryLabel} <AmountText amount={hiddenTotalAmount} />
                </small>
            )}
        </div>
    );
}
