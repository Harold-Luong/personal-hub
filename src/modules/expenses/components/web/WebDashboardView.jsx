import BudgetOverviewCard from "../dashboard/BudgetOverviewCard";
import CategorySpendingCard from "../dashboard/CategorySpendingCard";
import RecentTransactionsCard from "../dashboard/RecentTransactionsCard";
import SummaryCardList from "../shared/SummaryCardList";
import WalletCard from "../dashboard/WalletCard";

export default function WebDashboardView({
    budgets,
    categorySpending,
    monthLabel,
    onManageBudget,
    onManageWallet,
    onPayCreditCard,
    onSelectBudget,
    onViewCategorySpending,
    onViewTransactions,
    summary,
    transactions,
    wallets,
}) {
    return (
        <>
            <SummaryCardList items={summary} />
            <div className="web-dashboard-view__grid">
                <CategorySpendingCard
                    categories={categorySpending}
                    limit={10}
                    monthLabel={monthLabel}
                    onViewAll={onViewCategorySpending}
                />
                <RecentTransactionsCard limit={10} onViewAll={onViewTransactions} transactions={transactions} />
                <BudgetOverviewCard
                    budgets={budgets}
                    monthLabel={monthLabel}
                    onManageBudget={onManageBudget}
                    onSelectBudget={onSelectBudget}
                />
                <WalletCard
                    onManageWallet={onManageWallet}
                    onPayCreditCard={onPayCreditCard}
                    wallets={wallets}
                />
            </div>
        </>
    );
}
