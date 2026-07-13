import { creditCardWalletTypeId } from "../constants/expenseMetadata";

const creditWalletDisplaySuffix = "(Credit)";
const creditWalletDisplayPattern = /\s*\(credit\)$/i;

export function isCreditCardWallet(wallet) {
    return wallet?.type === creditCardWalletTypeId;
}

export function normalizeWalletName(name) {
    return String(name ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("vi");
}

export function getWalletDisplayName(wallet) {
    const name = wallet?.name ?? "";

    if (!name || !isCreditCardWallet(wallet)) {
        return name;
    }

    if (creditWalletDisplayPattern.test(name.trim())) {
        return name;
    }

    return `${name} ${creditWalletDisplaySuffix}`;
}
