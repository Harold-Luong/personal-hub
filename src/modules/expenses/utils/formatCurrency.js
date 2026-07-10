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

export function parseSignedCurrencyInput(value) {
    const normalizedValue = String(value ?? "").trim();
    const amount = parseCurrencyInput(normalizedValue);

    return normalizedValue.startsWith("-") ? -amount : amount;
}

export function formatCurrencyInput(value, locale = expenseDefaultLocale) {
    const amount = parseCurrencyInput(value);

    return amount ? new Intl.NumberFormat(locale).format(amount) : "";
}

export function formatSignedCurrencyInput(value, locale = expenseDefaultLocale) {
    const normalizedValue = String(value ?? "").trim();

    if (normalizedValue === "-") {
        return normalizedValue;
    }

    const amount = parseSignedCurrencyInput(normalizedValue);

    return amount ? `${amount < 0 ? "-" : ""}${new Intl.NumberFormat(locale).format(Math.abs(amount))}` : "";
}
