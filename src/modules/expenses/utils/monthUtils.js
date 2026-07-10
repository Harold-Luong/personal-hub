import { expenseFilterValues } from "../constant/expensesUiMetaData";

export function getCurrentMonthKey(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${date.getFullYear()}-${month}`;
}

export function getCurrentYear(date = new Date()) {
    return date.getFullYear();
}

export function getCompactMonthLabel(monthKey) {
    const [year, month] = String(monthKey ?? "").split("-");

    return month && year ? `${month}/${year}` : monthKey;
}

export function getMonthLabel(monthKey, allLabel = "Tất cả tháng") {
    if (!monthKey || monthKey === expenseFilterValues.ALL) {
        return allLabel;
    }

    const compactLabel = getCompactMonthLabel(monthKey);

    return compactLabel === monthKey ? monthKey : `Tháng ${compactLabel}`;
}

export function getMonthDayOptions(monthKey, fallbackMonthKey = getCurrentMonthKey()) {
    const resolvedMonthKey =
        monthKey && monthKey !== expenseFilterValues.ALL ? monthKey : fallbackMonthKey;
    const [year, month] = resolvedMonthKey.split("-").map(Number);

    if (!year || !month) {
        return [];
    }

    const lastDay = new Date(year, month, 0).getDate();

    return Array.from({ length: lastDay }, (_, index) => String(index + 1).padStart(2, "0"));
}

export function getVisibleMonthOptions(monthKeys, currentMonthKey = getCurrentMonthKey()) {
    return [...new Set([currentMonthKey, ...monthKeys])].sort((first, second) => second.localeCompare(first));
}
