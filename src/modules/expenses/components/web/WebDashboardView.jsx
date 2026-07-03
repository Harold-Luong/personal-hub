import { useState } from "react";
import BudgetOverviewCard from "../dashboard/BudgetOverviewCard";
import CategorySpendingCard from "../dashboard/CategorySpendingCard";
import RecentTransactionsCard from "../dashboard/RecentTransactionsCard";
import SummaryCardList from "../dashboard/SummaryCardList";
import WalletCard from "../dashboard/WalletCard";
import ExpenseHeader from "../layout/ExpenseHeader";
import ExpenseSidebar from "../layout/ExpenseSidebar";
import WebAddTransactionPanel from "./WebAddTransactionPanel";
import WebWalletPanel from "./WebWalletPanel";

export default function WebDashboardView({
    budgets,
    categories,
    categorySpending,
    monthLabel,
    navItems,
    onNavigate,
    onAddTransaction,
    onDeleteWallet,
    onLogout,
    onManageBudget,
    onSaveWallet,
    onSelectBudget,
    onToggleTheme,
    onViewCategorySpending,
    onViewTransactions,
    summary,
    theme,
    transactions,
    user,
    wallets,
}) {
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [selectedWalletId, setSelectedWalletId] = useState("");

    const handleAddTransaction = async (transaction) => {
        await onAddTransaction?.(transaction);
        setIsAddTransactionOpen(false);
    };

    const openWalletPanel = (walletId = "") => {
        setSelectedWalletId(walletId);
        setIsWalletOpen(true);
    };

    const closeWalletPanel = () => {
        setIsWalletOpen(false);
        setSelectedWalletId("");
    };

    const handleSaveWallet = async (wallet) => {
        await onSaveWallet?.(wallet);
        closeWalletPanel();
    };

    const handleDeleteWallet = async (wallet) => {
        await onDeleteWallet?.(wallet);
        closeWalletPanel();
    };

    return (
        <div className="web-dashboard-view">
            <ExpenseSidebar activeId="dashboard" items={navItems} onNavigate={onNavigate} user={user} />
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
                {isWalletOpen ? (
                    <WebWalletPanel
                        initialWalletId={selectedWalletId}
                        onCancel={closeWalletPanel}
                        onDelete={handleDeleteWallet}
                        onSubmit={handleSaveWallet}
                        wallets={wallets}
                    />
                ) : null}
                <div className="web-dashboard-view__grid">
                    <CategorySpendingCard
                        categories={categorySpending}
                        limit={5}
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
                        onEditWallet={openWalletPanel}
                        onManageWallet={() => openWalletPanel(wallets[0]?.id ?? null)}
                        wallets={wallets}
                    />
                </div>
            </main>
        </div>
    );
}
