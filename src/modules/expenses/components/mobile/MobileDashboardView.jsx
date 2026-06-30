import BalanceHeroCard from "../dashboard/BalanceHeroCard";
import CategorySpendingCard from "../dashboard/CategorySpendingCard";
import RecentTransactionsCard from "../dashboard/RecentTransactionsCard";
import MobilePageHeader from "./MobilePageHeader";
import MonthlyBudgetCard from "./MonthlyBudgetCard";
import { formatDate } from "./../../utils/formatDate";
import { BellIcon, ThemeIcon } from "../../icon/ExpenseIcons";

export default function MobileDashboardView({
    budgets,
    categorySpending = [],
    onManageBudget,
    onToggleTheme,
    summary,
    theme = "sage",
    transactions,
    user,
}) {
    const balance = summary.find((item) => item.id === "balance")?.value ?? 0;
    const balanceTrend = summary.find((item) => item.id === "balance")?.trend ?? 0;
    const income = summary.find((item) => item.id === "income")?.value ?? 0;
    const incomeTrend = summary.find((item) => item.id === "income")?.trend ?? 0;
    const expense = Math.abs(summary.find((item) => item.id === "expense")?.value ?? 0);
    const expenseTrend = summary.find((item) => item.id === "expense")?.trend ?? 0;

    return (
        <div className="mobile-dashboard-view">
            <MobilePageHeader
                actions={
                    <>
                        <button
                            aria-label={`Đổi giao diện hiện tại: ${theme}`}
                            className="mobile-dashboard-view__theme-toggle"
                            onClick={onToggleTheme}
                            type="button"
                        >
                            <ThemeIcon size={22} />
                        </button>
                        <button aria-label="Thông báo" className="mobile-dashboard-view__notification" type="button">
                            <BellIcon size={22} />
                        </button>
                    </>
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
            <MonthlyBudgetCard budgets={budgets} onManageBudget={onManageBudget} />
            <CategorySpendingCard limit={5} categories={categorySpending} variant="mobile" />
            <RecentTransactionsCard limit={5} transactions={transactions} variant="mobile" />
        </div>
    );
}
