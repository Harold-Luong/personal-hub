import AmountText from "../shared/AmountText";
import ExpenseIcon from "../shared/ExpenseEmoji";
import ProgressBar from "../shared/ProgressBar";
import SectionCard from "../shared/SectionCard";
import { budgetStatusColors } from "../../constant/expensesMetaData";
import { expenseUiText } from "../../constant/expensesUiMetaData";
import { calculateBudgetUsagePercentage, getBudgetUsageStatus } from "../../utils/expenseCalculations";

export default function BudgetOverviewCard({ budgets = [], monthLabel, onManageBudget, onSelectBudget }) {
    return (
        <SectionCard
            actionLabel={budgets.length ? expenseUiText.actions.MANAGE : expenseUiText.actions.CREATE_BUDGET}
            className="budget-overview-card"
            monthLabel={monthLabel}
            onAction={onManageBudget}
            title="Ngân sách của bạn"
        >
            {budgets.length ? (
                budgets.map((budget) => {
                    const status = getBudgetUsageStatus(budget);
                    const statusColor = budgetStatusColors[status] ?? budget.color;

                    return (
                        <button
                            className={`budget-item budget-item--${status}`}
                            key={budget.id ?? budget.category}
                            onClick={() => onSelectBudget?.(budget.categoryId)}
                            type="button"
                        >
                            <ExpenseIcon
                                appearance="emoji"
                                color={budget.color}
                                icon={budget.icon}
                                label={budget.category}
                            />
                            <div className="budget-item__body">
                                <div className="budget-item__copy">
                                    <strong>{budget.category}</strong>
                                    <p className="budget-item__amounts">
                                        <span className="budget-item__spent">
                                            <AmountText amount={budget.amount} />
                                        </span>
                                        <span aria-hidden="true" className="budget-item__separator">
                                            /
                                        </span>
                                        <span className="budget-item__limit">
                                            <AmountText amount={budget.limit} />
                                        </span>
                                    </p>
                                </div>
                                <ProgressBar color={statusColor} max={budget.limit} value={budget.amount} />
                            </div>
                            <span className="budget-item__percentage">{calculateBudgetUsagePercentage(budget)}%</span>
                        </button>
                    );
                })
            ) : (
                <p className="budget-overview-card__empty">Chưa tạo ngân sách cho tháng này.</p>
            )}
        </SectionCard>
    );
}
