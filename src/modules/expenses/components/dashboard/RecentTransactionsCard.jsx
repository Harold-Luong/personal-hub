import HiddenItems from "../shared/HiddenItems";
import SectionCard from "../shared/SectionCard";
import TransactionList from "../transaction/TransactionList";

export default function RecentTransactionsCard({
    limit,
    transactions = [],
    variant = "desktop",
}) {
    const visibleTransactions = limit
        ? transactions.slice(0, limit)
        : transactions;
    const hiddenTransaction = transactions.slice(limit);
    return (
        <SectionCard
            actionLabel="Xem tất cả"
            className={`recent-transactions-card recent-transactions-card--${variant}`}
            title="Giao dịch gần đây"
        >
            <TransactionList transactions={visibleTransactions} />
            <HiddenItems hiddenItems={hiddenTransaction} />
        </SectionCard>
    );
}
