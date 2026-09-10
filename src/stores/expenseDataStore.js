import { create } from "zustand";
import { getVisibleMonthOptions } from "../modules/expenses/utils/monthUtils";

const defaultExpenseDataState = {
    budgetLimitsByMonth: {},
    budgetSavingsTransfersByMonth: {},
    categories: [],
    monthOptionsByYear: {},
    monthlyStatsByMonth: {},
    recentTransactions: [],
    transactionsRevision: 0,
    wallets: [],
    walletsLoadStatus: "idle",
    walletsOwnerUid: null,
};

/**
 * Sắp xếp danh sách ví chi tiêu.
 * @param {*} firstWallet 
 * @param {*} secondWallet 
 * @returns {number} - Giá trị âm nếu firstWallet nên đứng trước secondWallet, giá trị dương nếu ngược lại, và 0 nếu bằng nhau.
 */
function sortWallets(firstWallet, secondWallet) {
    const orderComparison =
        (firstWallet.order ?? Number.MAX_SAFE_INTEGER) - (secondWallet.order ?? Number.MAX_SAFE_INTEGER);

    if (orderComparison !== 0) {
        return orderComparison;
    }

    return 0;
}

/**
 * Sắp xếp danh sách giao dịch.
 * @param {*} transactions 
 * @returns {Array} - Danh sách giao dịch đã được sắp xếp.
 */
function sortTransactionList(transactions) {
    return [...transactions].sort((first, second) => {
        const firstValue = `${first.date ?? ""}T${first.time ?? ""}`;
        const secondValue = `${second.date ?? ""}T${second.time ?? ""}`;

        return secondValue.localeCompare(firstValue);
    });
}

/**
 * Tạo khóa cho cache các tùy chọn tháng.
 * @param {*} uid 
 * @param {*} year 
 * @returns {string} - Khóa cache.
 */
function getMonthOptionsCacheKey(uid, year) {
    return `${uid ?? "anonymous"}:${year}`;
}

function getTransactionMonthKey(transaction) {
    const monthKey = String(transaction?.date ?? "").slice(0, 7);

    return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey) ? monthKey : "";
}

export function mergeExpenseMonthOption(monthOptionsByYear, uid, monthKey) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(monthKey ?? ""))) {
        return monthOptionsByYear;
    }

    const year = monthKey.slice(0, 4);
    const cacheKey = getMonthOptionsCacheKey(uid, year);
    const currentOptions = monthOptionsByYear[cacheKey] ?? [];

    if (currentOptions.includes(monthKey)) {
        return monthOptionsByYear;
    }

    return {
        ...monthOptionsByYear,
        [cacheKey]: [...currentOptions, monthKey].sort((first, second) => second.localeCompare(first)),
    };
}

/**
 * Cập nhật danh sách giới hạn ngân sách.
 * @param {Array} currentBudgets - Danh sách giới hạn ngân sách hiện có.
 * @param {*} budget - Giới hạn ngân sách cần cập nhật.
 * @returns {Array} - Danh sách giới hạn ngân sách đã được cập nhật.
 */
function updateBudgetList(currentBudgets = [], budget) {
    const existingBudgetIndex = currentBudgets.findIndex(
        (currentBudget) => currentBudget.monthKey === budget.monthKey && currentBudget.categoryId === budget.categoryId,
    );

    if (existingBudgetIndex === -1) {
        return [...currentBudgets, budget];
    }

    return currentBudgets.map((currentBudget, index) => (index === existingBudgetIndex ? budget : currentBudget));
}

/**
 * Áp dụng các cập nhật số dư ví.
 * @param {Array} wallets - Danh sách ví.
 * @param {Object} walletBalanceUpdates - Các cập nhật số dư ví.
 * @returns {Array} - Danh sách ví đã được cập nhật.
 */
