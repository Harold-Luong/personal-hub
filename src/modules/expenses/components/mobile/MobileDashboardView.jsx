import BalanceHeroCard from '../dashboard/BalanceHeroCard'
import CategorySpendingCard from '../dashboard/CategorySpendingCard'
import RecentTransactionsCard from '../dashboard/RecentTransactionsCard'
import ExpenseBottomNav from '../layout/ExpenseBottomNav'
import MobileQuickActions from './MobileQuickActions'

export default function MobileDashboardView({
  categories,
  navItems,
  summary,
  transactions,
}) {
  const balance = summary.find((item) => item.id === 'balance')?.value ?? 0
  const income = summary.find((item) => item.id === 'income')?.value ?? 0
  const expense = Math.abs(summary.find((item) => item.id === 'expense')?.value ?? 0)

  return (
    <div className="mobile-dashboard-view">
      <header className="mobile-dashboard-view__header">
        <div>
          <p>Xin chao, Duc</p>
          <button type="button">Thang 6, 2026</button>
        </div>
        <button aria-label="Notifications" type="button">NT</button>
      </header>

      <BalanceHeroCard balance={balance} expense={expense} income={income} />
      <MobileQuickActions />
      <CategorySpendingCard categories={categories.slice(0, 5)} variant="mobile" />
      <RecentTransactionsCard limit={3} transactions={transactions} />
      <ExpenseBottomNav items={navItems} />
    </div>
  )
}
