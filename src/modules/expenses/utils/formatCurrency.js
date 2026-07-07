import {
    expenseCurrencyFractionDigitsByLabel,
    expenseDefaultCurrency,
    expenseDefaultLocale,
} from "../constant/expensesMetaData";

export function formatCurrency(amount, currency = expenseDefaultCurrency, locale = expenseDefaultLocale) {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: expenseCurrencyFractionDigitsByLabel[currency] ?? 2,
    }).format(amount);
}

export function formatCompactCurrency(
    amount,
    currency = expenseDefaultCurrency,
    locale = expenseDefaultLocale,
) {
    return formatCurrency(amount, currency, locale).replace(/\s/g, "");
}

export function parseCurrencyInput(value) {
    const digits = String(value ?? "").replace(/\D/g, "");

    return digits ? Number(digits) : 0;
}

export function formatCurrencyInput(value, locale = expenseDefaultLocale) {
    const amount = parseCurrencyInput(value);

    return amount ? new Intl.NumberFormat(locale).format(amount) : "";
}
