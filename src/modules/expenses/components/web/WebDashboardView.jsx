import { useState } from "react";
import BudgetOverviewCard from "../dashboard/BudgetOverviewCard";
import CategorySpendingCard from "../dashboard/CategorySpendingCard";
import RecentTransactionsCard from "../dashboard/RecentTransactionsCard";
import SummaryCardList from "../dashboard/SummaryCardList";
import WalletCard from "../dashboard/WalletCard";
import ExpenseHeader from "../layout/ExpenseHeader";
import ExpenseSidebar from "../layout/ExpenseSidebar";
import WebAddTransactionPanel from "./WebAddTransactionPanel";
import WebBudgetPanel from "./WebBudgetPanel";

export default function WebDashboardView({
    budgets,
    categories,
    categorySpending,
    navItems,
    onAddTransaction,
    onDeleteBudget,
    onSaveBudget,
    onLogout,
    onToggleTheme,
    summary,
    theme,
    transactions,
    user,
    wallets,
}) {
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);

    const handleAddTransaction = async (transaction) => {
        await onAddTransaction?.(transaction);
        setIsAddTransactionOpen(false);
    };

    const handleSaveBudget = async (budget) => {
        await onSaveBudget?.(budget);
        setIsBudgetOpen(false);
    };

    const handleDeleteBudget = async (budget) => {
        await onDeleteBudget?.(budget);
        setIsBudgetOpen(false);
    };

    return (
        <div className="web-dashboard-view">
            <ExpenseSidebar items={navItems} user={user} />
            <main className="web-dashboard-view__main">
                <ExpenseHeader
                    onAddTransactionClick={() => setIsAddTransactionOpen(true)}
                    onLogout={onLogout}
                    onToggleTheme={onToggleTheme}
                    theme={theme}
                    user={user}
                />
                <SummaryCardList items={summary} />
                {isAddTransactionOpen ? (
                    <WebAddTransactionPanel
                        categories={categories}
                        onCancel={() => setIsAddTransactionOpen(false)}
                        onSubmit={handleAddTransaction}
                        wallets={wallets}
                    />
                ) : null}
                {isBudgetOpen ? (
                    <WebBudgetPanel
                        budgets={budgets}
                        categories={categories}
                        onCancel={() => setIsBudgetOpen(false)}
                        onDelete={handleDeleteBudget}
                        onSubmit={handleSaveBudget}
                    />
                ) : null}
                <div className="web-dashboard-view__grid">
                    <CategorySpendingCard categories={categorySpending} limit={5} />
                    <RecentTransactionsCard transactions={transactions} limit={10} />
                    <BudgetOverviewCard budgets={budgets} onManageBudget={() => setIsBudgetOpen(true)} />
                    <WalletCard wallets={wallets} />
                </div>
            </main>
        </div>
    );
}
