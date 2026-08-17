import {
    budgetExceededThresholdPercentage,
    budgetWarningThresholdPercentage,
    transactionTypes,
} from "../constants/expenseMetadata";

// Chuyen moi gia tri ve so an toan de tranh NaN lam hong cong thuc.
function toSafeNumber(value) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
}

// Tinh ti le phan tram va tra ve 0 neu tong khong hop le hoac bang 0.
export function calculatePercentage(value, total) {
    const safeTotal = toSafeNumber(total);

    if (safeTotal <= 0) {
        return 0;
    }

    return Math.round((toSafeNumber(value) / safeTotal) * 100);
}

// Tinh phan tram cho progress bar va gioi han trong khoang 0 den 100.
export function calculateProgressPercentage(value, max) {
    return Math.min(Math.max(calculatePercentage(value, max), 0), 100);
}

// Tinh phan tram da dung cua mot ngan sach.
export function calculateBudgetUsagePercentage(budget) {
    return calculatePercentage(budget?.amount, budget?.limit);
}

// Phan loai trang thai ngan sach de UI doi mau khi cham nguong canh bao.
export function getBudgetUsageStatus(budget, defaultAlertThreshold = budgetWarningThresholdPercentage) {
    const percentage = calculateBudgetUsagePercentage(budget);
    const alertThreshold = toSafeNumber(
        budget?.alertThreshold ?? defaultAlertThreshold,
    );

    if (percentage >= budgetExceededThresholdPercentage) {
        return "exceeded";
    }

    if (alertThreshold > 0 && percentage >= alertThreshold) {
        return "warning";
    }

    return "normal";
}

// Tinh tong tien da chi, tong han muc va phan tram su dung cua danh sach ngan sach.
export function calculateMonthlyBudgetTotals(budgets = []) {
    const totals = budgets.reduce(
        (result, budget) => ({
            spent: result.spent + Math.max(toSafeNumber(budget.amount), 0),
            limit: result.limit + Math.max(toSafeNumber(budget.limit), 0),
        }),
        { spent: 0, limit: 0 },
    );

    return {
        ...totals,
        percentage: calculatePercentage(totals.spent, totals.limit),
        savingsVsPlan: totals.limit - totals.spent,
    };
}

// Lay cac danh muc cua thang truoc con du ngan sach de nguoi dung can nhac dua vao tiet kiem.
export function getBudgetSavingsCandidates(budgets = []) {
    return budgets
        .map((budget) => {
            const limit = Math.max(toSafeNumber(budget?.limit), 0);
            const spent = Math.max(toSafeNumber(budget?.amount), 0);

            return {
                ...budget,
                savingsAmount: limit - spent,
            };
        })
        .filter((budget) => budget.savingsAmount > 0)
        .sort((firstBudget, secondBudget) => secondBudget.savingsAmount - firstBudget.savingsAmount);
}

// Chuan hoa so tien giao dich: thu nhap la so duong, chi tieu/chuyen khoan la so am.
export function getSignedTransactionAmount(amount, type) {
    const safeAmount = Math.abs(toSafeNumber(amount));

    if (type === transactionTypes.INCOME) {
        return safeAmount;
    }

    return -safeAmount;
}
