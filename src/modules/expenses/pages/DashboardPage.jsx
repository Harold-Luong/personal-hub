import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import ExpenseBottomNav from "../components/layout/ExpenseBottomNav";
import MobileDashboardView from "../components/mobile/MobileDashboardView";
import WebDashboardView from "../components/web/WebDashboardView";
import AddTransactionPage from "./AddTransactionPage";
import BudgetPage from "./BudgetPage";
import SettingsPage from "./SettingsPage";
import TransactionsPage from "./TransactionsPage";
import WalletPage from "./WalletPage";
import { expenseCurrencies, expenseNavItems, expenseSummaryItems, expenseThemes } from "../constant/expensesMetaData";
import { getCategorySpendingByMonth } from "../utils/categorySpendingUtils";
import { calculateTrend, getEmptyMonthlyStats, getPreviousMonthKey } from "../utils/monthlyStatsUtils";
import "../styles/expenses.scss";

function getCurrentMonthKey() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    return `${today.getFullYear()}-${month}`;
}

function getMonthLabel(monthKey) {
    const [year, month] = monthKey.split("-");

    return month && year ? `${month}/${year}` : monthKey;
}

function getInitialSettings(initialSettings) {
    return {
        currency: expenseCurrencies.includes(initialSettings?.currency) ? initialSettings.currency : "VND",
        hideBalance: typeof initialSettings?.hideBalance === "boolean" ? initialSettings.hideBalance : false,
        notificationsEnabled:
            typeof initialSettings?.notificationsEnabled === "boolean" ? initialSettings.notificationsEnabled : true,
        theme: expenseThemes.includes(initialSettings?.theme) ? initialSettings.theme : expenseThemes[0],
    };
}

function sortWallets(firstWallet, secondWallet) {
    if (firstWallet.isDefault !== secondWallet.isDefault) {
        return firstWallet.isDefault ? -1 : 1;
    }

    return (
        (firstWallet.order ?? Number.MAX_SAFE_INTEGER) -
        (secondWallet.order ?? Number.MAX_SAFE_INTEGER)
    );
}

const expenseRoutePaths = {
    dashboard: "/expenses/dashboard",
    transactions: "/expenses/transactions",
};

function getExpenseRoutePage(pathname) {
    const normalizedPathname = pathname.replace(/\/+$/, "") || "/";

    return Object.entries(expenseRoutePaths).find(([, path]) => path === normalizedPathname)?.[0] ?? "dashboard";
}

