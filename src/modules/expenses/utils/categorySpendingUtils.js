function buildCategorySpendingByMonthData({ categories = [], monthlyStats, monthKey }) {
    const resolvedMonthlyStats = !monthKey || monthlyStats?.monthKey === monthKey ? monthlyStats : null;
    const monthlyExpense = resolvedMonthlyStats?.expenseMinor ?? 0;
    const categorySpendingById = resolvedMonthlyStats?.categoryExpenseMinor ?? {};

    return categories
        .filter((category) => category.type === "expense")
        .map((category) => {
            const amount = categorySpendingById[category.id] ?? 0;

            return {
                ...category,
                amount,
                monthKey: monthKey ?? resolvedMonthlyStats?.monthKey ?? "",
                percentage: monthlyExpense > 0 ? Math.round((amount / monthlyExpense) * 100) : 0,
            };
        })
        .filter((category) => category.amount > 0);
}

export function getCategorySpendingByMonth({ categories, monthKey, monthlyStats, uid }) {
    if (categories && monthlyStats) {
        return buildCategorySpendingByMonthData({
            categories,
            monthKey,
            monthlyStats,
        });
    }

    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    return Promise.all([
        import("../api/categoriesRepository"),
        import("../api/monthlyStatsRepository"),
    ]).then(([{ getExpenseCategories }, { getExpenseMonthlyStats }]) =>
        Promise.all([
            getExpenseCategories(uid),
            getExpenseMonthlyStats(uid, monthKey),
        ]),
    ).then(([nextCategories, nextMonthlyStats]) =>
        buildCategorySpendingByMonthData({
            categories: nextCategories,
            monthKey,
            monthlyStats: nextMonthlyStats,
        }),
    );
}
