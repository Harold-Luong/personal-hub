import BudgetOverviewCard from '../dashboard/BudgetOverviewCard'
import CategorySpendingCard from '../dashboard/CategorySpendingCard'
import RecentTransactionsCard from '../dashboard/RecentTransactionsCard'
import SummaryCardList from '../dashboard/SummaryCardList'
import WalletCard from '../dashboard/WalletCard'
import ExpenseHeader from '../layout/ExpenseHeader'
import ExpenseSidebar from '../layout/ExpenseSidebar'

export default function WebDashboardView({
  budgets,
  categories,
  navItems,
  summary,
  transactions,
  wallets,
}) {
  return (
    <div className="web-dashboard-view">
      <ExpenseSidebar items={navItems} />
      <main className="web-dashboard-view__main">
        <ExpenseHeader />
        <SummaryCardList items={summary} />
        <div className="web-dashboard-view__grid">
          <CategorySpendingCard categories={categories} />
          <RecentTransactionsCard transactions={transactions} />
          <BudgetOverviewCard budgets={budgets} />
          <WalletCard wallets={wallets} />
        </div>
      </main>
    </div>
  )
}
