import { useEffect, useRef, useState } from 'react'
import ExpenseBottomNav from '../components/layout/ExpenseBottomNav'
import MobileDashboardView from '../components/mobile/MobileDashboardView'
import WebDashboardView from '../components/web/WebDashboardView'
import AddTransactionPage from './AddTransactionPage'
import SettingsPage from './SettingsPage'
import TransactionsPage from './TransactionsPage'
import { expenseNavItems } from '../data/mockExpenses'
import {
    calculateTrend,
    getEmptyMonthlyStats,
    getPreviousMonthKey,
} from '../utils/monthlyStatsUtils'
import '../styles/expenses.scss'

const expenseThemes = ['sage', 'fjord', 'clay', 'blossom', 'vintage', 'retro']
const expenseCurrencies = ['VND', 'USD']
const expenseSummaryItems = [
    {
        id: 'balance',
        label: 'Tổng số dư',
        tone: 'positive',
        icon: 'eye',
    },
    {
        id: 'income',
        label: 'Tổng thu nhập',
        tone: 'positive',
        icon: 'wallet',
    },
    {
        id: 'expense',
        label: 'Tổng chi tiêu',
        tone: 'danger',
        icon: 'card',
    },
    {
        id: 'saving',
        label: 'Tiết kiệm',
        tone: 'warning',
        icon: 'saving',
    },
]

function getCurrentMonthKey() {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')

    return `${today.getFullYear()}-${month}`
}

function getInitialSettings(initialSettings) {
    return {
        currency: expenseCurrencies.includes(initialSettings?.currency)
            ? initialSettings.currency
            : 'VND',
        hideBalance:
            typeof initialSettings?.hideBalance === 'boolean'
                ? initialSettings.hideBalance
                : false,
        notificationsEnabled:
            typeof initialSettings?.notificationsEnabled === 'boolean'
                ? initialSettings.notificationsEnabled
                : true,
        theme: expenseThemes.includes(initialSettings?.theme)
            ? initialSettings.theme
            : expenseThemes[0],
    }
}

