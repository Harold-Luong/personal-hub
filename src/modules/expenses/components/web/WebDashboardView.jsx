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
import WebWalletPanel from "./WebWalletPanel";

export default function WebDashboardView({
    budgets,
    categories,
    categorySpending,
    monthLabel,
    navItems,
    onNavigate,
    onAddTransaction,
    onDeleteBudget,
    onDeleteWallet,
    onLogout,
    onSaveBudget,
    onSaveWallet,
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
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [selectedBudgetCategoryId, setSelectedBudgetCategoryId] = useState("");
    const [selectedWalletId, setSelectedWalletId] = useState("");

    const handleAddTransaction = async (transaction) => {
        await onAddTransaction?.(transaction);
        setIsAddTransactionOpen(false);
    };

    const closeBudgetPanel = () => {
        setIsBudgetOpen(false);
        setSelectedBudgetCategoryId("");
    };

    const openBudgetPanel = () => {
        setSelectedBudgetCategoryId("");
        setIsBudgetOpen(true);
    };

    const openBudgetPanelForCategory = (categoryId) => {
        setSelectedBudgetCategoryId(categoryId);
        setIsBudgetOpen(true);
    };

    const handleSaveBudget = async (budget) => {
        await onSaveBudget?.(budget);
        closeBudgetPanel();
    };

    const handleDeleteBudget = async (budget) => {
        await onDeleteBudget?.(budget);
        closeBudgetPanel();
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
                {isBudgetOpen ? (
                    <WebBudgetPanel
                        budgets={budgets}
                        categories={categories}
                        initialCategoryId={selectedBudgetCategoryId}
                        onCancel={closeBudgetPanel}
                        onDelete={handleDeleteBudget}
                        onSubmit={handleSaveBudget}
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
                        onManageBudget={openBudgetPanel}
                        onSelectBudget={openBudgetPanelForCategory}
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
