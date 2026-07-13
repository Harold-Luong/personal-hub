import {
    expenseCurrencyFractionDigitsByLabel,
    expenseDefaultCurrency,
    expenseDefaultLocale,
} from "../constants/expenseMetadata";

function getStoredPreferences() {
    if (typeof window === "undefined") {
        return {};
    }

    try {
        const state = JSON.parse(window.localStorage.getItem("personal-hub:expense-preferences") ?? "{}");
        return state?.state?.expensePreferences ?? {};
    } catch {
        return {};
    }
}

export function formatCurrency(amount, currency, locale = expenseDefaultLocale) {
    const preferences = getStoredPreferences();
    const selectedCurrency = currency ?? preferences.currency ?? expenseDefaultCurrency;
    const isCompact = preferences.amountFormat === "compact";

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: selectedCurrency,
        notation: isCompact ? "compact" : "standard",
        maximumFractionDigits: isCompact ? 1 : (expenseCurrencyFractionDigitsByLabel[selectedCurrency] ?? 2),
    }).format(amount);
}

export function formatCompactCurrency(
    amount,
    currency,
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
