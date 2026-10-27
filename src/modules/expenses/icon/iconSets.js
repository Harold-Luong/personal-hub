import { baseIconSet } from "./base/baseIconSet";
import { duotoneIconSet } from "./duotone/duotoneIconSet";

export const expenseIconSetIds = Object.freeze({
    BASE: "base",
    // Retain the persisted value so existing Firestore/local preferences work.
    DUOTONE: "emoji",
});

export const expenseIconSetIdValues = Object.freeze(Object.values(expenseIconSetIds));
export const expenseDefaultIconSet = expenseIconSetIds.DUOTONE;

export const expenseIconSetOptions = Object.freeze([
    { id: expenseIconSetIds.DUOTONE, label: "Hai tông màu", description: "Mảng tô mềm, màu sắc theo danh mục" },
    { id: expenseIconSetIds.BASE, label: "Nét tối giản", description: "Nét mảnh, gọn và đồng nhất" },
]);

export const expenseIconSets = Object.freeze({
    [expenseIconSetIds.BASE]: baseIconSet,
    [expenseIconSetIds.DUOTONE]: duotoneIconSet,
});

// Controls keep a consistent silhouette; category/wallet illustrations retain
// the user's preference. Explicit appearance still overrides auto selection.
export const expenseControlIconKeys = new Set([
    "add", "close", "delete", "download", "edit", "filter", "logout", "search",
    "sort", "theme", "notifications", "visibility", "calendar", "loading", "info",
    "arrow-right", "expense", "trend-up", "trend-down", "transfer",
    "chevron-down", "chevron-left", "chevron-right", "chevron-up",
]);
