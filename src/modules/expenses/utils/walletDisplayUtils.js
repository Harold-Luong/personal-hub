import { creditCardWalletTypeId } from "../constant/expensesMetaData";

const creditWalletDisplaySuffix = "(Credit)";
const creditWalletDisplayPattern = /\s*\(credit\)$/i;

export function getWalletDisplayName(wallet) {
    const name = wallet?.name ?? "";

    if (!name || wallet?.type !== creditCardWalletTypeId) {
        return name;
    }

    if (creditWalletDisplayPattern.test(name.trim())) {
        return name;
    }

    return `${name} ${creditWalletDisplaySuffix}`;
}
