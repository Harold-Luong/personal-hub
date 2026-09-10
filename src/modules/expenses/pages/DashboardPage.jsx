import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { selectAuthUid, useAuthSessionStore } from "../../../stores/authSessionStore";
import {
    getExpenseMonthOptionsCacheKey,
    selectExpenseBudgetLimitsByMonth,
    selectExpenseBudgetSavingsTransfersByMonth,
    selectExpenseCategories,
    selectExpenseMonthOptionsByYear,
    selectExpenseMonthlyStatsByMonth,
    selectExpenseRecentTransactions,
    selectExpenseWallets,
    selectExpenseWalletsLoadStatus,
    selectExpenseWalletsOwnerUid,
    useExpenseDataStore,
} from "../../../stores/expenseDataStore";
import { selectExpensePreferences, useExpensePreferencesStore } from "../../../stores/expensePreferencesStore";
import ExpenseBottomNav from "../components/layout/ExpenseBottomNav";
import ExpenseHeader from "../components/layout/ExpenseHeader";
import ExpenseSidebar from "../components/layout/ExpenseSidebar";
import MobileDashboardSurface from "../components/mobile/MobileDashboardSurface";
import DesktopTransactionDialog from "../components/desktop/DesktopTransactionDialog";
import DesktopDashboardSurface from "../components/desktop/DesktopDashboardSurface";
import CreditCardPaymentDialog from "../components/wallet/CreditCardPaymentDialog";
import InitialWalletSetupDialog from "../components/wallet/InitialWalletSetupDialog";
import AddTransactionPage from "./AddTransactionPage";
import BudgetPage from "./BudgetPage";
import CategorySpendingPage from "./CategorySpendingPage";
import ReportPage from "./ReportPage";
import SavingsPage from "./SavingsPage";
import SettingsPage from "./SettingsPage";
import TransactionsPage from "./TransactionsPage";
import WalletPage from "./WalletPage";
import {
    creditCardWalletTypeId,
    expenseMobileOnlyPageIds,
    expenseNavItems,
    expenseRoutePaths,
    expenseSummaryItems,
    expenseThemeIds,
    savingsTransferKinds,
    transactionTypes,
} from "../constants/expenseMetadata";
import { expenseSortKeys } from "../constants/expenseUiMetadata";
import { getCategorySpendingByMonth } from "../utils/categorySpendingUtils";
import { calculateTrend, getEmptyMonthlyStats, getPreviousMonthKey } from "../utils/monthlyStatsUtils";
import { getSpendableWallets } from "../utils/savingsUtils";
import { getLocalDateValue, getLocalTimeValue } from "../utils/transactionFormUtils";
import {
    getCompactMonthLabel,
    getCurrentMonthKey,
    getCurrentYear,
    getMonthLabel,
    getVisibleMonthOptions,
} from "../utils/monthUtils";
import {
    getWalletsDefaultFirst,
    getWalletsWithResolvedDefault,
} from "../utils/walletUtils";
import "../styles/expenses.scss";

function getExpenseRoutePage(pathname) {
    const normalizedPathname = pathname.replace(/\/+$/, "") || "/";

    return Object.entries(expenseRoutePaths).find(([, path]) => path === normalizedPathname)?.[0] ?? "dashboard";
}

function getBudgetViewModels(budgetLimits, categoriesById, monthlyStats) {
    const categorySpendingById = monthlyStats.categoryExpenseMinor ?? {};

    return budgetLimits
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
}

const desktopSurfaceClassByPageId = {
    budgets: "desktop-budget-surface",
    categories: "desktop-category-spending-surface",
    report: "desktop-report-surface",
    savings: "desktop-savings-surface",
    settings: "desktop-settings-surface",
    transactions: "desktop-transactions-surface",
    wallets: "desktop-wallet-surface",
};

const desktopMainClassByPageId = {
    budgets: "desktop-budget-surface__main",
    categories: "desktop-category-spending-surface__main",
    report: "desktop-report-surface__main",
    savings: "desktop-savings-surface__main",
    settings: "desktop-settings-surface__main",
    transactions: "desktop-transactions-surface__main",
    wallets: "desktop-wallet-surface__main",
};

function getIsMobileViewport() {
    return typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
}

