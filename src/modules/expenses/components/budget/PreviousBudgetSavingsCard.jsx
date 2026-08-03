import { getBudgetSavingsCandidates } from "../../utils/expenseCalculations";
import AmountText from "../shared/AmountText";
import ExpenseButton from "../shared/ExpenseButton";
import ExpenseIcon from "../../icon/ExpenseIcon";

export default function PreviousBudgetSavingsCard({
    budgets = [],
    monthLabel,
    onTransfer,
    transfers = [],
}) {
    const candidates = getBudgetSavingsCandidates(budgets);
    const transferredCategoryIds = new Set(
        transfers.map((transaction) => transaction.budgetSavingsCategoryId).filter(Boolean),
    );
    const availableSavings = candidates.reduce(
        (total, candidate) =>
            transferredCategoryIds.has(candidate.categoryId)
                ? total
                : total + candidate.savingsAmount,
        0,
    );

    return (
        <section className="budget-page__previous-savings section-card">
            <header className="budget-page__previous-savings-header">
                <span className="budget-page__previous-savings-icon">
                    <ExpenseIcon bare icon="saving" size={22} />
                </span>
                <div>
                    <h2>Khoản dư có thể đưa vào tiết kiệm</h2>
                    <p>{monthLabel ? `Ngân sách ${monthLabel}` : "Ngân sách tháng trước"}</p>
                </div>
                <strong><AmountText amount={availableSavings} /></strong>
            </header>

            {candidates.length ? (
                <div className="budget-page__previous-savings-list">
                    {candidates.map((candidate) => {
                        const isTransferred = transferredCategoryIds.has(candidate.categoryId);

                        return (
                            <div className="budget-page__previous-savings-row" key={candidate.id ?? candidate.categoryId}>
                                <ExpenseIcon
                                    color={candidate.color}
                                    icon={candidate.icon}
                                    label={candidate.category}
                                />
                                <span>
                                    <strong>{candidate.category}</strong>
                                    <small>
                                        Đã chi <AmountText amount={candidate.amount} /> trên <AmountText amount={candidate.limit} />
                                    </small>
                                </span>
                                <span className="budget-page__previous-savings-amount">
                                    <small>Còn dư</small>
                                    <strong><AmountText amount={candidate.savingsAmount} /></strong>
                                </span>
                                <ExpenseButton
                                    className={isTransferred ? "is-transferred" : ""}
                                    disabled={isTransferred}
                                    label={isTransferred ? "Đã chuyển" : "Đưa vào tiết kiệm"}
                                    onClick={() => onTransfer?.(candidate)}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="budget-page__previous-savings-empty">
                    Tháng trước không có danh mục ngân sách nào còn dư.
                </p>
            )}
        </section>
    );
}
