const SAVINGS_SEED_ID = "savings-2026-07-08-v1";
const SAVINGS_WALLET_NAME = "Tiết kiệm test 2026";

export const savingsSeedMonthKeys = Object.freeze({
    july: "2026-07",
    august: "2026-08",
});

export const savingsSeedTransactions = Object.freeze([
    {
        id: "july-salary",
        amount: 35_000_000,
        categoryId: "salary",
        date: "2026-07-01",
        note: "Thu nhập mẫu tháng 7.",
        time: "08:00",
        title: "Lương tháng 7",
        type: "income",
    },
    {
        id: "july-food-market",
        amount: 850_000,
        categoryId: "food",
        date: "2026-07-05",
        note: "Mua thực phẩm trong tuần.",
        time: "18:20",
        title: "Đi chợ tháng 7",
        type: "expense",
    },
    {
        id: "july-food-meals",
        amount: 1_200_000,
        categoryId: "food",
        date: "2026-07-18",
        note: "Ăn uống bên ngoài.",
        time: "12:15",
        title: "Ăn uống tháng 7",
        type: "expense",
    },
    {
        id: "july-transport",
        amount: 650_000,
        categoryId: "transport",
        date: "2026-07-12",
        note: "Xăng xe và di chuyển.",
        time: "07:30",
        title: "Di chuyển tháng 7",
        type: "expense",
    },
    {
        id: "july-home",
        amount: 4_200_000,
        categoryId: "home",
        date: "2026-07-03",
        note: "Chi phí nhà cửa.",
        time: "09:10",
        title: "Nhà cửa tháng 7",
        type: "expense",
    },
    {
        id: "july-shopping",
        amount: 2_400_000,
        categoryId: "shopping",
        date: "2026-07-22",
        note: "Dữ liệu mẫu vượt ngân sách.",
        time: "20:05",
        title: "Mua sắm tháng 7",
        type: "expense",
    },
    {
        id: "july-fun",
        amount: 900_000,
        categoryId: "fun",
        date: "2026-07-26",
        note: "Dữ liệu mẫu dùng hết ngân sách.",
        time: "19:00",
        title: "Giải trí tháng 7",
        type: "expense",
    },
    {
        id: "august-salary",
        amount: 38_000_000,
        categoryId: "salary",
        date: "2026-08-01",
        note: "Thu nhập mẫu tháng 8.",
        time: "08:00",
        title: "Lương tháng 8",
        type: "income",
    },
    {
        id: "august-bonus",
        amount: 3_000_000,
        categoryId: "bonus",
        date: "2026-08-04",
        note: "Khoản thưởng mẫu tháng 8.",
        time: "09:00",
        title: "Thưởng tháng 8",
        type: "income",
    },
    {
        id: "august-food-market",
        amount: 1_400_000,
        categoryId: "food",
        date: "2026-08-03",
        note: "Mua thực phẩm đầu tháng.",
        time: "18:00",
        title: "Đi chợ tháng 8",
        type: "expense",
    },
    {
        id: "august-food-meals",
        amount: 750_000,
        categoryId: "food",
        date: "2026-08-08",
        note: "Ăn uống bên ngoài đầu tháng.",
        time: "12:30",
        title: "Ăn uống tháng 8",
        type: "expense",
    },
    {
        id: "august-transport",
        amount: 500_000,
        categoryId: "transport",
        date: "2026-08-06",
        note: "Chi phí di chuyển đầu tháng.",
        time: "07:15",
        title: "Di chuyển tháng 8",
        type: "expense",
    },
    {
        id: "august-home",
        amount: 4_500_000,
        categoryId: "home",
        date: "2026-08-02",
        note: "Chi phí nhà cửa tháng 8.",
        time: "10:00",
        title: "Nhà cửa tháng 8",
        type: "expense",
    },
    {
        id: "august-shopping",
        amount: 1_200_000,
        categoryId: "shopping",
        date: "2026-08-07",
        note: "Mua sắm đầu tháng.",
        time: "20:00",
        title: "Mua sắm tháng 8",
        type: "expense",
    },
    {
        id: "august-education",
        amount: 1_800_000,
        categoryId: "education",
        date: "2026-08-09",
        note: "Khóa học mẫu tháng 8.",
        time: "14:00",
        title: "Học tập tháng 8",
        type: "expense",
    },
]);

const budgetScenariosByMonth = {
    [savingsSeedMonthKeys.july]: [
        { categoryId: "food", savingsAmount: 1_500_000 },
        { categoryId: "transport", savingsAmount: 1_200_000 },
        { categoryId: "home", savingsAmount: 800_000 },
        { categoryId: "shopping", overrunAmount: 300_000 },
        { categoryId: "fun", savingsAmount: 0 },
    ],
    [savingsSeedMonthKeys.august]: [
        { categoryId: "food", savingsAmount: 1_800_000 },
        { categoryId: "transport", savingsAmount: 1_000_000 },
        { categoryId: "home", savingsAmount: 1_000_000 },
        { categoryId: "shopping", savingsAmount: 800_000 },
        { categoryId: "education", savingsAmount: 700_000 },
    ],
};

