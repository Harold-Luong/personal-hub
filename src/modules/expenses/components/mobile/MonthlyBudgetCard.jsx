import ProgressBar from "../shared/ProgressBar";
import { formatCurrency } from "../../utils/formatCurrency";
import { calculateMonthlyBudgetTotals, getBudgetUsageStatus } from "../../utils/expenseCalculations";

const budgetStatusColors = {
    exceeded: "#dc1717",
    warning: "#d98c00",
};

export default function MonthlyBudgetCard({ budgets = [], onManageBudget }) {
    const { spent, limit, percentage } = calculateMonthlyBudgetTotals(budgets);
    const status = getBudgetUsageStatus({ amount: spent, limit });
    const statusColor = budgetStatusColors[status];

    return (
        <section className={`monthly-budget-card monthly-budget-card--${status}`}>
            <header className="monthly-budget-card__header">
                <h2>Ngân sách tháng</h2>
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
