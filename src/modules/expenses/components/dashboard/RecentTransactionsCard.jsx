import SectionCard from '../shared/SectionCard'
import TransactionList from '../transaction/TransactionList'

export default function RecentTransactionsCard({ limit, transactions = [] }) {
  const visibleTransactions = limit ? transactions.slice(0, limit) : transactions

  return (
    <SectionCard actionLabel="Xem tat ca" className="recent-transactions-card" title="Giao dich gan day">
      <TransactionList transactions={visibleTransactions} />
    </SectionCard>
  )
}
