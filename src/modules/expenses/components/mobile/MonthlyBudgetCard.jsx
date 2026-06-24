import ProgressBar from "../shared/ProgressBar";
import { formatCurrency } from "../../utils/formatCurrency";
import { calculateMonthlyBudgetTotals } from "../../utils/expenseCalculations";

export default function MonthlyBudgetCard({ budgets = [] }) {
    const { spent, limit, percentage } = calculateMonthlyBudgetTotals(budgets);

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
