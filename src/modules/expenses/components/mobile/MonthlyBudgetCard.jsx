import ProgressBar from "../shared/ProgressBar";
import SectionCardHeader from "../shared/SectionCardHeader";
import { budgetStatusColors } from "../../constant/expensesMetaData";
import { expenseUiText } from "../../constant/expensesUiMetaData";
import { formatCurrency } from "../../utils/formatCurrency";
import { calculateMonthlyBudgetTotals, getBudgetUsageStatus } from "../../utils/expenseCalculations";

export default function MonthlyBudgetCard({ budgets = [], monthLabel, onManageBudget }) {
    const { spent, limit, percentage } = calculateMonthlyBudgetTotals(budgets);
    const status = getBudgetUsageStatus({ amount: spent, limit });
    const statusColor = budgetStatusColors[status];

    return (
        <section className={`monthly-budget-card monthly-budget-card--${status}`}>
            <SectionCardHeader
                actionLabel={budgets.length ? expenseUiText.actions.MANAGE : expenseUiText.actions.CREATE_NEW}
                className="monthly-budget-card__header"
                monthLabel={monthLabel}
                onAction={onManageBudget}
                title="Ngân sách của bạn"
                titleClassName="monthly-budget-card__title"
            />

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
