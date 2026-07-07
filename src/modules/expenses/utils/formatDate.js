import { expenseWeekdayLabels } from "../constant/expensesMetaData";

export const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${expenseWeekdayLabels[date.getDay()]}, ${day}/${month}/${year}`;
};
