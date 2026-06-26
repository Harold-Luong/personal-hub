import { useEffect, useRef, useState } from 'react'
import ExpenseBottomNav from '../components/layout/ExpenseBottomNav'
import MobileDashboardView from '../components/mobile/MobileDashboardView'
import WebDashboardView from '../components/web/WebDashboardView'
import AddTransactionPage from './AddTransactionPage'
import SettingsPage from './SettingsPage'
import TransactionsPage from './TransactionsPage'
import {
    expenseNavItems,
    mockBudgets,
    mockSummary,
} from '../data/mockExpenses'
import '../styles/expenses.scss'

const expenseThemes = ['sage', 'fjord', 'clay', 'blossom', 'vintage', 'retro']
const expenseCurrencies = ['VND', 'USD']

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
    const [wallets, setWallets] = useState([])
    const [transactions, setTransactions] = useState([])

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

    // TODO: Move these dashboard statistics to Firestore monthlyStats later.
    // monthlyIncome, monthlyExpense, and categorySpendingById are temporary
    // client-side aggregates that will support richer reporting/statistics.
    const currentMonthKey = getCurrentMonthKey()
    const currentMonthTransactions = transactions.filter((transaction) =>
        transaction.date?.startsWith(currentMonthKey),
    )
    const monthlyIncome = currentMonthTransactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((total, transaction) => total + Math.max(transaction.amount, 0), 0)
    const monthlyExpense = currentMonthTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce(
            (total, transaction) => total + Math.abs(Math.min(transaction.amount, 0)),
            0,
        )
    const monthlySaving = monthlyIncome - monthlyExpense
    const categorySpendingById = currentMonthTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((result, transaction) => {
            const categoryId = transaction.category
            const currentAmount = result[categoryId] ?? 0

            return {
                ...result,
                [categoryId]: currentAmount + Math.abs(transaction.amount),
            }
        }, {})
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
    const totalWalletBalance = wallets.reduce(
        (total, wallet) => total + wallet.balance,
        0,
    )
    const summary = mockSummary.map((item) => {
        if (item.id === 'balance') {
            return {
                ...item,
                value: totalWalletBalance,
            }
        }

        if (item.id === 'income') {
            return {
                ...item,
                trend: 0,
                value: monthlyIncome,
            }
        }

        if (item.id === 'expense') {
            return {
                ...item,
                trend: 0,
                value: monthlyExpense,
            }
        }

        if (item.id === 'saving') {
            return {
                ...item,
                trend: 0,
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
                budgets={mockBudgets}
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
                budgets={mockBudgets}
                categorySpending={categorySpending}
                navItems={expenseNavItems}
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
