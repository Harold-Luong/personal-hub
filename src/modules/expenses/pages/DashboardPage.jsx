import MobileDashboardView from '../components/mobile/MobileDashboardView'
import WebDashboardView from '../components/web/WebDashboardView'
import {
  expenseNavItems,
  mockBudgets,
  mockCategories,
  mockSummary,
  mockTransactions,
  mockWallets,
} from '../data/mockExpenses'
import '../styles/expenses.scss'

export default function DashboardPage() {
  return (
    <div className="expenses-page expenses-dashboard-page">
      <MobileDashboardView
        categories={mockCategories}
        navItems={expenseNavItems}
        summary={mockSummary}
        transactions={mockTransactions}
      />
      <WebDashboardView
        budgets={mockBudgets}
        categories={mockCategories}
        navItems={expenseNavItems}
        summary={mockSummary}
        transactions={mockTransactions}
        wallets={mockWallets}
      />
    </div>
  )
}