function getSeedMarker(transactionId) {
    return `[${SAVINGS_SEED_ID}:${transactionId}]`;
}

export function buildSavingsSeedBudgets(monthKey, categoryExpenseMinor = {}) {
    return (budgetScenariosByMonth[monthKey] ?? []).map((scenario) => {
        const spent = Math.max(Number(categoryExpenseMinor[scenario.categoryId]) || 0, 0);
        const limitMinor = scenario.overrunAmount
            ? Math.max(spent - scenario.overrunAmount, 1)
            : Math.max(spent + scenario.savingsAmount, 1);

        return {
            alertThreshold: 80,
            categoryId: scenario.categoryId,
            limitMinor,
            monthKey,
        };
    });
}

export async function seedExpenseSavingsTestData(uid) {
    if (!import.meta.env.DEV) {
        throw new Error("Chỉ có thể tạo dữ liệu test trong môi trường development.");
    }
    if (!uid) {
        throw new Error("Cần đăng nhập trước khi tạo dữ liệu test.");
    }

    const [
        { getExpenseCategories },
        { getExpenseSettings },
        { getExpenseMonthlyStats },
        { getAllExpenseTransactions, createExpenseTransaction },
        { getExpenseWallets, createExpenseWallet },
        { upsertExpenseBudget },
    ] = await Promise.all([
        import("../api/categoriesRepository"),
        import("../api/expenseSettingsRepository"),
        import("../api/monthlyStatsRepository"),
        import("../api/transactionsRepository"),
        import("../api/walletsRepository"),
        import("../api/budgetsRepository"),
    ]);
    const [categories, settings, existingTransactions, existingWallets] = await Promise.all([
        getExpenseCategories(uid),
        getExpenseSettings(uid),
        getAllExpenseTransactions(uid),
        getExpenseWallets(uid),
    ]);
    const requiredCategoryIds = [...new Set(savingsSeedTransactions.map((transaction) => transaction.categoryId))];
    const activeCategoryIds = new Set(categories.map((category) => category.id));
    const missingCategoryIds = requiredCategoryIds.filter((categoryId) => !activeCategoryIds.has(categoryId));

    if (missingCategoryIds.length) {
        throw new Error(`Thiếu danh mục test đang hoạt động: ${missingCategoryIds.join(", ")}.`);
    }

    const regularWallets = existingWallets.filter(
        (wallet) => wallet.type !== "credit-card" && wallet.type !== "saving",
    );
    const sourceWallet = regularWallets.find((wallet) => wallet.id === settings.defaultWalletId) ?? regularWallets[0];

    if (!sourceWallet) {
        throw new Error("Cần ít nhất một ví thường để tạo giao dịch test.");
    }

    let savingWallet = existingWallets.find((wallet) => wallet.name === SAVINGS_WALLET_NAME);

    if (savingWallet && savingWallet.type !== "saving") {
        throw new Error(`Ví "${SAVINGS_WALLET_NAME}" đã tồn tại nhưng không phải loại Tiết kiệm.`);
    }
    if (!savingWallet) {
        savingWallet = await createExpenseWallet(uid, {
            balance: 0,
            color: "#d9a441",
            currency: sourceWallet.currency,
            icon: "saving",
            name: SAVINGS_WALLET_NAME,
            type: "saving",
        });
    }

    const existingNotes = existingTransactions.map((transaction) => transaction.note ?? "");
    let createdTransactionCount = 0;
    let skippedTransactionCount = 0;

    for (const transaction of savingsSeedTransactions) {
        const marker = getSeedMarker(transaction.id);

        if (existingNotes.some((note) => note.includes(marker))) {
            skippedTransactionCount += 1;
            continue;
        }

        await createExpenseTransaction(uid, {
            ...transaction,
            note: `${transaction.note} ${marker}`,
            walletId: sourceWallet.id,
        });
        createdTransactionCount += 1;
    }

    const monthlyStatsByMonth = Object.fromEntries(
        await Promise.all(
            Object.values(savingsSeedMonthKeys).map(async (monthKey) => [
                monthKey,
                await getExpenseMonthlyStats(uid, monthKey),
            ]),
        ),
    );
    const budgets = Object.values(savingsSeedMonthKeys).flatMap((monthKey) =>
        buildSavingsSeedBudgets(
            monthKey,
            monthlyStatsByMonth[monthKey]?.categoryExpenseMinor,
        ),
    );

    await Promise.all(budgets.map((budget) => upsertExpenseBudget(uid, budget)));

    return {
        budgetCount: budgets.length,
        createdTransactionCount,
        savingWalletId: savingWallet.id,
        skippedTransactionCount,
    };
}
