import BudgetOverviewCard from '../dashboard/BudgetOverviewCard'
import CategorySpendingCard from '../dashboard/CategorySpendingCard'
import RecentTransactionsCard from '../dashboard/RecentTransactionsCard'
import SummaryCardList from '../dashboard/SummaryCardList'
import WalletCard from '../dashboard/WalletCard'
import ExpenseHeader from '../layout/ExpenseHeader'
import ExpenseSidebar from '../layout/ExpenseSidebar'

export default function WebDashboardView({
  budgets,
  categorySpending,
  navItems,
  onLogout,
  onToggleTheme,
  summary,
  theme,
  transactions,
  user,
  wallets,
}) {
  return (
    <div className="web-dashboard-view">
      <ExpenseSidebar items={navItems} />
      <main className="web-dashboard-view__main">
        <ExpenseHeader
          onLogout={onLogout}
          onToggleTheme={onToggleTheme}
          theme={theme}
          user={user}
        />
        <SummaryCardList items={summary} />
        <div className="web-dashboard-view__grid">
          <CategorySpendingCard categories={categorySpending} />
          <RecentTransactionsCard transactions={transactions} />
          <BudgetOverviewCard budgets={budgets} />
          <WalletCard wallets={wallets} />
        </div>
      </main>
    </div>
  )
}
