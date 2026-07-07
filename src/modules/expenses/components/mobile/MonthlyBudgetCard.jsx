import ProgressBar from "../shared/ProgressBar";
import { budgetStatusColors } from "../../constant/expensesMetaData";
import { formatCurrency } from "../../utils/formatCurrency";
import { calculateMonthlyBudgetTotals, getBudgetUsageStatus } from "../../utils/expenseCalculations";

export default function MonthlyBudgetCard({ budgets = [], monthLabel, onManageBudget }) {
    const { spent, limit, percentage } = calculateMonthlyBudgetTotals(budgets);
    const status = getBudgetUsageStatus({ amount: spent, limit });
    const statusColor = budgetStatusColors[status];

    return (
        <section className={`monthly-budget-card monthly-budget-card--${status}`}>
            <header className="monthly-budget-card__header">
                <div className="monthly-budget-card__title">
                    <h2>Ngân sách của bạn</h2>
                    {monthLabel ? <span>({monthLabel})</span> : null}
                </div>
                <button onClick={onManageBudget} type="button">
                    {budgets.length ? "Quản lý" : "Tạo mới"}
                </button>
            </header>

            <div className="monthly-budget-card__summary">
                <p>
                    <strong>{formatCurrency(spent)}</strong>
                    <span> / {formatCurrency(limit)}</span>
                </p>
                <strong>{percentage}%</strong>
            </div>

            <ProgressBar color={statusColor} max={limit} value={spent} />
        </section>
    );
}
