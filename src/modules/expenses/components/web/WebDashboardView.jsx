import { useState } from "react";
import BudgetOverviewCard from "../dashboard/BudgetOverviewCard";
import CategorySpendingCard from "../dashboard/CategorySpendingCard";
import RecentTransactionsCard from "../dashboard/RecentTransactionsCard";
import SummaryCardList from "../shared/SummaryCardList";
import WalletCard from "../dashboard/WalletCard";
import WebWalletPanel from "./WebWalletPanel";

export default function WebDashboardView({
    budgets,
    categorySpending,
    monthLabel,
    onDeleteWallet,
    onManageBudget,
    onSaveWallet,
    onSelectBudget,
    onViewCategorySpending,
    onViewTransactions,
    summary,
    transactions,
    wallets,
}) {
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [selectedWalletId, setSelectedWalletId] = useState("");

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
        <>
            <SummaryCardList items={summary} />
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
                    onEditWallet={openWalletPanel}
                    onManageWallet={() => openWalletPanel(wallets[0]?.id ?? null)}
                    wallets={wallets}
                />
            </div>
        </>
    );
}
