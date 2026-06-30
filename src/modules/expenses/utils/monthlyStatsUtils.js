export function getPreviousMonthKey(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    const previousMonth = new Date(year, month - 2, 1);
    const previousMonthValue = String(previousMonth.getMonth() + 1).padStart(
        2,
        "0",
    );

    return `${previousMonth.getFullYear()}-${previousMonthValue}`;
}

export function getEmptyMonthlyStats(monthKey) {
    return {
        monthKey,
        incomeMinor: 0,
        expenseMinor: 0,
        netMinor: 0,
        transactionCount: 0,
        categoryExpenseMinor: {},
        categoryIncomeMinor: {},
    };
}

export function calculateTrend(currentValue, previousValue) {
    const currentNumber = Number(currentValue);
    const previousNumber = Number(previousValue);

    if (
        !Number.isFinite(currentNumber) ||
        !Number.isFinite(previousNumber) ||
        previousNumber === 0
    ) {
        return 0;
    }

    return (
        Math.round(
            ((currentNumber - previousNumber) / Math.abs(previousNumber)) *
                1000,
        ) / 10
    );
}
