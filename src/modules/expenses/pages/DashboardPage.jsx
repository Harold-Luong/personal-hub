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
    mockCategories,
    mockSummary,
    mockTransactions,
    mockWallets,
} from '../data/mockExpenses'
import '../styles/expenses.scss'

const expenseThemes = ['sage', 'fjord', 'clay', 'blossom', 'vintage', 'retro']
const expenseCurrencies = ['VND', 'USD']

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
    const [transactions, setTransactions] = useState(mockTransactions)

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            setAreThemeTransitionsEnabled(true)
        })

        return () => window.cancelAnimationFrame(frameId)
    }, [])

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
                    wallets={mockWallets}
                />
            )
        }

        return (
            <MobileDashboardView
                budgets={mockBudgets}
                categories={mockCategories}
                onToggleTheme={handleToggleTheme}
                summary={mockSummary}
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
                categories={mockCategories}
                navItems={expenseNavItems}
                onLogout={handleLogout}
                onToggleTheme={handleToggleTheme}
                summary={mockSummary}
                theme={settings.theme}
                transactions={transactions}
                user={user}
                wallets={mockWallets}
            />
        </div>
    )
}