export default function DashboardPage({ initialSettings, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();
    const uid = useAuthSessionStore(selectAuthUid);
    const settings = useExpensePreferencesStore(selectExpensePreferences);
    const initializeExpensePreferences = useExpensePreferencesStore((state) => state.initializeExpensePreferences);
    const saveExpensePreference = useExpensePreferencesStore((state) => state.saveExpensePreference);
    const waitForExpensePreferenceWrites = useExpensePreferencesStore((state) => state.waitForExpensePreferenceWrites);
    const allCategories = useExpenseDataStore(selectExpenseCategories);
    const allWallets = useExpenseDataStore(selectExpenseWallets);
    const walletsLoadStatus = useExpenseDataStore(selectExpenseWalletsLoadStatus);
    const walletsOwnerUid = useExpenseDataStore(selectExpenseWalletsOwnerUid);
    const transactions = useExpenseDataStore(selectExpenseRecentTransactions);
    const budgetLimitsByMonth = useExpenseDataStore(selectExpenseBudgetLimitsByMonth);
    const budgetSavingsTransfersByMonth = useExpenseDataStore(selectExpenseBudgetSavingsTransfersByMonth);
    const monthlyStatsByMonth = useExpenseDataStore(selectExpenseMonthlyStatsByMonth);
    const monthOptionsByYear = useExpenseDataStore(selectExpenseMonthOptionsByYear);
    const loadExpenseDashboardData = useExpenseDataStore((state) => state.loadExpenseDashboardData);
    const loadExpenseMonthOptions = useExpenseDataStore((state) => state.loadExpenseMonthOptions);
    const loadExpenseBudgetSavingsTransfers = useExpenseDataStore((state) => state.loadExpenseBudgetSavingsTransfers);
    const createExpenseTransactionAction = useExpenseDataStore((state) => state.createExpenseTransaction);
    const upsertExpenseBudgetAction = useExpenseDataStore((state) => state.upsertExpenseBudget);
    const copyExpenseBudgetsAction = useExpenseDataStore((state) => state.copyExpenseBudgets);
    const deleteExpenseBudgetAction = useExpenseDataStore((state) => state.deleteExpenseBudget);
    const upsertExpenseWalletAction = useExpenseDataStore((state) => state.upsertExpenseWallet);
    const deleteExpenseWalletAction = useExpenseDataStore((state) => state.deleteExpenseWallet);
    const routePage = getExpenseRoutePage(location.pathname);
    const budgetInitialCategoryId = useMemo(() => {
        if (routePage !== "budgets") {
            return "";
        }

        return new URLSearchParams(location.search).get("categoryId") ?? "";
    }, [location.search, routePage]);
    const [mobilePageOverride, setMobilePageOverride] = useState(null);
    const activeMobilePage =
        mobilePageOverride?.routePath === location.pathname ? mobilePageOverride.pageId : routePage;
    const activeDesktopPage = routePage;
    const [areThemeTransitionsEnabled, setAreThemeTransitionsEnabled] = useState(false);
    const currentMonthKey = getCurrentMonthKey();
    const previousMonthKey = getPreviousMonthKey(currentMonthKey);
    const currentMonthLabel = getCompactMonthLabel(currentMonthKey);
    const previousMonthLabel = getCompactMonthLabel(previousMonthKey);
    const currentYear = getCurrentYear();
    const monthOptionsCacheKey = getExpenseMonthOptionsCacheKey(uid, currentYear);
    const [categoryMonth, setCategoryMonth] = useState(currentMonthKey);
    const [categorySortKey, setCategorySortKey] = useState(expenseSortKeys.AMOUNT);
    const [reportMonth, setReportMonth] = useState(currentMonthKey);
    const [isDesktopAddTransactionOpen, setIsDesktopAddTransactionOpen] = useState(false);
    const [creditPaymentCard, setCreditPaymentCard] = useState(null);
    const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);
    const mobileBudgetInitialCategoryId = isMobileViewport ? budgetInitialCategoryId : "";
    const categories = useMemo(
        () => allCategories.filter((category) => !settings.hiddenCategoryIds.includes(category.id)),
        [allCategories, settings.hiddenCategoryIds],
    );
    const resolvedAllWallets = useMemo(
        () => getWalletsDefaultFirst(
            getWalletsWithResolvedDefault(allWallets, settings.defaultWalletId),
        ),
        [allWallets, settings.defaultWalletId],
    );
    const wallets = useMemo(
        () => resolvedAllWallets.filter((wallet) => !settings.hiddenWalletIds.includes(wallet.id)),
        [resolvedAllWallets, settings.hiddenWalletIds],
    );
    const initialSetupWallet =
        walletsOwnerUid === uid &&
        walletsLoadStatus === "loaded" &&
        (resolvedAllWallets.length === 0 ||
            (resolvedAllWallets.length === 1 &&
                resolvedAllWallets[0].type !== creditCardWalletTypeId &&
                !resolvedAllWallets[0].isBalanceInitialized))
            ? (resolvedAllWallets[0] ?? null)
            : undefined;
    const shouldShowInitialWalletSetup = initialSetupWallet !== undefined;
    const monthlyStats = monthlyStatsByMonth[currentMonthKey] ?? getEmptyMonthlyStats(currentMonthKey);
    const previousMonthlyStats = monthlyStatsByMonth[previousMonthKey] ?? getEmptyMonthlyStats(previousMonthKey);
    const budgetLimits = budgetLimitsByMonth[currentMonthKey] ?? [];
    const previousBudgetLimits = budgetLimitsByMonth[previousMonthKey] ?? [];
    const previousBudgetSavingsTransfers = budgetSavingsTransfersByMonth[previousMonthKey] ?? [];
    const monthOptions = monthOptionsByYear[monthOptionsCacheKey] ?? [currentMonthKey];
    const categoryDisplayedMonthOptions = getVisibleMonthOptions(
        [...monthOptions, categoryMonth],
        currentMonthKey,
    );
    const reportDisplayedMonthOptions = getVisibleMonthOptions(
        [...monthOptions, reportMonth],
        currentMonthKey,
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
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    const categorySpending = getCategorySpendingByMonth({
        categories,
        monthKey: currentMonthKey,
        monthlyStats,
    });
    const budgets = getBudgetViewModels(budgetLimits, categoriesById, monthlyStats);
    const previousBudgets = getBudgetViewModels(previousBudgetLimits, categoriesById, previousMonthlyStats);
    const totalWalletBalance = resolvedAllWallets.reduce(
        (total, wallet) => total + (wallet.balance ?? 0),
        0,
    );
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

    const navigateBudgetPage = (categoryId = "") => {
        const routePath = expenseRoutePaths.budgets;
        const nextCategoryId = typeof categoryId === "string" ? categoryId : "";

        if (!routePath) {
            return;
        }

        setMobilePageOverride(null);
        navigate(nextCategoryId ? `${routePath}?categoryId=${encodeURIComponent(nextCategoryId)}` : routePath);
    };

    const clearBudgetEditorRouteState = () => {
        if (routePage === "budgets" && location.search) {
            navigate(expenseRoutePaths.budgets, { replace: true });
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

    const openDesktopAddTransaction = () => {
        setIsDesktopAddTransactionOpen(true);
    };

    const closeDesktopAddTransaction = () => {
        setIsDesktopAddTransactionOpen(false);
    };

    const getCreditPaymentSourceWallets = (creditWallet) =>
        getSpendableWallets(wallets).filter((wallet) => wallet.id !== creditWallet?.id);

    const getDefaultCreditPaymentSourceWallet = (creditWallet) =>
        getCreditPaymentSourceWallets(creditWallet).find((wallet) => wallet.isDefaultWallet) ??
        getCreditPaymentSourceWallets(creditWallet)[0];

    const openCreditPaymentTransaction = (creditWallet) => {
        setCreditPaymentCard(creditWallet);
    };

    const closeCreditPaymentDialog = () => {
        setCreditPaymentCard(null);
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

        closeDesktopAddTransaction();

        return result;
    };

    const handleCreditPaymentSubmit = async (transaction) => {
        const result = await handleAddTransaction(transaction);

        closeCreditPaymentDialog();

        return result;
    };

    const handleSaveBudget = async (budget, monthKey = currentMonthKey) => {
        return upsertExpenseBudgetAction(uid, budget, monthKey);
    };

    const handleCopyBudgets = (sourceMonthKey) => copyExpenseBudgetsAction(uid, sourceMonthKey, currentMonthKey);

    const handleDeleteBudget = async (budget, monthKey = currentMonthKey) => {
        return deleteExpenseBudgetAction(uid, budget, monthKey);
    };

    const handleSaveBudgetSavings = async ({ candidate, fromWalletId, toWalletId }) => {
        const result = await handleAddTransaction({
            amount: candidate.savingsAmount,
            budgetSavingsCategoryId: candidate.categoryId,
            budgetSavingsMonthKey: previousMonthKey,
            date: getLocalDateValue(),
            fromWalletId,
            note: `Phần dư ngân sách ${candidate.category} của ${previousMonthLabel}.`,
            savingsTransferKind: savingsTransferKinds.DEPOSIT,
            time: getLocalTimeValue(),
            title: `Tiết kiệm từ ngân sách ${candidate.category}`,
            toWalletId,
            type: transactionTypes.TRANSFER,
            walletId: null,
        });

        await loadExpenseBudgetSavingsTransfers(uid, previousMonthKey);
        return result;
    };

    const handleSaveSavingsTransfer = async ({
        amount,
        date,
        fromWalletId,
        note,
        savingsTransferKind,
        time,
        toWalletId,
    }) => handleAddTransaction({
        amount,
        date,
        fromWalletId,
        note,
        savingsTransferKind,
        time,
        title: savingsTransferKind === savingsTransferKinds.WITHDRAWAL
            ? "Rút tiền tiết kiệm"
            : "Nạp tiền tiết kiệm",
        toWalletId,
        type: transactionTypes.TRANSFER,
        walletId: null,
    });

    const handleSaveWallet = async (wallet) => {
        const result = await upsertExpenseWalletAction(uid, wallet);
        const savedWallet = result.wallet ?? result;

        if (wallet.setAsDefault && savedWallet.id !== settings.defaultWalletId) {
            await saveExpensePreference(uid, "defaultWalletId", savedWallet.id);
        }

        return result;
    };

    const handleDeleteWallet = async (wallet) => {
        await deleteExpenseWalletAction(uid, wallet);
    };

    const handleSeedSavingsTestData = import.meta.env.DEV
        ? async () => {
            const { savingsSeedMonthKeys, seedExpenseSavingsTestData } = await import(
                "../dev/seedSavingsTestData"
            );
            const result = await seedExpenseSavingsTestData(uid);
            const seedYear = Number(savingsSeedMonthKeys.july.slice(0, 4));

            await Promise.all([
                loadExpenseDashboardData(uid, {
                    currentMonthKey: savingsSeedMonthKeys.august,
                    previousMonthKey: savingsSeedMonthKeys.july,
                }),
                loadExpenseMonthOptions(
                    uid,
                    seedYear,
                    savingsSeedMonthKeys.august,
                    { force: true },
                ),
            ]);

            return result;
        }
        : undefined;

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
            return <TransactionsPage categories={categories} mode="mobile" wallets={wallets} />;
        }

        if (activeMobilePage === "categories") {
            return (
                <CategorySpendingPage
                    categories={categories}
                    mode="mobile"
                    onBack={() => navigateExpenseRoute("settings")}
                    onManageBudget={navigateBudgetPage}
                />
            );
        }

        if (activeMobilePage === "report") {
            return <ReportPage categories={categories} mode="mobile" onNavigate={handleMobileNavigate} wallets={wallets} />;
        }

        if (activeMobilePage === "budgets") {
            return (
                <BudgetPage
                    budgets={budgets}
                    categories={categories}
                    initialCategoryId={mobileBudgetInitialCategoryId}
                    key={`mobile-budgets-${mobileBudgetInitialCategoryId || "index"}`}
                    mode="mobile"
                    monthKey={currentMonthKey}
                    monthLabel={currentMonthLabel}
                    onBack={() => navigateExpenseRoute("settings")}
                    onCloseEditor={clearBudgetEditorRouteState}
                    onDeleteBudget={handleDeleteBudget}
                    onSaveBudget={handleSaveBudget}
                    onCopyBudgets={handleCopyBudgets}
                    monthOptions={monthOptions}
                />
            );
        }

        if (activeMobilePage === "savings") {
            return (
                <SavingsPage
                    budgets={previousBudgets}
                    mode="mobile"
                    monthLabel={previousMonthLabel}
                    onBack={() => navigateExpenseRoute("settings")}
                    onManageWallet={() => navigateExpenseRoute("wallets")}
                    onSave={handleSaveBudgetSavings}
                    onSaveTransfer={handleSaveSavingsTransfer}
                    transactions={transactions}
                    transfers={previousBudgetSavingsTransfers}
                    wallets={resolvedAllWallets}
                />
            );
        }

        if (activeMobilePage === "wallets") {
            return (
                <WalletPage
                    onBack={() => showMobilePage("settings")}
                    onDeleteWallet={handleDeleteWallet}
                    onPayCreditCard={openCreditPaymentTransaction}
                    onSaveWallet={handleSaveWallet}
                    wallets={wallets}
                />
            );
        }

        if (activeMobilePage === "settings") {
            return (
                <SettingsPage
                    categories={allCategories}
                    mode="mobile"
                    onBackToHub={() => navigate("/hub")}
                    onLogout={handleLogout}
                    onManageBudget={() => navigateExpenseRoute("budgets")}
                    onManageCategories={() => navigateExpenseRoute("categories")}
                    onManageSavings={() => navigateExpenseRoute("savings")}
                    onManageWallet={() => navigateExpenseRoute("wallets")}
                    onSeedTestData={handleSeedSavingsTestData}
                    wallets={resolvedAllWallets}
                />
            );
        }

        return (
            <MobileDashboardSurface
                budgets={budgets}
                categorySpending={categorySpending}
                monthLabel={currentMonthLabel}
                onBackToHub={() => navigate("/hub")}
                onManageBudget={() => navigateExpenseRoute("budgets")}
                onToggleTheme={handleToggleTheme}
                onViewCategorySpending={() => navigateExpenseRoute("categories")}
                onViewTransactions={() => navigateExpenseRoute("transactions")}
                summary={summary}
                theme={settings.theme}
                transactions={transactions}
                wallets={wallets}
            />
        );
    };

    const renderDesktopPage = () => {
        if (activeDesktopPage === "transactions") {
            return <TransactionsPage categories={categories} mode="desktop" wallets={wallets} />;
        }

        if (activeDesktopPage === "categories") {
            return (
                <CategorySpendingPage
                    categories={categories}
                    key={categoryMonth}
                    monthOptions={monthOptions}
                    mode="desktop"
                    onManageBudget={navigateBudgetPage}
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
                    categories={categories}
                    monthOptions={monthOptions}
                    mode="desktop"
                    onNavigate={handleDesktopNavigate}
                    onSelectedMonthChange={setReportMonth}
                    selectedMonth={reportMonth}
                    wallets={wallets}
                />
            );
        }

        if (activeDesktopPage === "budgets") {
            return (
                <BudgetPage
                    budgets={budgets}
                    categories={categories}
                    initialCategoryId={budgetInitialCategoryId}
                    key={`desktop-budgets-${budgetInitialCategoryId || "index"}`}
                    mode="desktop"
                    monthKey={currentMonthKey}
                    monthLabel={currentMonthLabel}
                    onCloseEditor={clearBudgetEditorRouteState}
                    onDeleteBudget={handleDeleteBudget}
                    onSaveBudget={handleSaveBudget}
                    onCopyBudgets={handleCopyBudgets}
                    monthOptions={monthOptions}
                />
            );
        }

        if (activeDesktopPage === "savings") {
            return (
                <SavingsPage
                    budgets={previousBudgets}
                    mode="desktop"
                    monthLabel={previousMonthLabel}
                    onManageWallet={() => navigateExpenseRoute("wallets")}
                    onSave={handleSaveBudgetSavings}
                    onSaveTransfer={handleSaveSavingsTransfer}
                    transactions={transactions}
                    transfers={previousBudgetSavingsTransfers}
                    wallets={resolvedAllWallets}
                />
            );
        }

        if (activeDesktopPage === "wallets") {
            return (
                <WalletPage
                    mode="desktop"
                    onDeleteWallet={handleDeleteWallet}
                    onPayCreditCard={openCreditPaymentTransaction}
                    onSaveWallet={handleSaveWallet}
                    wallets={wallets}
                />
            );
        }

        if (activeDesktopPage === "settings") {
            return (
                <SettingsPage
                    categories={allCategories}
                    mode="desktop"
                    onSeedTestData={handleSeedSavingsTestData}
                    wallets={resolvedAllWallets}
                />
            );
        }

        return (
            <DesktopDashboardSurface
                budgets={budgets}
                categorySpending={categorySpending}
                monthLabel={currentMonthLabel}
                transactions={transactions}
                wallets={wallets}
                summary={summary}
                onManageBudget={navigateBudgetPage}
                onManageWallet={() => navigateExpenseRoute("wallets")}
                onPayCreditCard={openCreditPaymentTransaction}
                onSelectBudget={navigateBudgetPage}
                onViewCategorySpending={() => navigateExpenseRoute("categories")}
                onViewTransactions={() => navigateExpenseRoute("transactions")}
            />
        );
    };

    const renderDesktopShell = () => {
        const desktopHeaderContent = {
            budgets: {
                eyebrow: "Ngân sách",
                subtitle: currentMonthLabel,
                title: "Ngân sách",
            },
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
            savings: {
                eyebrow: "Kế hoạch",
                subtitle: `Đưa phần dư ngân sách ${previousMonthLabel} vào ví tiết kiệm`,
                title: "Tiết kiệm",
            },
            settings: {
                eyebrow: "Cá nhân hóa",
                subtitle: "Định dạng, danh mục, ví và dữ liệu của bạn",
                title: "Cài đặt",
            },
            transactions: {
                eyebrow: "Giao dịch",
                subtitle: "Quản lý tất cả giao dịch thu chi của bạn",
                title: "Giao dịch",
            },
            wallets: {
                eyebrow: "Ví tiền",
                subtitle: "Quản lý ví, số dư và ví mặc định",
                title: "Ví tiền",
            },
        }[activeDesktopPage];
        const desktopSurfaceClassName = ["desktop-dashboard-surface", desktopSurfaceClassByPageId[activeDesktopPage]]
            .filter(Boolean)
            .join(" ");
        const desktopMainClassName = ["desktop-dashboard-surface__main", desktopMainClassByPageId[activeDesktopPage]]
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
                            <option value={expenseSortKeys.AMOUNT}>Số tiền cao nhất</option>
                            <option value={expenseSortKeys.BUDGET}>Theo ngân sách</option>
                            <option value={expenseSortKeys.NAME}>Tên danh mục</option>
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
            <div className={desktopSurfaceClassName}>
                <ExpenseSidebar
                    activeId={activeDesktopPage}
                    items={expenseNavItems}
                    onBackToHub={() => navigate("/hub")}
                    onLogout={handleLogout}
                    onNavigate={handleDesktopNavigate}
                    onToggleTheme={handleToggleTheme}
                    theme={settings.theme}
                />
                <main className={desktopMainClassName}>
                    <ExpenseHeader
                        onAddTransactionClick={activeDesktopPage === "settings" ? undefined : openDesktopAddTransaction}
                        pageActions={desktopHeaderPageActions}
                        subtitle={desktopHeaderContent.subtitle}
                        title={desktopHeaderContent.title}
                    />
                    {renderDesktopPage()}
                    {isDesktopAddTransactionOpen ? (
                        <DesktopTransactionDialog
                            categories={categories}
                            onCancel={closeDesktopAddTransaction}
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
            {isMobileViewport ? (
                <>
                    {renderMobilePage()}
                    <ExpenseBottomNav
                        activeId={activeMobilePage}
                        items={expenseNavItems}
                        onNavigate={handleMobileNavigate}
                    />
                </>
            ) : (
                renderDesktopShell()
            )}
            {creditPaymentCard ? (
                <CreditCardPaymentDialog
                    card={creditPaymentCard}
                    initialWalletId={getDefaultCreditPaymentSourceWallet(creditPaymentCard)?.id}
                    key={creditPaymentCard.id}
                    onCancel={closeCreditPaymentDialog}
                    onSubmit={handleCreditPaymentSubmit}
                    sourceWallets={getCreditPaymentSourceWallets(creditPaymentCard)}
                />
            ) : null}
            {shouldShowInitialWalletSetup ? (
                <InitialWalletSetupDialog
                    onSubmit={handleSaveWallet}
                    wallet={initialSetupWallet}
                    wallets={resolvedAllWallets}
                />
            ) : null}
        </div>
    );
}
