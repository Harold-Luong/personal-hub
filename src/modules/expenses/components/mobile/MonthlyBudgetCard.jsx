import ProgressBar from "../shared/ProgressBar";
import SectionCardHeader from "../shared/SectionCardHeader";
import { budgetStatusColors } from "../../constants/expenseMetadata";
import { expenseUiText } from "../../constants/expenseUiMetadata";
import { formatCurrency } from "../../utils/formatCurrency";
import { calculateMonthlyBudgetTotals, getBudgetUsageStatus } from "../../utils/expenseCalculations";

export default function MonthlyBudgetCard({ budgets = [], monthLabel, onManageBudget }) {
    const { spent, limit, percentage, savingsVsPlan } = calculateMonthlyBudgetTotals(budgets);
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

            {budgets.length ? (
                <div className={`monthly-budget-card__savings${savingsVsPlan < 0 ? " is-negative" : ""}`}>
                    <span>Tiết kiệm so với kế hoạch</span>
                    <strong>{formatCurrency(savingsVsPlan)}</strong>
                </div>
            ) : null}
        </section>
    );
}