export default function DashboardPage({ initialSettings, onLogout, user }) {
    const [activeMobilePage, setActiveMobilePage] = useState('dashboard')
    const [areThemeTransitionsEnabled, setAreThemeTransitionsEnabled] =
        useState(false)
    const [settings, setSettings] = useState(() =>
        getInitialSettings(initialSettings),
    )
    const [settingsError, setSettingsError] = useState('')
    const confirmedSettingsRef = useRef(settings)
    const settingRevisionsRef = useRef({})
    const settingsRef = useRef(settings)
    const settingsWriteQueueRef = useRef(Promise.resolve())
    const [categories, setCategories] = useState([])
    const [monthlyStats, setMonthlyStats] = useState(() =>
        getEmptyMonthlyStats(getCurrentMonthKey()),
    )
    const [previousMonthlyStats, setPreviousMonthlyStats] = useState(() =>
        getEmptyMonthlyStats(getPreviousMonthKey(getCurrentMonthKey())),
    )
    const [wallets, setWallets] = useState([])
    const [transactions, setTransactions] = useState([])
    const [budgetLimits, setBudgetLimits] = useState([])
    const currentMonthKey = getCurrentMonthKey()
    const previousMonthKey = getPreviousMonthKey(currentMonthKey)

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            setAreThemeTransitionsEnabled(true)
        })

        return () => window.cancelAnimationFrame(frameId)
    }, [])

    useEffect(() => {
        let isCancelled = false

        import('../api/categoriesRepository')
            .then(({ getExpenseCategories }) => getExpenseCategories(user.uid))
            .then((nextCategories) => {
                if (!isCancelled) {
                    setCategories(nextCategories)
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setCategories([])
                }
            })

        return () => {
            isCancelled = true
        }
    }, [user.uid])

    useEffect(() => {
        let isCancelled = false

        import('../api/walletsRepository')
            .then(({ getExpenseWallets }) => getExpenseWallets(user.uid))
            .then((nextWallets) => {
                if (!isCancelled) {
                    setWallets(nextWallets)
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setWallets([])
                }
            })

        return () => {
            isCancelled = true
        }
    }, [user.uid])

    useEffect(() => {
        let isCancelled = false

        import('../api/monthlyStatsRepository')
            .then(({ getExpenseMonthlyStats }) =>
                Promise.all([
                    getExpenseMonthlyStats(user.uid, currentMonthKey),
                    getExpenseMonthlyStats(user.uid, previousMonthKey),
                ]),
            )
            .then(([nextMonthlyStats, nextPreviousMonthlyStats]) => {
                if (!isCancelled) {
                    setMonthlyStats(nextMonthlyStats)
                    setPreviousMonthlyStats(nextPreviousMonthlyStats)
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setMonthlyStats(getEmptyMonthlyStats(currentMonthKey))
                    setPreviousMonthlyStats(getEmptyMonthlyStats(previousMonthKey))
                }
            })

        return () => {
            isCancelled = true
        }
    }, [currentMonthKey, previousMonthKey, user.uid])

    useEffect(() => {
        let isCancelled = false

        import('../api/budgetsRepository')
            .then(({ getExpenseBudgets }) =>
                getExpenseBudgets(user.uid, currentMonthKey),
            )
            .then((nextBudgets) => {
                if (!isCancelled) {
                    setBudgetLimits(nextBudgets)
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setBudgetLimits([])
                }
            })

        return () => {
            isCancelled = true
        }
    }, [currentMonthKey, user.uid])

    useEffect(() => {
        let isCancelled = false

        import('../api/transactionsRepository')
            .then(({ getExpenseTransactions }) => getExpenseTransactions(user.uid))
            .then((nextTransactions) => {
                if (!isCancelled) {
                    setTransactions(nextTransactions)
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setTransactions([])
                }
            })

        return () => {
            isCancelled = true
        }
    }, [user.uid])

    const monthlyIncome = monthlyStats.incomeMinor ?? 0
    const monthlyExpense = monthlyStats.expenseMinor ?? 0
    const monthlySaving = monthlyStats.netMinor ?? monthlyIncome - monthlyExpense
    const previousMonthlyIncome = previousMonthlyStats.incomeMinor ?? 0
    const previousMonthlyExpense = previousMonthlyStats.expenseMinor ?? 0
    const previousMonthlySaving =
        previousMonthlyStats.netMinor
        ?? previousMonthlyIncome - previousMonthlyExpense
    const categorySpendingById = monthlyStats.categoryExpenseMinor ?? {}
    const categoriesById = new Map(
        categories.map((category) => [category.id, category]),
    )
    const categorySpending = categories
        .filter((category) => category.type === 'expense')
        .map((category) => ({
            ...category,
            amount: categorySpendingById[category.id] ?? 0,
            percentage:
                monthlyExpense > 0
                    ? Math.round(
                        ((categorySpendingById[category.id] ?? 0)
                            / monthlyExpense)
                        * 100,
                    )
                    : 0,
        }))
        .filter((category) => category.amount > 0)
    const budgets = budgetLimits
        .map((budget) => {
            const category = categoriesById.get(budget.categoryId)

            return {
                id: budget.id,
                categoryId: budget.categoryId,
                category: category?.name ?? budget.categoryId,
                amount: categorySpendingById[budget.categoryId] ?? 0,
                limit: budget.limitMinor,
                alertThreshold: budget.alertThreshold,
                color: category?.color ?? '#b8bec8',
                icon: category?.icon ?? 'more',
            }
        })
        .filter((budget) => budget.limit > 0)
    const totalWalletBalance = wallets.reduce(
        (total, wallet) => total + wallet.balance,
        0,
    )
    const summary = expenseSummaryItems.map((item) => {
        if (item.id === 'balance') {
            return {
                ...item,
                trend: 0,
                value: totalWalletBalance,
            }
        }

        if (item.id === 'income') {
            return {
                ...item,
                trend: calculateTrend(monthlyIncome, previousMonthlyIncome),
                value: monthlyIncome,
            }
        }

        if (item.id === 'expense') {
            return {
                ...item,
                trend: calculateTrend(monthlyExpense, previousMonthlyExpense),
                value: monthlyExpense,
            }
        }

        if (item.id === 'saving') {
            return {
                ...item,
                trend: calculateTrend(monthlySaving, previousMonthlySaving),
                value: monthlySaving,
            }
        }

        return item
    })

    const handleSettingChange = (key, nextValue) => {
        if (nextValue === settingsRef.current[key]) {
            return
        }

        const revision = (settingRevisionsRef.current[key] ?? 0) + 1
        settingRevisionsRef.current[key] = revision
        settingsRef.current = {
            ...settingsRef.current,
            [key]: nextValue,
        }

        setSettings(settingsRef.current)
        setSettingsError('')

        const writePromise = settingsWriteQueueRef.current
            .catch(() => { })
            .then(async () => {
                const { updateExpenseSettings } = await import(
                    '../api/expenseSettingsRepository'
                )

                await updateExpenseSettings(user.uid, {
                    [key]: nextValue,
                })
                confirmedSettingsRef.current = {
                    ...confirmedSettingsRef.current,
                    [key]: nextValue,
                }
            })

        settingsWriteQueueRef.current = writePromise

        writePromise.catch(() => {
            if (settingRevisionsRef.current[key] === revision) {
                settingsRef.current = {
                    ...settingsRef.current,
                    [key]: confirmedSettingsRef.current[key],
                }
                setSettings(settingsRef.current)
                setSettingsError(
                    'Không thể lưu cài đặt. Vui lòng kiểm tra kết nối và thử lại.',
                )
            }
        })
    }

    const handleThemeChange = (nextTheme) => {
        if (expenseThemes.includes(nextTheme)) {
            handleSettingChange('theme', nextTheme)
        }
    }

    const handleToggleTheme = () => {
        const currentIndex = expenseThemes.indexOf(settingsRef.current.theme)
        const nextIndex = (currentIndex + 1) % expenseThemes.length

        handleThemeChange(expenseThemes[nextIndex])
    }

    const handleLogout = async () => {
        await settingsWriteQueueRef.current
        await onLogout()
    }

    const handleMobileNavigate = (pageId) => {
        if (
            pageId === 'dashboard' ||
            pageId === 'transactions' ||
            pageId === 'add' ||
            pageId === 'settings'
        ) {
            setActiveMobilePage(pageId)
        }
    }

    const handleAddTransaction = async (transaction) => {
        const { createExpenseTransaction } = await import(
            '../api/transactionsRepository'
        )
        const result = await createExpenseTransaction(user.uid, transaction)

        setTransactions((currentTransactions) => [
            result.transaction,
            ...currentTransactions,
        ])
        setWallets((currentWallets) =>
            currentWallets.map((wallet) =>
                Object.hasOwn(result.walletBalanceUpdates, wallet.id)
                    ? {
                        ...wallet,
                        balance: result.walletBalanceUpdates[wallet.id],
                    }
                    : wallet,
            ),
        )
        if (result.monthlyStats?.monthKey === currentMonthKey) {
            setMonthlyStats(result.monthlyStats)
        }
        setActiveMobilePage('transactions')
    }

    const renderMobilePage = () => {
        if (activeMobilePage === 'add') {
            return (
                <AddTransactionPage
                    categories={categories}
                    onCancel={() => setActiveMobilePage('dashboard')}
                    onSubmit={handleAddTransaction}
                    wallets={wallets}
                />
            )
        }

        if (activeMobilePage === 'transactions') {
            return <TransactionsPage transactions={transactions} />
        }

        if (activeMobilePage === 'settings') {
            return (
                <SettingsPage
                    currency={settings.currency}
                    hideBalance={settings.hideBalance}
                    notificationsEnabled={settings.notificationsEnabled}
                    onLogout={handleLogout}
                    onSettingChange={handleSettingChange}
                    onThemeChange={handleThemeChange}
                    settingsError={settingsError}
                    theme={settings.theme}
                    user={user}
                    wallets={wallets}
                />
            )
        }

        return (
            <MobileDashboardView
                budgets={budgets}
                categorySpending={categorySpending}
                onToggleTheme={handleToggleTheme}
                summary={summary}
                theme={settings.theme}
                transactions={transactions}
                user={user}
            />
        )
    }

    return (
        <div
            className={`expenses-page expenses-dashboard-page${areThemeTransitionsEnabled ? ' is-theme-ready' : ''
                }`}
            data-theme={settings.theme}
        >
            {renderMobilePage()}
            <ExpenseBottomNav
                activeId={activeMobilePage}
                items={expenseNavItems}
                onNavigate={handleMobileNavigate}
            />
            <WebDashboardView
                budgets={budgets}
                categories={categories}
                categorySpending={categorySpending}
                navItems={expenseNavItems}
                onAddTransaction={handleAddTransaction}
                onLogout={handleLogout}
                onToggleTheme={handleToggleTheme}
                summary={summary}
                theme={settings.theme}
                transactions={transactions}
                user={user}
                wallets={wallets}
            />
        </div>
    )
}