function applyWalletBalanceUpdates(wallets, walletBalanceUpdates = {}) {
    return wallets.map((wallet) =>
        Object.hasOwn(walletBalanceUpdates, wallet.id)
            ? {
                ...wallet,
                ...(typeof walletBalanceUpdates[wallet.id] === "number"
                    ? { balance: walletBalanceUpdates[wallet.id] }
                    : walletBalanceUpdates[wallet.id]),
            }
            : wallet,
    );
}

/**
 * Hợp nhất các cập nhật thống kê hàng tháng.
 * @param {Object} monthlyStatsByMonth - Dữ liệu thống kê hàng tháng hiện có.
 * @param {Object} monthlyStatsUpdates - Các cập nhật thống kê hàng tháng.
 * @returns {Object} - Dữ liệu thống kê hàng tháng đã được hợp nhất.
 */
function mergeMonthlyStatsUpdates(monthlyStatsByMonth, monthlyStatsUpdates = {}) {
    return {
        ...monthlyStatsByMonth,
        ...monthlyStatsUpdates,
    };
}

/**
 * Store để quản lý dữ liệu chi tiêu của người dùng.
 * @typedef {Object} ExpenseDataStore
 * @property {Object} budgetLimitsByMonth - Dữ liệu giới hạn ngân sách theo tháng.
 * @property {Array} categories - Danh sách danh mục chi tiêu.
 * @property {Object} monthOptionsByYear - Dữ liệu các tùy chọn tháng theo năm.
 * @property {Object} monthlyStatsByMonth - Dữ liệu thống kê chi tiêu theo tháng.
 * @property {Array} recentTransactions - Danh sách giao dịch gần đây.
 * @property {number} transactionsRevision - Phiên bản thay đổi để đồng bộ các danh sách giao dịch cục bộ.
 * @property {Array} wallets - Danh sách ví chi tiêu.
 * @property {Function} resetExpenseData - Hàm để đặt lại dữ liệu chi tiêu về trạng thái mặc định.
 * @property {Function} loadExpenseCategories - Hàm để tải danh sách danh mục chi tiêu từ API.
 * @property {Function} loadExpenseWallets - Hàm để tải danh sách ví chi tiêu từ API.
 * @property {Function} loadExpenseMonthlyStats - Hàm để tải dữ liệu thống kê chi tiêu theo tháng từ API.
 * @property {Function} loadExpenseBudgets - Hàm để tải dữ liệu giới hạn ngân sách theo tháng từ API.
 * @property {Function} loadExpenseRecentTransactions - Hàm để tải danh sách giao dịch gần đây từ API.
 * @property {Function} loadExpenseMonthOptions - Hàm để tải các tùy chọn tháng theo năm từ API.
 * @property {Function} loadExpenseDashboardData - Hàm để tải dữ liệu tổng quan chi tiêu từ API.
 * @property {Function} createExpenseTransaction - Hàm để tạo một giao dịch chi tiêu mới.
 * @property {Function} updateExpenseTransaction - Hàm để cập nhật một giao dịch chi tiêu hiện có.
 * @property {Function} voidExpenseTransaction - Hàm để hủy bỏ một giao dịch chi tiêu hiện có.
 * @property {Function} upsertExpenseBudget - Hàm để thêm hoặc cập nhật một giới hạn ngân sách chi tiêu.
 * @property {Function} deleteExpenseBudget - Hàm để xóa một giới hạn ngân sách chi tiêu.
 * @property {Function} upsertExpenseWallet - Hàm để thêm hoặc cập nhật một ví chi tiêu.
 * @property {Function} deleteExpenseWallet - Hàm để xóa một ví chi tiêu.
 */
