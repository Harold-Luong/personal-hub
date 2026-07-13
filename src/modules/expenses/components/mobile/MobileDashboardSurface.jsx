import BalanceHeroCard from "../dashboard/BalanceHeroCard";
import CategorySpendingCard from "../dashboard/CategorySpendingCard";
import RecentTransactionsCard from "../dashboard/RecentTransactionsCard";
import MobilePageHeader from "./MobilePageHeader";
import MonthlyBudgetCard from "./MonthlyBudgetCard";
import { formatDate } from "./../../utils/formatDate";
import { ThemeIcon } from "../../icon/ExpenseIcons";
import { selectAuthUser, useAuthSessionStore } from "../../../../stores/authSessionStore";
import { expenseDefaultTheme } from "../../constants/expenseMetadata";

export default function MobileDashboardSurface({
    budgets,
    categorySpending = [],
    monthLabel,
    onManageBudget,
    onToggleTheme,
    onViewCategorySpending,
    onViewTransactions,
    summary,
    theme = expenseDefaultTheme,
    transactions,
}) {
    const user = useAuthSessionStore(selectAuthUser);
    const balanceSummary = summary.find((item) => item.id === "balance");
    const incomeSummary = summary.find((item) => item.id === "income");
    const expenseSummary = summary.find((item) => item.id === "expense");
    const balance = balanceSummary?.value ?? 0;
    const balanceTrend = balanceSummary?.trend ?? 0;
    const income = incomeSummary?.value ?? 0;
    const incomeTrend = incomeSummary?.trend ?? 0;
    const expense = Math.abs(expenseSummary?.value ?? 0);
    const expenseTrend = expenseSummary?.trend ?? 0;

    return (
        <div className="mobile-dashboard-surface">
            <MobilePageHeader
                actions={
                    <button
                        aria-label={`Đổi giao diện hiện tại: ${theme}`}
                        className="mobile-dashboard-surface__theme-toggle"
                        onClick={onToggleTheme}
                        type="button"
                    >
                        <ThemeIcon size={22} />
                    </button>
                }
                subtitle={formatDate(new Date())}
                title={
                    <>
                        Xin chào, {user?.displayName || user?.email} <span aria-hidden="true">👋</span>
                    </>
                }
            />

            <BalanceHeroCard
                balance={balance}
                balanceTrend={balanceTrend}
                expense={expense}
                expenseTrend={expenseTrend}
                income={income}
                incomeTrend={incomeTrend}
            />
            <MonthlyBudgetCard budgets={budgets} monthLabel={monthLabel} onManageBudget={onManageBudget} />
            <CategorySpendingCard
                categories={categorySpending}
                limit={5}
                monthLabel={monthLabel}
                onViewAll={onViewCategorySpending}
                variant="mobile"
            />
            <RecentTransactionsCard limit={5} onViewAll={onViewTransactions} transactions={transactions} variant="mobile" />
        </div>
    );
}
