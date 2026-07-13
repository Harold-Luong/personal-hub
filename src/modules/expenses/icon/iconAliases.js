export const expenseIconAliases = Object.freeze({
    bag: "shopping",
    bill: "bills",
    bus: "transport",
    fun: "entertainment",
    game: "entertainment",
    gift: "gifts",
    heart: "charity",
    meal: "food",
    momo: "digital-wallet",
    pet: "pets",
    receipt: "tax",
    shop: "business",
    swap: "transfer",
    user: "personal-care",
    utensils: "food",
});

export function getCanonicalExpenseIconKey(iconKey) {
    const normalizedIconKey = String(iconKey ?? "more").trim().toLocaleLowerCase("en");

    return expenseIconAliases[normalizedIconKey] ?? normalizedIconKey;
}
