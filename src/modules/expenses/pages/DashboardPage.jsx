import { useState } from 'react'
import ExpenseBottomNav from '../components/layout/ExpenseBottomNav'
import MobileDashboardView from '../components/mobile/MobileDashboardView'
import WebDashboardView from '../components/web/WebDashboardView'
import AddTransactionPage from './AddTransactionPage'
import TransactionsPage from './TransactionsPage'
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
  const [activeMobilePage, setActiveMobilePage] = useState('dashboard')
  const [theme, setTheme] = useState(expenseThemes[0])
  const [transactions, setTransactions] = useState(mockTransactions)

  const handleToggleTheme = () => {
    setTheme((currentTheme) => {
      const currentIndex = expenseThemes.indexOf(currentTheme)
      const nextIndex = (currentIndex + 1) % expenseThemes.length

      return expenseThemes[nextIndex]
    })
  }

  const handleMobileNavigate = (pageId) => {
    if (
      pageId === 'dashboard' ||
      pageId === 'transactions' ||
      pageId === 'add'
    ) {
      setActiveMobilePage(pageId)
    }
  }

  const handleAddTransaction = (transaction) => {
    setTransactions((currentTransactions) => [
      transaction,
      ...currentTransactions,
    ])
    setActiveMobilePage('transactions')
  }

  const renderMobilePage = () => {
    if (activeMobilePage === 'add') {
      return (
        <AddTransactionPage
          categories={mockCategories}
          onCancel={() => setActiveMobilePage('dashboard')}
          onSubmit={handleAddTransaction}
          wallets={mockWallets}
        />
      )
    }

    if (activeMobilePage === 'transactions') {
      return (
        <TransactionsPage
          transactions={transactions}
        />
      )
    }

    return (
      <MobileDashboardView
        budgets={mockBudgets}
        categories={mockCategories}
        onToggleTheme={handleToggleTheme}
        summary={mockSummary}
        theme={theme}
        transactions={transactions}
      />
    )
  }

  return (
    <div className="expenses-page expenses-dashboard-page" data-theme={theme}>
      {renderMobilePage()}
      <ExpenseBottomNav
        activeId={activeMobilePage}
        items={expenseNavItems}
        onNavigate={handleMobileNavigate}
      />
      <WebDashboardView
        budgets={mockBudgets}
        categories={mockCategories}
        navItems={expenseNavItems}
        onToggleTheme={handleToggleTheme}
        summary={mockSummary}
        theme={theme}
        transactions={transactions}
        wallets={mockWallets}
      />
    </div>
  )
}