export default function DashboardPage({ initialSettings, onLogout, user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const routePage = getExpenseRoutePage(location.pathname);
    const [mobilePageOverride, setMobilePageOverride] = useState(null);
    const activeMobilePage =
        mobilePageOverride?.routePath === location.pathname ? mobilePageOverride.pageId : routePage;
    const activeDesktopPage = routePage;
    const [areThemeTransitionsEnabled, setAreThemeTransitionsEnabled] = useState(false);
    const [settings, setSettings] = useState(() => getInitialSettings(initialSettings));
    const [settingsError, setSettingsError] = useState("");
    const confirmedSettingsRef = useRef(settings);
    const settingRevisionsRef = useRef({});
    const settingsRef = useRef(settings);
    const settingsWriteQueueRef = useRef(Promise.resolve());
    const [categories, setCategories] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState(() => getEmptyMonthlyStats(getCurrentMonthKey()));
    const [previousMonthlyStats, setPreviousMonthlyStats] = useState(() =>
        getEmptyMonthlyStats(getPreviousMonthKey(getCurrentMonthKey())),
    );
    const [wallets, setWallets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [budgetLimits, setBudgetLimits] = useState([]);
    const currentMonthKey = getCurrentMonthKey();
    const previousMonthKey = getPreviousMonthKey(currentMonthKey);
    const currentMonthLabel = getMonthLabel(currentMonthKey);

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            setAreThemeTransitionsEnabled(true);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    useEffect(() => {
        let isCancelled = false;

        import("../api/categoriesRepository")
            .then(({ getExpenseCategories }) => getExpenseCategories(user.uid))
            .then((nextCategories) => {
                if (!isCancelled) {
                    setCategories(nextCategories);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setCategories([]);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [user.uid]);

    useEffect(() => {
        let isCancelled = false;

        import("../api/walletsRepository")
            .then(({ getExpenseWallets }) => getExpenseWallets(user.uid))
            .then((nextWallets) => {
                if (!isCancelled) {
                    setWallets(nextWallets);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setWallets([]);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [user.uid]);

    useEffect(() => {
        let isCancelled = false;

        import("../api/monthlyStatsRepository")
            .then(({ getExpenseMonthlyStats }) =>
                Promise.all([
                    getExpenseMonthlyStats(user.uid, currentMonthKey),
                    getExpenseMonthlyStats(user.uid, previousMonthKey),
                ]),
            )
            .then(([nextMonthlyStats, nextPreviousMonthlyStats]) => {
                if (!isCancelled) {
                    setMonthlyStats(nextMonthlyStats);
                    setPreviousMonthlyStats(nextPreviousMonthlyStats);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setMonthlyStats(getEmptyMonthlyStats(currentMonthKey));
                    setPreviousMonthlyStats(getEmptyMonthlyStats(previousMonthKey));
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [currentMonthKey, previousMonthKey, user.uid]);

    useEffect(() => {
        let isCancelled = false;

        import("../api/budgetsRepository")
            .then(({ getExpenseBudgets }) => getExpenseBudgets(user.uid, currentMonthKey))
            .then((nextBudgets) => {
                if (!isCancelled) {
                    setBudgetLimits(nextBudgets);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setBudgetLimits([]);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [currentMonthKey, user.uid]);

    useEffect(() => {
        let isCancelled = false;

        import("../api/transactionsRepository")
            .then(({ getExpenseTransactions }) => getExpenseTransactions(user.uid, 10))
            .then((nextTransactions) => {
                if (!isCancelled) {
                    setTransactions(nextTransactions);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setTransactions([]);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [user.uid]);

    const monthlyIncome = monthlyStats.incomeMinor ?? 0;
    const monthlyExpense = monthlyStats.expenseMinor ?? 0;
    const monthlySaving = monthlyStats.netMinor ?? monthlyIncome - monthlyExpense;
    const previousMonthlyIncome = previousMonthlyStats.incomeMinor ?? 0;
    const previousMonthlyExpense = previousMonthlyStats.expenseMinor ?? 0;
    const previousMonthlySaving = previousMonthlyStats.netMinor ?? previousMonthlyIncome - previousMonthlyExpense;
    const categorySpendingById = monthlyStats.categoryExpenseMinor ?? {};
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    const categorySpending = getCategorySpendingByMonth({
        categories,
        monthKey: currentMonthKey,
        monthlyStats,
    });
    const budgets = budgetLimits
        .map((budget) => {
            const category = categoriesById.get(budget.categoryId);

            return {
                id: budget.id,
                categoryId: budget.categoryId,
                category: category?.name ?? budget.categoryId,
                amount: categorySpendingById[budget.categoryId] ?? 0,
                limit: budget.limitMinor,
                alertThreshold: budget.alertThreshold,
                color: category?.color ?? "#b8bec8",
                icon: category?.icon ?? "more",
            };
        })
        .filter((budget) => budget.limit > 0);
    const totalWalletBalance = wallets.reduce((total, wallet) => total + wallet.balance, 0);
    const summary = expenseSummaryItems.map((item) => {
        if (item.id === "balance") {
            return {
                ...item,
                trend: 0,
                value: totalWalletBalance,
            };
        }

        if (item.id === "income") {
            return {
                ...item,
                trend: calculateTrend(monthlyIncome, previousMonthlyIncome),
                value: monthlyIncome,
            };
        }

        if (item.id === "expense") {
            return {
                ...item,
                trend: calculateTrend(monthlyExpense, previousMonthlyExpense),
                value: monthlyExpense,
            };
        }

        if (item.id === "saving") {
            return {
                ...item,
                trend: calculateTrend(monthlySaving, previousMonthlySaving),
                value: monthlySaving,
            };
        }

        return item;
    });

    const handleSettingChange = (key, nextValue) => {
        if (nextValue === settingsRef.current[key]) {
            return;
        }

        const revision = (settingRevisionsRef.current[key] ?? 0) + 1;
        settingRevisionsRef.current[key] = revision;
        settingsRef.current = {
            ...settingsRef.current,
            [key]: nextValue,
        };

        setSettings(settingsRef.current);
        setSettingsError("");

        const writePromise = settingsWriteQueueRef.current
            .catch(() => {})
            .then(async () => {
                const { updateExpenseSettings } = await import("../api/expenseSettingsRepository");

                await updateExpenseSettings(user.uid, {
                    [key]: nextValue,
                });
                confirmedSettingsRef.current = {
                    ...confirmedSettingsRef.current,
                    [key]: nextValue,
                };
            });

        settingsWriteQueueRef.current = writePromise;

        writePromise.catch(() => {
            if (settingRevisionsRef.current[key] === revision) {
                settingsRef.current = {
                    ...settingsRef.current,
                    [key]: confirmedSettingsRef.current[key],
                };
                setSettings(settingsRef.current);
                setSettingsError("Không thể lưu cài đặt. Vui lòng kiểm tra kết nối và thử lại.");
            }
        });
    };

    const handleThemeChange = (nextTheme) => {
        if (expenseThemes.includes(nextTheme)) {
            handleSettingChange("theme", nextTheme);
        }
    };

    const handleToggleTheme = () => {
        const currentIndex = expenseThemes.indexOf(settingsRef.current.theme);
        const nextIndex = (currentIndex + 1) % expenseThemes.length;

        handleThemeChange(expenseThemes[nextIndex]);
    };

    const handleLogout = async () => {
        await settingsWriteQueueRef.current;
        await onLogout();
    };

    const navigateExpenseRoute = (pageId) => {
        const routePath = expenseRoutePaths[pageId];

        if (routePath) {
            setMobilePageOverride(null);
            navigate(routePath);
        }
    };

    const showMobilePage = (pageId) => {
        setMobilePageOverride({
            pageId,
            routePath: location.pathname,
        });
    };

    const handleMobileNavigate = (pageId) => {
        if (pageId === "dashboard" || pageId === "transactions") {
            navigateExpenseRoute(pageId);
            return;
        }

        if (
            pageId === "add" ||
            pageId === "budget" ||
            pageId === "wallets" ||
            pageId === "settings"
        ) {
            showMobilePage(pageId);
        }
    };

    const handleDesktopNavigate = (pageId) => {
        if (pageId === "dashboard" || pageId === "transactions") {
            navigateExpenseRoute(pageId);
        }
    };

    const sortTransactionList = (nextTransactions) =>
        [...nextTransactions].sort((first, second) => {
            const firstValue = `${first.date ?? ""}T${first.time ?? ""}`;
            const secondValue = `${second.date ?? ""}T${second.time ?? ""}`;

            return secondValue.localeCompare(firstValue);
        });

    const applyWalletBalanceUpdates = (walletBalanceUpdates = {}) => {
        setWallets((currentWallets) =>
            currentWallets.map((wallet) =>
                Object.hasOwn(walletBalanceUpdates, wallet.id)
                    ? {
                          ...wallet,
                          balance: walletBalanceUpdates[wallet.id],
                      }
                    : wallet,
            ),
        );
    };

    const applyMonthlyStatsUpdates = (monthlyStatsUpdates = {}) => {
        if (monthlyStatsUpdates[currentMonthKey]) {
            setMonthlyStats(monthlyStatsUpdates[currentMonthKey]);
        }

        if (monthlyStatsUpdates[previousMonthKey]) {
            setPreviousMonthlyStats(monthlyStatsUpdates[previousMonthKey]);
        }
    };

    const handleAddTransaction = async (transaction) => {
        const { createExpenseTransaction } = await import("../api/transactionsRepository");
        const result = await createExpenseTransaction(user.uid, transaction);

        setTransactions((currentTransactions) => sortTransactionList([result.transaction, ...currentTransactions]).slice(0, 10));
        applyWalletBalanceUpdates(result.walletBalanceUpdates);
        if (result.monthlyStats?.monthKey === currentMonthKey) {
            setMonthlyStats(result.monthlyStats);
        }
        if (result.monthlyStats?.monthKey === previousMonthKey) {
            setPreviousMonthlyStats(result.monthlyStats);
        }

        return result;
    };

    const handleAddMobileTransaction = async (transaction) => {
        const result = await handleAddTransaction(transaction);

        navigateExpenseRoute("transactions");

        return result;
    };

    const handleUpdateTransaction = async (transactionId, transaction) => {
        const { updateExpenseTransaction } = await import("../api/transactionsRepository");
        const result = await updateExpenseTransaction(user.uid, transactionId, transaction);

        setTransactions((currentTransactions) =>
            sortTransactionList(
                currentTransactions.map((currentTransaction) =>
                    currentTransaction.id === result.transaction.id ? result.transaction : currentTransaction,
                ),
            ),
        );
        applyWalletBalanceUpdates(result.walletBalanceUpdates);
        applyMonthlyStatsUpdates(result.monthlyStatsUpdates);

        return result;
    };

    const handleDeleteTransaction = async (transactionId) => {
        const { voidExpenseTransaction } = await import("../api/transactionsRepository");
        const result = await voidExpenseTransaction(user.uid, transactionId);

        setTransactions((currentTransactions) =>
            currentTransactions.filter((currentTransaction) => currentTransaction.id !== transactionId),
        );
        applyWalletBalanceUpdates(result.walletBalanceUpdates);
        applyMonthlyStatsUpdates(result.monthlyStatsUpdates);

        return result;
    };

    const handleSaveBudget = async (budget) => {
        const { upsertExpenseBudget } = await import("../api/budgetsRepository");
        const result = await upsertExpenseBudget(user.uid, {
            ...budget,
            monthKey: currentMonthKey,
        });

        setBudgetLimits((currentBudgets) => {
            const existingBudgetIndex = currentBudgets.findIndex(
                (currentBudget) =>
                    currentBudget.monthKey === result.monthKey && currentBudget.categoryId === result.categoryId,
            );

            if (existingBudgetIndex === -1) {
                return [...currentBudgets, result];
            }

            return currentBudgets.map((currentBudget, index) =>
                index === existingBudgetIndex ? result : currentBudget,
            );
        });
    };

    const handleDeleteBudget = async (budget) => {
        const { deleteExpenseBudget } = await import("../api/budgetsRepository");
        const result = await deleteExpenseBudget(user.uid, {
            ...budget,
            monthKey: currentMonthKey,
        });

        setBudgetLimits((currentBudgets) =>
            currentBudgets.filter(
                (currentBudget) =>
                    currentBudget.monthKey !== result.monthKey || currentBudget.categoryId !== result.categoryId,
            ),
        );
    };

    const handleSaveWallet = async (wallet) => {
        const { upsertExpenseWallet } = await import("../api/walletsRepository");
        const result = await upsertExpenseWallet(user.uid, wallet);
        const savedWallet = result.wallet ?? result;

        setWallets((currentWallets) => {
            const nextWallets = savedWallet.isDefault
                ? currentWallets.map((currentWallet) => ({
                      ...currentWallet,
                      isDefault: currentWallet.id === savedWallet.id,
                  }))
                : currentWallets;
            const existingWalletIndex = nextWallets.findIndex((currentWallet) => currentWallet.id === savedWallet.id);

            if (existingWalletIndex === -1) {
                return [...nextWallets, savedWallet].sort(sortWallets);
            }

            return nextWallets
                .map((currentWallet, index) => (index === existingWalletIndex ? savedWallet : currentWallet))
                .sort(sortWallets);
        });

        if (result.adjustmentTransaction) {
            setTransactions((currentTransactions) =>
                sortTransactionList([result.adjustmentTransaction, ...currentTransactions]).slice(0, 10),
            );
        }
    };

    const handleDeleteWallet = async (wallet) => {
        const { deleteExpenseWallet } = await import("../api/walletsRepository");
        const result = await deleteExpenseWallet(user.uid, wallet);

        setWallets((currentWallets) =>
            currentWallets
                .filter((currentWallet) => currentWallet.id !== result.id)
                .map((currentWallet) => ({
                    ...currentWallet,
                    isDefault:
                        currentWallet.id === result.replacementDefaultWalletId ? true : currentWallet.isDefault,
                }))
                .sort(sortWallets),
        );
    };

    const renderMobilePage = () => {
        if (activeMobilePage === "add") {
            return (
                <AddTransactionPage
                    categories={categories}
                    onCancel={() => navigateExpenseRoute("dashboard")}
                    onSubmit={handleAddMobileTransaction}
                    wallets={wallets}
                />
            );
        }

        if (activeMobilePage === "transactions") {
            return (
                <TransactionsPage
                    categories={categories}
                    mode="mobile"
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onUpdateTransaction={handleUpdateTransaction}
                    transactions={transactions}
                    user={user}
                    wallets={wallets}
                />
            );
        }

        if (activeMobilePage === "budget") {
            return (
                <BudgetPage
                    budgets={budgets}
                    categories={categories}
                    monthKey={currentMonthKey}
                    onBack={() => navigateExpenseRoute("dashboard")}
                    onDeleteBudget={handleDeleteBudget}
                    onSaveBudget={handleSaveBudget}
                />
            );
        }

        if (activeMobilePage === "wallets") {
            return (
                <WalletPage
                    onBack={() => showMobilePage("settings")}
                    onDeleteWallet={handleDeleteWallet}
                    onSaveWallet={handleSaveWallet}
                    wallets={wallets}
                />
            );
        }

        if (activeMobilePage === "settings") {
            return (
                <SettingsPage
                    currency={settings.currency}
                    hideBalance={settings.hideBalance}
                    notificationsEnabled={settings.notificationsEnabled}
                    onLogout={handleLogout}
                    onManageBudget={() => showMobilePage("budget")}
                    onManageWallet={() => showMobilePage("wallets")}
                    onSettingChange={handleSettingChange}
                    onThemeChange={handleThemeChange}
                    settingsError={settingsError}
                    theme={settings.theme}
                    user={user}
                    wallets={wallets}
                />
            );
        }

        return (
            <MobileDashboardView
                budgets={budgets}
                categorySpending={categorySpending}
                monthLabel={currentMonthLabel}
                onManageBudget={() => showMobilePage("budget")}
                onToggleTheme={handleToggleTheme}
                onViewTransactions={() => navigateExpenseRoute("transactions")}
                summary={summary}
                theme={settings.theme}
                transactions={transactions}
                user={user}
            />
        );
    };

    const renderDesktopPage = () => {
        if (activeDesktopPage === "transactions") {
            return (
                <TransactionsPage
                    categories={categories}
                    mode="desktop"
                    navItems={expenseNavItems}
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onLogout={handleLogout}
                    onNavigate={handleDesktopNavigate}
                    onToggleTheme={handleToggleTheme}
                    onUpdateTransaction={handleUpdateTransaction}
                    theme={settings.theme}
                    transactions={transactions}
                    user={user}
                    wallets={wallets}
                />
            );
        }

        return (
            <WebDashboardView
                budgets={budgets}
                categories={categories}
                categorySpending={categorySpending}
                monthLabel={currentMonthLabel}
                navItems={expenseNavItems}
                onAddTransaction={handleAddTransaction}
                onDeleteBudget={handleDeleteBudget}
                onDeleteWallet={handleDeleteWallet}
                onLogout={handleLogout}
                onNavigate={handleDesktopNavigate}
                onSaveBudget={handleSaveBudget}
                onSaveWallet={handleSaveWallet}
                onToggleTheme={handleToggleTheme}
                onViewTransactions={() => navigateExpenseRoute("transactions")}
                summary={summary}
                theme={settings.theme}
                transactions={transactions}
                user={user}
                wallets={wallets}
            />
        );
    };

    return (
        <div
            className={`expenses-page expenses-dashboard-page${areThemeTransitionsEnabled ? " is-theme-ready" : ""}`}
            data-theme={settings.theme}
        >
            {renderMobilePage()}
            <ExpenseBottomNav activeId={activeMobilePage} items={expenseNavItems} onNavigate={handleMobileNavigate} />
            {renderDesktopPage()}
        </div>
    );
}
