import { expenseWeekdayLabels } from "../constants/expenseMetadata";

export const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let dateFormat = "dd/MM/yyyy";

    if (typeof window !== "undefined") {
        try {
            const state = JSON.parse(window.localStorage.getItem("personal-hub:expense-preferences") ?? "{}");
            dateFormat = state?.state?.expensePreferences?.dateFormat ?? dateFormat;
        } catch {
            dateFormat = "dd/MM/yyyy";
        }
    }

    const dateLabel = dateFormat === "MM/dd/yyyy"
        ? `${month}/${day}/${year}`
        : dateFormat === "yyyy-MM-dd"
            ? `${year}-${month}-${day}`
            : `${day}/${month}/${year}`;

    return `${expenseWeekdayLabels[date.getDay()]}, ${dateLabel}`;
};
