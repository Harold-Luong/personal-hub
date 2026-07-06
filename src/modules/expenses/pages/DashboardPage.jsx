import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { selectAuthUid, useAuthSessionStore } from "../../../stores/authSessionStore";
import {
    getExpenseMonthOptionsCacheKey,
    selectExpenseBudgetLimitsByMonth,
    selectExpenseCategories,
    selectExpenseMonthOptionsByYear,
    selectExpenseMonthlyStatsByMonth,
    selectExpenseRecentTransactions,
    selectExpenseWallets,
    useExpenseDataStore,
} from "../../../stores/expenseDataStore";
import {
    selectExpensePreferences,
    useExpensePreferencesStore,
} from "../../../stores/expensePreferencesStore";
import MobileBudgetFormSheet from "../components/budget/MobileBudgetFormSheet";
import ExpenseBottomNav from "../components/layout/ExpenseBottomNav";
import ExpenseHeader from "../components/layout/ExpenseHeader";
import ExpenseSidebar from "../components/layout/ExpenseSidebar";
import MobileDashboardView from "../components/mobile/MobileDashboardView";
import WebAddTransactionPanel from "../components/web/WebAddTransactionPanel";
import WebDashboardView from "../components/web/WebDashboardView";
import WebBudgetPanel from "../components/web/WebBudgetPanel";
import AddTransactionPage from "./AddTransactionPage";
import BudgetPage from "./BudgetPage";
import CategorySpendingPage from "./CategorySpendingPage";
import ReportPage from "./ReportPage";
import SettingsPage from "./SettingsPage";
import TransactionsPage from "./TransactionsPage";
import WalletPage from "./WalletPage";
import {
    expenseMobileOnlyPageIds,
    expenseNavItems,
    expenseRoutePaths,
    expenseSummaryItems,
    expenseThemeIds,
} from "../constant/expensesMetaData";
import { getCategorySpendingByMonth } from "../utils/categorySpendingUtils";
import { calculateTrend, getEmptyMonthlyStats, getPreviousMonthKey } from "../utils/monthlyStatsUtils";
import {
    getCompactMonthLabel,
    getCurrentMonthKey,
    getCurrentYear,
    getMonthLabel,
    getVisibleMonthOptions,
} from "../utils/monthUtils";
import "../styles/expenses.scss";

function getIsMobileViewport() {
    return typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
}

function getExpenseRoutePage(pathname) {
    const normalizedPathname = pathname.replace(/\/+$/, "") || "/";

    return Object.entries(expenseRoutePaths).find(([, path]) => path === normalizedPathname)?.[0] ?? "dashboard";
}

const desktopViewClasses = {
    categories: "web-category-spending-view",
    report: "web-report-view",
    transactions: "web-transactions-view",
};

const desktopMainClasses = {
    categories: "web-category-spending-view__main",
    report: "web-report-view__main",
    transactions: "web-transactions-view__main",
};

