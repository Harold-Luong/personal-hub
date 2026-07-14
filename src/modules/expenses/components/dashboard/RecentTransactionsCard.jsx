import HiddenItems from "../shared/HiddenItems";
import SectionCard from "../shared/SectionCard";
import TransactionList from "../transaction/TransactionList";
import { getTransactionsWithCurrentWalletDisplayNames } from "../../utils/walletUtils";

export default function RecentTransactionsCard({ limit, onViewAll, transactions = [], variant = "desktop", wallets = [] }) {
    const displayTransactions = getTransactionsWithCurrentWalletDisplayNames(transactions, wallets);
    const visibleTransactions = limit ? displayTransactions.slice(0, limit) : displayTransactions;
    const hiddenTransaction = displayTransactions.slice(limit);
    return (
        <SectionCard
            className={`recent-transactions-card recent-transactions-card--${variant}`}
            onAction={onViewAll}
            title="Giao dịch gần đây"
        >
            <TransactionList transactions={visibleTransactions} />
            <HiddenItems hiddenItems={hiddenTransaction} />
        </SectionCard>
    );
}
