export const expensePageMeta = {
    dashboard: {
        label: "Tổng quan",
        icon: "home",
        path: "/expenses/dashboard",
        isRouted: true,
    },
    transactions: {
        label: "Giao dịch",
        icon: "card",
        path: "/expenses/transactions",
        isRouted: true,
    },
    categories: {
        label: "Chi tiêu",
        icon: "category",
        path: "/expenses/category-spending",
        isRouted: true,
    },
    report: {
        label: "Báo cáo",
        icon: "chart",
        path: "/expenses/report",
        isRouted: true,
    },
    budgets: {
        label: "Ngân sách",
        icon: "income",
        path: "/expenses/budgets",
    },
    wallets: {
        label: "Ví tiền",
        icon: "wallet",
        path: "/expenses/wallets",
    },
    settings: {
        label: "Cài đặt",
        icon: "settings",
        path: "/expenses/settings",
    },
};

export const expenseNavItems = Object.entries(expensePageMeta).map(([id, item]) => ({
    id,
    icon: item.icon,
    label: item.label,
    path: item.path,
}));

export const expenseBottomNavOrder = [
    "dashboard",
    "transactions",
    "report",
    "settings",
];

export const expenseRoutePaths = Object.fromEntries(
    Object.entries(expensePageMeta)
        .filter(([, item]) => item.isRouted)
        .map(([id, item]) => [id, item.path]),
);

export const expenseMobileOnlyPageIds = ["add", "budget", "wallets", "settings"];

export const expenseCurrencies = [
    {
        label: "VND",
        symbol: "₫",
        maximumFractionDigits: 0,
    },
    {
        label: "USD",
        symbol: "$",
        maximumFractionDigits: 2,
    },
];

export const expenseCurrencyLabels = expenseCurrencies.map((currency) => currency.label);

export const expenseCurrencySymbolByLabel = Object.fromEntries(
    expenseCurrencies.map((currency) => [currency.label, currency.symbol]),
);

export const expenseCurrencyFractionDigitsByLabel = Object.fromEntries(
    expenseCurrencies.map((currency) => [currency.label, currency.maximumFractionDigits]),
);

export const expenseDefaultCurrency = expenseCurrencies[0].label;
export const expenseDefaultLocale = "vi-VN";
export const expenseDefaultTimezone = "Asia/Ho_Chi_Minh";

export const expenseThemeOptions = [
    { id: "sage", label: "Sage", color: "#6b8f71", accent: "#2f7246" },
    { id: "fjord", label: "Fjord", color: "#8fa6ac", accent: "#3f7280" },
    { id: "clay", label: "Clay", color: "#c97964", accent: "#9f5947" },
    { id: "blossom", label: "Blossom", color: "#d77fa1", accent: "#ad5278" },
    { id: "vintage", label: "Vintage", color: "#87966b", accent: "#ae8b52" },
    { id: "retro", label: "Retro", color: "#d2673d", accent: "#14706c" },
];

export const expenseThemeIds = expenseThemeOptions.map((themeOption) => themeOption.id);
export const expenseDefaultTheme = expenseThemeOptions[0].id;

export const walletTypeOptions = [
    { id: "cash", label: "Tiền mặt", icon: "wallet", color: "#56b879" },
    { id: "bank", label: "Ngân hàng", icon: "bank", color: "#4f93d7" },
    { id: "card", label: "Thẻ", icon: "card", color: "#9b7bd8" },
    { id: "eWallet", label: "Ví điện tử", icon: "momo", color: "#d77fa1" },
    { id: "saving", label: "Tiết kiệm", icon: "saving", color: "#d9a441" },
    { id: "other", label: "Khác", icon: "more", color: "#b8bec8" },
];

export const walletTypeIds = walletTypeOptions.map((walletType) => walletType.id);

export const walletTypeLabels = Object.fromEntries(
    walletTypeOptions.map((walletType) => [walletType.id, walletType.label]),
);

export const walletTypeMeta = Object.fromEntries(
    walletTypeOptions.map(({ color, icon, id }) => [id, { color, icon }]),
);

export const expenseDefaultWalletTypeId = walletTypeOptions[0].id;
export const expenseDefaultWalletTypeMeta = walletTypeMeta[expenseDefaultWalletTypeId] ?? walletTypeMeta.other;
export const expenseDefaultWalletId = `default-wallet-${expenseDefaultWalletTypeId}`;

export const budgetStatusMeta = {
    exceeded: {
        label: "Vượt hạn mức",
        color: "#dc1717",
    },
    normal: {
        label: "Trong kế hoạch",
    },
    warning: {
        label: "Gần chạm ngưỡng",
        color: "#d98c00",
    },
};

export const budgetStatusColors = Object.fromEntries(
    Object.entries(budgetStatusMeta)
        .filter(([, status]) => status.color)
        .map(([id, status]) => [id, status.color]),
);