export default function DashboardPage({ initialSettings, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();
    const uid = useAuthSessionStore(selectAuthUid);
    const settings = useExpensePreferencesStore(selectExpensePreferences);
    const initializeExpensePreferences = useExpensePreferencesStore((state) => state.initializeExpensePreferences);
    const saveExpensePreference = useExpensePreferencesStore((state) => state.saveExpensePreference);
    const waitForExpensePreferenceWrites = useExpensePreferencesStore((state) => state.waitForExpensePreferenceWrites);
    const categories = useExpenseDataStore(selectExpenseCategories);
    const wallets = useExpenseDataStore(selectExpenseWallets);
    const transactions = useExpenseDataStore(selectExpenseRecentTransactions);
    const budgetLimitsByMonth = useExpenseDataStore(selectExpenseBudgetLimitsByMonth);
    const monthlyStatsByMonth = useExpenseDataStore(selectExpenseMonthlyStatsByMonth);
    const monthOptionsByYear = useExpenseDataStore(selectExpenseMonthOptionsByYear);
    const loadExpenseDashboardData = useExpenseDataStore((state) => state.loadExpenseDashboardData);
    const loadExpenseMonthOptions = useExpenseDataStore((state) => state.loadExpenseMonthOptions);
    const createExpenseTransactionAction = useExpenseDataStore((state) => state.createExpenseTransaction);
    const upsertExpenseBudgetAction = useExpenseDataStore((state) => state.upsertExpenseBudget);
    const deleteExpenseBudgetAction = useExpenseDataStore((state) => state.deleteExpenseBudget);
    const upsertExpenseWalletAction = useExpenseDataStore((state) => state.upsertExpenseWallet);
    const deleteExpenseWalletAction = useExpenseDataStore((state) => state.deleteExpenseWallet);
    const routePage = getExpenseRoutePage(location.pathname);
    const [mobilePageOverride, setMobilePageOverride] = useState(null);
    const activeMobilePage =
        mobilePageOverride?.routePath === location.pathname ? mobilePageOverride.pageId : routePage;
    const activeDesktopPage = routePage;
    const [areThemeTransitionsEnabled, setAreThemeTransitionsEnabled] = useState(false);
    const currentMonthKey = getCurrentMonthKey();
    const previousMonthKey = getPreviousMonthKey(currentMonthKey);
    const currentMonthLabel = getCompactMonthLabel(currentMonthKey);
    const currentYear = getCurrentYear();
    const monthOptionsCacheKey = getExpenseMonthOptionsCacheKey(uid, currentYear);
    const [categoryMonth, setCategoryMonth] = useState(currentMonthKey);
    const [categorySortKey, setCategorySortKey] = useState("amount");
    const [reportMonth, setReportMonth] = useState(currentMonthKey);
    const [isBudgetPanelOpen, setIsBudgetPanelOpen] = useState(false);
    const [budgetPanelCategoryId, setBudgetPanelCategoryId] = useState("");
    const [budgetPanelMonthKey, setBudgetPanelMonthKey] = useState(currentMonthKey);
    const [budgetPanelBudgets, setBudgetPanelBudgets] = useState(null);
    const [isDesktopAddTransactionOpen, setIsDesktopAddTransactionOpen] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);
    const budgetPanelCallbacksRef = useRef({});
    const monthlyStats = monthlyStatsByMonth[currentMonthKey] ?? getEmptyMonthlyStats(currentMonthKey);
    const previousMonthlyStats = monthlyStatsByMonth[previousMonthKey] ?? getEmptyMonthlyStats(previousMonthKey);
    const budgetLimits = budgetLimitsByMonth[currentMonthKey] ?? [];
    const monthOptions = useMemo(
        () => monthOptionsByYear[monthOptionsCacheKey] ?? [currentMonthKey],
        [currentMonthKey, monthOptionsByYear, monthOptionsCacheKey],
    );
    const categoryDisplayedMonthOptions = useMemo(
        () => getVisibleMonthOptions([...monthOptions, categoryMonth], currentMonthKey),
        [categoryMonth, currentMonthKey, monthOptions],
    );
    const reportDisplayedMonthOptions = useMemo(
        () => getVisibleMonthOptions([...monthOptions, reportMonth], currentMonthKey),
        [currentMonthKey, monthOptions, reportMonth],
    );

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            setAreThemeTransitionsEnabled(true);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    useEffect(() => {
        initializeExpensePreferences(initialSettings);
    }, [initialSettings, initializeExpensePreferences]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 900px)");
        const handleViewportChange = () => {
            setIsMobileViewport(mediaQuery.matches);
        };

        handleViewportChange();
        mediaQuery.addEventListener("change", handleViewportChange);

        return () => {
            mediaQuery.removeEventListener("change", handleViewportChange);
        };
    }, []);

    useEffect(() => {
        loadExpenseDashboardData(uid, {
            currentMonthKey,
            previousMonthKey,
        });
    }, [currentMonthKey, loadExpenseDashboardData, previousMonthKey, uid]);

    useEffect(() => {
        loadExpenseMonthOptions(uid, currentYear, currentMonthKey);
    }, [currentMonthKey, currentYear, loadExpenseMonthOptions, uid]);

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
        saveExpensePreference(uid, key, nextValue);
    };

    const handleThemeChange = (nextTheme) => {
        if (expenseThemeIds.includes(nextTheme)) {
            handleSettingChange("theme", nextTheme);
        }
    };

    const handleToggleTheme = () => {
        const currentIndex = expenseThemeIds.indexOf(settings.theme);
        const nextIndex = (currentIndex + 1) % expenseThemeIds.length;

        handleThemeChange(expenseThemeIds[nextIndex]);
    };

    const handleLogout = async () => {
        await waitForExpensePreferenceWrites();
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
        if (expenseRoutePaths[pageId]) {
            navigateExpenseRoute(pageId);
            return;
        }

        if (expenseMobileOnlyPageIds.includes(pageId)) {
            showMobilePage(pageId);
        }
    };

    const handleDesktopNavigate = (pageId) => {
        if (expenseRoutePaths[pageId]) {
            navigateExpenseRoute(pageId);
        }
    };

    const handleAddTransaction = async (transaction) => {
        return createExpenseTransactionAction(uid, transaction, {
            currentMonthKey,
            previousMonthKey,
        });
    };

    const handleAddMobileTransaction = async (transaction) => {
        const result = await handleAddTransaction(transaction);

        navigateExpenseRoute("transactions");

        return result;
    };

    const handleAddDesktopTransaction = async (transaction) => {
        const result = await handleAddTransaction(transaction);

        setIsDesktopAddTransactionOpen(false);

        return result;
    };

    const handleSaveBudget = async (budget, monthKey = currentMonthKey) => {
        return upsertExpenseBudgetAction(uid, budget, monthKey);
    };

    const handleDeleteBudget = async (budget, monthKey = currentMonthKey) => {
        return deleteExpenseBudgetAction(uid, budget, monthKey);
    };

    const openBudgetPanel = (categoryId = "", options = {}) => {
        budgetPanelCallbacksRef.current = {
            onDeleteBudget: options.onDeleteBudget,
            onSaveBudget: options.onSaveBudget,
        };
        setBudgetPanelCategoryId(typeof categoryId === "string" ? categoryId : "");
        setBudgetPanelMonthKey(options.monthKey ?? currentMonthKey);
        setBudgetPanelBudgets(Array.isArray(options.budgets) ? options.budgets : null);
        setIsBudgetPanelOpen(true);
    };

    const closeBudgetPanel = () => {
        budgetPanelCallbacksRef.current = {};
        setIsBudgetPanelOpen(false);
        setBudgetPanelCategoryId("");
        setBudgetPanelMonthKey(currentMonthKey);
        setBudgetPanelBudgets(null);
    };

    const handleSaveBudgetFromPanel = async (budget) => {
        const result = await handleSaveBudget(budget, budgetPanelMonthKey);

        budgetPanelCallbacksRef.current.onSaveBudget?.(result);
        closeBudgetPanel();

        return result;
    };

    const handleDeleteBudgetFromPanel = async (budget) => {
        const result = await handleDeleteBudget(budget, budgetPanelMonthKey);

        budgetPanelCallbacksRef.current.onDeleteBudget?.(result);
        closeBudgetPanel();

        return result;
    };

    const handleSaveWallet = async (wallet) => {
        await upsertExpenseWalletAction(uid, wallet);
    };

    const handleDeleteWallet = async (wallet) => {
        await deleteExpenseWalletAction(uid, wallet);
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
                    mode="mobile"
                />
            );
        }

        if (activeMobilePage === "categories") {
            return (
                <CategorySpendingPage
                    mode="mobile"
                    onManageBudget={openBudgetPanel}
                />
            );
        }

        if (activeMobilePage === "report") {
            return (
                <ReportPage
                    mode="mobile"
                    onNavigate={handleMobileNavigate}
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
                    onLogout={handleLogout}
                    onManageBudget={() => showMobilePage("budget")}
                    onManageWallet={() => showMobilePage("wallets")}
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
                onViewCategorySpending={() => navigateExpenseRoute("categories")}
                onViewTransactions={() => navigateExpenseRoute("transactions")}
                summary={summary}
                theme={settings.theme}
                transactions={transactions}
            />
        );
    };

    const renderDesktopPage = () => {
        if (activeDesktopPage === "transactions") {
            return (
                <TransactionsPage
                    mode="desktop"
                />
            );
        }

        if (activeDesktopPage === "categories") {
            return (
                <CategorySpendingPage
                    key={categoryMonth}
                    monthOptions={monthOptions}
                    mode="desktop"
                    onManageBudget={openBudgetPanel}
                    onSelectedMonthChange={setCategoryMonth}
                    onSortKeyChange={setCategorySortKey}
                    selectedMonth={categoryMonth}
                    sortKey={categorySortKey}
                />
            );
        }

        if (activeDesktopPage === "report") {
            return (
                <ReportPage
                    monthOptions={monthOptions}
                    mode="desktop"
                    onNavigate={handleDesktopNavigate}
                    onSelectedMonthChange={setReportMonth}
                    selectedMonth={reportMonth}
                />
            );
        }

        return (
            <WebDashboardView
                budgets={budgets}
                categorySpending={categorySpending}
                monthLabel={currentMonthLabel}
                transactions={transactions}
                wallets={wallets}
                summary={summary}
                onDeleteWallet={handleDeleteWallet}
                onManageBudget={openBudgetPanel}
                onSaveWallet={handleSaveWallet}
                onSelectBudget={openBudgetPanel}
                onViewCategorySpending={() => navigateExpenseRoute("categories")}
                onViewTransactions={() => navigateExpenseRoute("transactions")}
            />
        );
    };

    const renderDesktopShell = () => {
        const desktopHeaderContent = {
            categories: {
                eyebrow: "Chi tiêu",
                subtitle: "Phân tích chi tiêu theo danh mục và ngân sách",
                title: "Chi tiêu theo danh mục",
            },
            dashboard: {
                eyebrow: "Tổng quan",
                subtitle: currentMonthLabel,
                title: "Dashboard",
            },
            report: {
                eyebrow: "Báo cáo",
                subtitle: "Theo dõi xu hướng thu chi và dự báo",
                title: "Báo cáo chi tiêu",
            },
            transactions: {
                eyebrow: "Giao dịch",
                subtitle: "Quản lý tất cả giao dịch thu chi của bạn",
                title: "Giao dịch",
            },
        }[activeDesktopPage];
        const desktopViewClassName = ["web-dashboard-view", desktopViewClasses[activeDesktopPage]]
            .filter(Boolean)
            .join(" ");
        const desktopMainClassName = ["web-dashboard-view__main", desktopMainClasses[activeDesktopPage]]
            .filter(Boolean)
            .join(" ");
        const desktopHeaderPageActions =
            activeDesktopPage === "categories" ? (
                <div className="category-spending-page__controls">
                    <label className="category-spending-page__select">
                        <span className="sr-only">Chọn tháng</span>
                        <select onChange={(event) => setCategoryMonth(event.target.value)} value={categoryMonth}>
                            {categoryDisplayedMonthOptions.map((monthKey) => (
                                <option key={monthKey} value={monthKey}>
                                    {getMonthLabel(monthKey)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="category-spending-page__select">
                        <span className="sr-only">Sắp xếp danh mục</span>
                        <select onChange={(event) => setCategorySortKey(event.target.value)} value={categorySortKey}>
                            <option value="amount">Số tiền cao nhất</option>
                            <option value="budget">Theo ngân sách</option>
                            <option value="name">Tên danh mục</option>
                        </select>
                    </label>
                </div>
            ) : activeDesktopPage === "report" ? (
                <div className="report-page__filters">
                    <label className="report-page__filter-control report-page__select-control">
                        <span className="sr-only">Chọn tháng báo cáo</span>
                        <select onChange={(event) => setReportMonth(event.target.value)} value={reportMonth}>
                            {reportDisplayedMonthOptions.map((monthKey) => (
                                <option key={monthKey} value={monthKey}>
                                    {getMonthLabel(monthKey)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            ) : null;

        return (
            <div className={desktopViewClassName}>
                <ExpenseSidebar activeId={activeDesktopPage} items={expenseNavItems} onNavigate={handleDesktopNavigate} />
                <main className={desktopMainClassName}>
                    <ExpenseHeader
                        eyebrow={desktopHeaderContent.eyebrow}
                        onAddTransactionClick={() => setIsDesktopAddTransactionOpen(true)}
                        onLogout={handleLogout}
                        onToggleTheme={handleToggleTheme}
                        pageActions={desktopHeaderPageActions}
                        subtitle={desktopHeaderContent.subtitle}
                        theme={settings.theme}
                        title={desktopHeaderContent.title}
                    />
                    {renderDesktopPage()}
                    {isDesktopAddTransactionOpen ? (
                        <WebAddTransactionPanel
                            categories={categories}
                            onCancel={() => setIsDesktopAddTransactionOpen(false)}
                            onSubmit={handleAddDesktopTransaction}
                            wallets={wallets}
                        />
                    ) : null}
                </main>
            </div>
        );
    };

    return (
        <div
            className={`expenses-page expenses-dashboard-page${areThemeTransitionsEnabled ? " is-theme-ready" : ""}`}
            data-theme={settings.theme}
        >
            {renderMobilePage()}
            <ExpenseBottomNav activeId={activeMobilePage} items={expenseNavItems} onNavigate={handleMobileNavigate} />
            {renderDesktopShell()}
            {isBudgetPanelOpen && isMobileViewport ? (
                <MobileBudgetFormSheet
                    key={budgetPanelCategoryId || "mobile-budget-panel"}
                    budgets={budgetPanelBudgets ?? budgets}
                    categories={categories}
                    initialCategoryId={budgetPanelCategoryId}
                    onCancel={closeBudgetPanel}
                    onDelete={handleDeleteBudgetFromPanel}
                    onSubmit={handleSaveBudgetFromPanel}
                />
            ) : null}
            {isBudgetPanelOpen && !isMobileViewport ? (
                <WebBudgetPanel
                    key={budgetPanelCategoryId || "budget-panel"}
                    budgets={budgetPanelBudgets ?? budgets}
                    categories={categories}
                    initialCategoryId={budgetPanelCategoryId}
                    onCancel={closeBudgetPanel}
                    onDelete={handleDeleteBudgetFromPanel}
                    onSubmit={handleSaveBudgetFromPanel}
                />
            ) : null}
        </div>
    );
}