export const useExpenseDataStore = create((set, get) => ({
    // Trạng thái mặc định của dữ liệu chi tiêu
    ...defaultExpenseDataState,
    resetExpenseData: () => {
        set(defaultExpenseDataState);
    },

    // Tải danh sách danh mục chi tiêu
    loadExpenseCategories: async (uid) => {
        if (!uid) {
            set({ categories: [] });
            return [];
        }

        try {
            const { getExpenseCategories } = await import("../modules/expenses/api/categoriesRepository");
            const categories = await getExpenseCategories(uid);

            set({ categories });
            return categories;
        } catch {
            set({ categories: [] });
            return [];
        }
    },

    // Tải danh sách ví chi tiêu
    loadExpenseWallets: async (uid) => {
        if (!uid) {
            set({ wallets: [], walletsLoadStatus: "idle", walletsOwnerUid: null });
            return [];
        }

        set({ wallets: [], walletsLoadStatus: "loading", walletsOwnerUid: uid });

        try {
            const { getExpenseWallets } = await import("../modules/expenses/api/walletsRepository");
            const wallets = await getExpenseWallets(uid);

            set((state) =>
                state.walletsOwnerUid === uid
                    ? { wallets, walletsLoadStatus: "loaded" }
                    : {},
            );
            return wallets;
        } catch {
            set((state) =>
                state.walletsOwnerUid === uid
                    ? { wallets: [], walletsLoadStatus: "error" }
                    : {},
            );
            return [];
        }
    },

    // Tải thống kê chi tiêu hàng tháng
    loadExpenseMonthlyStats: async (uid, monthKey) => {
        if (!uid || !monthKey) {
            return null;
        }

        const { getExpenseMonthlyStats } = await import("../modules/expenses/api/monthlyStatsRepository");
        const monthlyStats = await getExpenseMonthlyStats(uid, monthKey);

        set((state) => ({
            monthlyStatsByMonth: {
                ...state.monthlyStatsByMonth,
                [monthKey]: monthlyStats,
            },
        }));

        return monthlyStats;
    },

    // Tải giới hạn ngân sách theo tháng
    loadExpenseBudgets: async (uid, monthKey) => {
        if (!uid || !monthKey) {
            return [];
        }

        set((state) => ({
            budgetLimitsErrorByMonth: {
                ...state.budgetLimitsErrorByMonth,
                [monthKey]: null,
            },
        }));

        try {
            const { getExpenseBudgetsByMonth } = await import("../modules/expenses/api/budgetsRepository");
            const budgets = await getExpenseBudgetsByMonth(uid, monthKey);

            set((state) => ({
                budgetLimitsByMonth: {
                    ...state.budgetLimitsByMonth,
                    [monthKey]: budgets,
                },
                budgetLimitsErrorByMonth: {
                    ...state.budgetLimitsErrorByMonth,
                    [monthKey]: null,
                },
            }));

            return budgets;
        } catch (error) {
            console.error("Failed to load expense budgets:", error);

            set((state) => ({
                budgetLimitsByMonth: {
                    ...state.budgetLimitsByMonth,
                    [monthKey]: [],
                },
                budgetLimitsErrorByMonth: {
                    ...state.budgetLimitsErrorByMonth,
                    [monthKey]:
                        error instanceof Error
                            ? error.message
                            : "Không thể tải ngân sách.",
                },
            }));

            return [];
        }
    },

    loadExpenseBudgetSavingsTransfers: async (uid, sourceMonthKey) => {
        if (!uid || !sourceMonthKey) {
            return [];
        }

        try {
            const { getExpenseBudgetSavingsTransfers } = await import(
                "../modules/expenses/api/transactionsRepository"
            );
            const transfers = await getExpenseBudgetSavingsTransfers(uid, sourceMonthKey);

            set((state) => ({
                budgetSavingsTransfersByMonth: {
                    ...state.budgetSavingsTransfersByMonth,
                    [sourceMonthKey]: transfers,
                },
            }));

            return transfers;
        } catch (error) {
            console.error("Failed to load budget savings transfers:", error);
            return [];
        }
    },

    // Tải danh sách giao dịch gần đây
    loadExpenseRecentTransactions: async (uid, maxTransactions = 10) => {
        if (!uid) {
            set({ recentTransactions: [] });
            return [];
        }

        try {
            const { getExpenseTransactions } = await import("../modules/expenses/api/transactionsRepository");
            const recentTransactions = await getExpenseTransactions(uid, maxTransactions);

            set({ recentTransactions });
            return recentTransactions;
        } catch {
            set({ recentTransactions: [] });
            return [];
        }
    },

    // Tải các tùy chọn tháng theo năm
    loadExpenseMonthOptions: async (uid, year, currentMonthKey, { force = false } = {}) => {
        const cacheKey = getMonthOptionsCacheKey(uid, year);
        const cachedOptions = get().monthOptionsByYear[cacheKey];

        if (!force && cachedOptions?.includes(currentMonthKey)) {
            return cachedOptions;
        }

        if (!uid) {
            const fallbackOptions = [currentMonthKey];

            set((state) => ({
                monthOptionsByYear: {
                    ...state.monthOptionsByYear,
                    [cacheKey]: fallbackOptions,
                },
            }));
            return fallbackOptions;
        }

        try {
            const { getExpenseMonthlyStatsMonths } = await import("../modules/expenses/api/monthlyStatsRepository");
            const monthKeys = await getExpenseMonthlyStatsMonths(uid, year);
            const monthOptions = getVisibleMonthOptions(monthKeys, currentMonthKey);

            set((state) => ({
                monthOptionsByYear: {
                    ...state.monthOptionsByYear,
                    [cacheKey]: monthOptions,
                },
            }));
            return monthOptions;
        } catch {
            const fallbackOptions = [currentMonthKey];

            set((state) => ({
                monthOptionsByYear: {
                    ...state.monthOptionsByYear,
                    [cacheKey]: fallbackOptions,
                },
            }));
            return fallbackOptions;
        }
    },

    // Tải dữ liệu tổng quan chi tiêu
    loadExpenseDashboardData: async (uid, { currentMonthKey, previousMonthKey }) => {
        if (!uid) {
            set(defaultExpenseDataState);
            return;
        }

        await Promise.allSettled([
            get().loadExpenseCategories(uid),
            get().loadExpenseWallets(uid),
            get().loadExpenseMonthlyStats(uid, currentMonthKey).catch(() => null),
            get().loadExpenseMonthlyStats(uid, previousMonthKey).catch(() => null),
            get().loadExpenseBudgets(uid, currentMonthKey),
            get().loadExpenseBudgets(uid, previousMonthKey),
            get().loadExpenseBudgetSavingsTransfers(uid, previousMonthKey),
            get().loadExpenseRecentTransactions(uid, 10),
        ]);
    },

    // Tạo một giao dịch chi tiêu mới
    createExpenseTransaction: async (uid, transaction, { currentMonthKey, previousMonthKey, recentLimit = 10 } = {}) => {
        const { createExpenseTransaction } = await import("../modules/expenses/api/transactionsRepository");
        const result = await createExpenseTransaction(uid, transaction);

        set((state) => {
            const monthlyStatsUpdates = {};
            const transactionMonthKey = getTransactionMonthKey(result.transaction);

            if (result.monthlyStats?.monthKey) {
                monthlyStatsUpdates[result.monthlyStats.monthKey] = result.monthlyStats;
            }

            return {
                monthOptionsByYear: mergeExpenseMonthOption(
                    state.monthOptionsByYear,
                    uid,
                    transactionMonthKey,
                ),
                monthlyStatsByMonth: mergeMonthlyStatsUpdates(state.monthlyStatsByMonth, monthlyStatsUpdates),
                recentTransactions: sortTransactionList([result.transaction, ...state.recentTransactions]).slice(
                    0,
                    recentLimit,
                ),
                transactionsRevision: state.transactionsRevision + 1,
                wallets: applyWalletBalanceUpdates(state.wallets, result.walletBalanceUpdates),
            };
        });

        if (currentMonthKey && previousMonthKey && result.monthlyStats?.monthKey) {
            set((state) => ({
                monthlyStatsByMonth: {
                    ...state.monthlyStatsByMonth,
                    [result.monthlyStats.monthKey]: result.monthlyStats,
                },
            }));
        }

        return result;
    },

    // Cập nhật một giao dịch chi tiêu hiện có
    updateExpenseTransaction: async (uid, transactionId, transaction) => {
        const { updateExpenseTransaction } = await import("../modules/expenses/api/transactionsRepository");
        const result = await updateExpenseTransaction(uid, transactionId, transaction);

        set((state) => {
            const transactionMonthKey = getTransactionMonthKey(result.transaction);

            return {
                monthOptionsByYear: mergeExpenseMonthOption(
                    state.monthOptionsByYear,
                    uid,
                    transactionMonthKey,
                ),
                monthlyStatsByMonth: mergeMonthlyStatsUpdates(state.monthlyStatsByMonth, result.monthlyStatsUpdates),
                recentTransactions: sortTransactionList(
                    state.recentTransactions.map((currentTransaction) =>
                        currentTransaction.id === result.transaction.id ? result.transaction : currentTransaction,
                    ),
                ),
                transactionsRevision: state.transactionsRevision + 1,
                wallets: applyWalletBalanceUpdates(state.wallets, result.walletBalanceUpdates),
            };
        });

        return result;
    },

    // Hủy bỏ một giao dịch chi tiêu hiện có
    voidExpenseTransaction: async (uid, transactionId) => {
        const { voidExpenseTransaction } = await import("../modules/expenses/api/transactionsRepository");
        const result = await voidExpenseTransaction(uid, transactionId);

        set((state) => {
            const nextBudgetSavingsTransfersByMonth = { ...state.budgetSavingsTransfersByMonth };

            if (result.budgetSavingsMonthKey && result.budgetSavingsCategoryId) {
                nextBudgetSavingsTransfersByMonth[result.budgetSavingsMonthKey] = (
                    nextBudgetSavingsTransfersByMonth[result.budgetSavingsMonthKey] ?? []
                ).filter(
                    (transaction) => transaction.budgetSavingsCategoryId !== result.budgetSavingsCategoryId,
                );
            }

            return {
                budgetSavingsTransfersByMonth: nextBudgetSavingsTransfersByMonth,
                monthlyStatsByMonth: mergeMonthlyStatsUpdates(state.monthlyStatsByMonth, result.monthlyStatsUpdates),
                recentTransactions: state.recentTransactions.filter(
                    (currentTransaction) => currentTransaction.id !== transactionId,
                ),
                transactionsRevision: state.transactionsRevision + 1,
                wallets: applyWalletBalanceUpdates(state.wallets, result.walletBalanceUpdates),
            };
        });

        return result;
    },

    // Thêm hoặc cập nhật một giới hạn ngân sách chi tiêu
    upsertExpenseBudget: async (uid, budget, monthKey) => {
        const { upsertExpenseBudget } = await import("../modules/expenses/api/budgetsRepository");
        const result = await upsertExpenseBudget(uid, {
            ...budget,
            monthKey,
        });

        set((state) => ({
            budgetLimitsByMonth: {
                ...state.budgetLimitsByMonth,
                [result.monthKey]: updateBudgetList(state.budgetLimitsByMonth[result.monthKey], result),
            },
        }));

        return result;
    },

    copyExpenseBudgets: async (uid, sourceMonthKey, targetMonthKey) => {
        const { copyExpenseBudgets } = await import("../modules/expenses/api/budgetsRepository");
        const result = await copyExpenseBudgets(uid, sourceMonthKey, targetMonthKey);
        set((state) => state.walletsOwnerUid !== uid ? {} : ({
            budgetLimitsByMonth: {
                ...state.budgetLimitsByMonth,
                [targetMonthKey]: result.budgets.reduce(
                    (budgets, budget) => updateBudgetList(budgets, budget),
                    state.budgetLimitsByMonth[targetMonthKey] ?? [],
                ),
            },
        }));
        return result;
    },

    // Xóa một giới hạn ngân sách chi tiêu
    deleteExpenseBudget: async (uid, budget, monthKey) => {
        const { deleteExpenseBudget } = await import("../modules/expenses/api/budgetsRepository");
        const result = await deleteExpenseBudget(uid, {
            ...budget,
            monthKey,
        });

        set((state) => ({
            budgetLimitsByMonth: {
                ...state.budgetLimitsByMonth,
                [result.monthKey]: (state.budgetLimitsByMonth[result.monthKey] ?? []).filter(
                    (currentBudget) =>
                        currentBudget.monthKey !== result.monthKey || currentBudget.categoryId !== result.categoryId,
                ),
            },
        }));

        return result;
    },

    // Thêm hoặc cập nhật một ví chi tiêu
    upsertExpenseWallet: async (uid, wallet) => {
        const { upsertExpenseWallet } = await import("../modules/expenses/api/walletsRepository");
        const result = await upsertExpenseWallet(uid, wallet);
        const savedWallet = result.wallet ?? result;

        set((state) => {
            const existingWalletIndex = state.wallets.findIndex((currentWallet) => currentWallet.id === savedWallet.id);
            const wallets =
                existingWalletIndex === -1
                    ? [...state.wallets, savedWallet].sort(sortWallets)
                    : state.wallets
                        .map((currentWallet, index) => (index === existingWalletIndex ? savedWallet : currentWallet))
                        .sort(sortWallets);

            return {
                recentTransactions: result.adjustmentTransaction
                    ? sortTransactionList([result.adjustmentTransaction, ...state.recentTransactions]).slice(0, 10)
                    : state.recentTransactions,
                wallets,
            };
        });

        return result;
    },

    // Xóa một ví chi tiêu
    deleteExpenseWallet: async (uid, wallet) => {
        const { deleteExpenseWallet } = await import("../modules/expenses/api/walletsRepository");
        const result = await deleteExpenseWallet(uid, wallet);

        set((state) => ({
            wallets: state.wallets
                .filter((currentWallet) => currentWallet.id !== result.id)
                .sort(sortWallets),
        }));

        return result;
    },

    reorderExpenseCategories: async (uid, categoryIds) => {
        const { reorderExpenseCategories } = await import("../modules/expenses/api/categoriesRepository");
        const orderedIds = await reorderExpenseCategories(uid, categoryIds);
        const orderById = new Map(orderedIds.map((id, index) => [id, (index + 1) * 10]));

        set((state) => ({
            categories: [...state.categories]
                .map((category) => ({
                    ...category,
                    sortOrder: orderById.get(category.id) ?? category.sortOrder,
                }))
                .sort((first, second) => {
                    const typeComparison = (first.type ?? "").localeCompare(second.type ?? "");
                    return typeComparison || (first.sortOrder ?? 0) - (second.sortOrder ?? 0);
                }),
        }));

        return orderedIds;
    },

    reorderExpenseWallets: async (uid, walletIds) => {
        const { reorderExpenseWallets } = await import("../modules/expenses/api/walletsRepository");
        const orderedIds = await reorderExpenseWallets(uid, walletIds);
        const orderById = new Map(orderedIds.map((id, index) => [id, (index + 1) * 10]));

        set((state) => ({
            wallets: state.wallets
                .map((wallet) => ({ ...wallet, order: orderById.get(wallet.id) ?? wallet.order }))
                .sort(sortWallets),
        }));

        return orderedIds;
    },

}));

export const selectExpenseCategories = (state) => state.categories;
export const selectExpenseWallets = (state) => state.wallets;
export const selectExpenseWalletsLoadStatus = (state) => state.walletsLoadStatus;
export const selectExpenseWalletsOwnerUid = (state) => state.walletsOwnerUid;
export const selectExpenseRecentTransactions = (state) => state.recentTransactions;
export const selectExpenseTransactionsRevision = (state) => state.transactionsRevision;
export const selectExpenseBudgetLimitsByMonth = (state) => state.budgetLimitsByMonth;
export const selectExpenseBudgetSavingsTransfersByMonth = (state) => state.budgetSavingsTransfersByMonth;
export const selectExpenseMonthlyStatsByMonth = (state) => state.monthlyStatsByMonth;
export const selectExpenseMonthOptionsByYear = (state) => state.monthOptionsByYear;
export const getExpenseMonthOptionsCacheKey = getMonthOptionsCacheKey;