export const budgetStatusLabels = Object.fromEntries(
    Object.entries(budgetStatusMeta).map(([id, status]) => [id, status.label]),
);

export const budgetExceededThresholdPercentage = 100;
export const budgetWarningThresholdPercentage = 80;

export const editableTransactionTypeIds = ["expense", "income", "transfer"];
export const transactionTypeIds = [...editableTransactionTypeIds, "adjustment"];

export const transactionTypeMeta = {
    expense: {
        label: "Chi tiêu",
        tone: "expense",
    },
    income: {
        label: "Thu nhập",
        tone: "income",
    },
    transfer: {
        label: "Chuyển khoản",
        tone: "transfer",
    },
    adjustment: {
        label: "Điều chỉnh",
        tone: "neutral",
    },
    default: {
        label: "Giao dịch",
        tone: "expense",
    },
};

export const transactionTypeOptions = editableTransactionTypeIds.map((id) => ({
    id,
    label: transactionTypeMeta[id].label,
}));

export const expenseSummaryItems = [
    {
        id: "balance",
        label: "Tổng số dư",
        tone: "positive",
        icon: "eye",
    },
    {
        id: "income",
        label: "Tổng thu nhập",
        tone: "positive",
        icon: "wallet",
    },
    {
        id: "expense",
        label: "Tổng chi tiêu",
        tone: "danger",
        icon: "card",
    },
    {
        id: "saving",
        label: "Tiết kiệm",
        tone: "warning",
        icon: "saving",
    },
];

export const expenseTransactionFilters = [
    { id: "all", label: "Tất cả" },
    ...transactionTypeIds.map((id) => ({
        id,
        label: transactionTypeMeta[id].label,
    })),
];

export const transactionFallbackCategoryOptions = {
    transfer: [{ id: "transfer", name: transactionTypeMeta.transfer.label, icon: "transfer" }],
};

export const transactionSummaryTypeIds = ["income", "expense", "transfer"];

export const transactionSummaryItems = [
    {
        id: "count",
        label: `Tổng ${transactionTypeMeta.default.label.toLowerCase()}`,
        tone: "neutral",
        valueKey: "count",
    },
    ...transactionSummaryTypeIds.map((id) => ({
        id,
        label: transactionTypeMeta[id].label,
        tone: transactionTypeMeta[id].tone,
        valueKey: id,
    })),
];

export const transactionPageSizeOptions = [10, 15, 20];
export const transactionDefaultPageSize = transactionPageSizeOptions[0] ?? 10;
export const transactionMaxPageSize = 50;
export const transactionPaginationWindowSize = 4;
export const transactionSearchDebounceMs = 350;
export const transactionDefaultSort = { key: "date", direction: "desc" };
export const expenseMaxSearchTokens = 500;

export const categoryTransactionPageSize = 15;
export const categoryChartTopCategoryLimit = 5;
export const categoryChartPinnedCategoryLimit = 3;

export const reportTrendMonthCount = 6;
export const reportComparisonMonthCount = 5;
export const reportCategoryComparisonLimit = 3;
export const reportTopTransactionLimit = 5;
export const reportSavingsTargetPercentage = 30;
export const reportChartSeries = {
    amount: transactionTypeMeta.expense.label,
    average: `Trung bình ${transactionTypeMeta.expense.label.toLowerCase()}`,
    expense: transactionTypeMeta.expense.label,
    income: transactionTypeMeta.income.label,
};

export const expenseWeekdayLabels = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export const colorsFallback = ["#2f80ed", "#f28c28", "#2ead59", "#7a52d1", "#e24f95", "#2cb7bc", "#9a6bf1"];

export const distributionFallbackColors = ["#f6a400", "#2f9fe8", "#36b56a", "#e95f84", "#d47a6a", "#8b6df3", "#9aa0a8"];

export const scandinavianCategoryColorPairs = [
    { color: "#6B8F71", background: "#EEF4EE" }, // sage green
    { color: "#8FA6AC", background: "#EEF3F4" }, // blue gray
    { color: "#D9A441", background: "#FAF3E2" }, // muted mustard
    { color: "#C97964", background: "#F8ECE8" }, // soft terracotta
    { color: "#9B8FB8", background: "#F2EFF7" }, // dusty lavender
    { color: "#7E9F90", background: "#EDF4F0" }, // eucalyptus
    { color: "#B8A88A", background: "#F5F1EA" }, // warm taupe
    { color: "#E0B88A", background: "#FAF0E3" }, // soft sand orange
    { color: "#8797B2", background: "#EEF1F6" }, // muted Nordic blue
    { color: "#A7B89A", background: "#F0F5ED" }, // moss light
    { color: "#D08C7A", background: "#F8EDEA" }, // salmon clay
    { color: "#A8A29E", background: "#F3F2F1" }, // stone gray
];

export const scandinavianCategoryColors = scandinavianCategoryColorPairs.map(({ color }) => color);
