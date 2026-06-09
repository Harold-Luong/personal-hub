import { useState } from 'react'
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

const expenseThemes = ['sage', 'fjord', 'clay', 'blossom', 'vintage', 'retro']

export default function DashboardPage() {
  const [theme, setTheme] = useState(expenseThemes[0])

  const handleToggleTheme = () => {
    setTheme((currentTheme) => {
      const currentIndex = expenseThemes.indexOf(currentTheme)
      const nextIndex = (currentIndex + 1) % expenseThemes.length

      return expenseThemes[nextIndex]
    })
  }

  return (
    <div className="expenses-page expenses-dashboard-page" data-theme={theme}>
      <MobileDashboardView
        budgets={mockBudgets}
        categories={mockCategories}
        navItems={expenseNavItems}
        onToggleTheme={handleToggleTheme}
        summary={mockSummary}
        theme={theme}
        transactions={mockTransactions}
      />
      <WebDashboardView
        budgets={mockBudgets}
        categories={mockCategories}
        navItems={expenseNavItems}
        onToggleTheme={handleToggleTheme}
        summary={mockSummary}
        theme={theme}
        transactions={mockTransactions}
        wallets={mockWallets}
      />
    </div>
  )
}
