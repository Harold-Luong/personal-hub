import ProgressBar from "../shared/ProgressBar";
import { formatCurrency } from "../../utils/formatCurrency";

export default function MonthlyBudgetCard({ budgets = [] }) {
    const { spent, limit } = budgets.reduce(
        (total, budget) => ({
            spent: total.spent + Math.max(budget.amount ?? 0, 0),
            limit: total.limit + Math.max(budget.limit ?? 0, 0),
        }),
        { spent: 0, limit: 0 },
    );
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    return (
        <section className="monthly-budget-card">
            <h2>Ngân sách tháng</h2>

            <div className="monthly-budget-card__summary">
                <p>
                    <strong>{formatCurrency(spent)}</strong>
                    <span> / {formatCurrency(limit)}</span>
                </p>
                <strong>{percentage}%</strong>
            </div>

            <ProgressBar max={limit} value={spent} />
        </section>
    );
}
