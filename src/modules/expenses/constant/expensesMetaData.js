export const expenseNavItems = [
    {
        id: "dashboard",
        label: "Tổng quan",
        icon: "home",
        path: "/expenses/dashboard",
    },
    {
        id: "transactions",
        label: "Giao dịch",
        icon: "card",
        path: "/expenses/transactions",
    },
    {
        id: "budgets",
        label: "Ngân sách",
        icon: "income",
        path: "/expenses/budgets",
    },
    {
        id: "report",
        label: "Báo cáo",
        icon: "chart",
        path: "/expenses/report",
    },
    {
        id: "categories",
        label: "Danh mục",
        icon: "momo",
        path: "/expenses/categories",
    },
    {
        id: "wallets",
        label: "Ví tiền",
        icon: "wallet",
        path: "/expenses/wallets",
    },
    {
        id: "settings",
        label: "Cài đặt",
        icon: "settings",
        path: "/expenses/settings",
    },
];

export const expenseBottomNavOrder = [
    "dashboard",
    "transactions",
    "report",
    "settings",
];

export const expenseThemes = [
    "sage",
    "fjord",
    "clay",
    "blossom",
    "vintage",
    "retro",
];

export const expenseThemeOptions = [
    { id: "sage", label: "Sage", color: "#6b8f71", accent: "#2f7246" },
    { id: "fjord", label: "Fjord", color: "#8fa6ac", accent: "#3f7280" },
    { id: "clay", label: "Clay", color: "#c97964", accent: "#9f5947" },
    { id: "blossom", label: "Blossom", color: "#d77fa1", accent: "#ad5278" },
    { id: "vintage", label: "Vintage", color: "#87966b", accent: "#ae8b52" },
    { id: "retro", label: "Retro", color: "#d2673d", accent: "#14706c" },
];

export const expenseCurrencies = ["VND", "USD"];

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
    { id: "expense", label: "Chi tiêu" },
    { id: "income", label: "Thu nhập" },
    { id: "transfer", label: "Chuyển khoản" },
];

export const scandinavianCategoryColors = [
    "#6B8F71", // sage green
    "#8FA6AC", // blue gray
    "#D9A441", // muted mustard
    "#C97964", // soft terracotta
    "#9B8FB8", // dusty lavender
    "#7E9F90", // eucalyptus
    "#B8A88A", // warm taupe
    "#E0B88A", // soft sand orange
    "#8797B2", // muted Nordic blue
    "#A7B89A", // moss light
    "#D08C7A", // salmon clay
    "#A8A29E", // stone gray
];

export const scandinavianCategoryColorPairs = [
    { color: "#6B8F71", background: "#EEF4EE" },
    { color: "#8FA6AC", background: "#EEF3F4" },
    { color: "#D9A441", background: "#FAF3E2" },
    { color: "#C97964", background: "#F8ECE8" },
    { color: "#9B8FB8", background: "#F2EFF7" },
    { color: "#7E9F90", background: "#EDF4F0" },
    { color: "#B8A88A", background: "#F5F1EA" },
    { color: "#E0B88A", background: "#FAF0E3" },
    { color: "#8797B2", background: "#EEF1F6" },
    { color: "#A7B89A", background: "#F0F5ED" },
    { color: "#D08C7A", background: "#F8EDEA" },
    { color: "#A8A29E", background: "#F3F2F1" },
];
