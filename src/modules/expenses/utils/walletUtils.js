import { creditCardWalletTypeId } from "../constants/expenseMetadata";

const creditWalletDisplaySuffix = "(Credit)";
const creditWalletDisplayPattern = /\s*\(credit\)$/i;
const defaultWalletDisplaySuffix = "(mặc định)";
const defaultWalletDisplayPattern = /\s*\(mặc định\)$/i;

export function isCreditCardWallet(wallet) {
    return wallet?.type === creditCardWalletTypeId;
}

export function normalizeWalletName(name) {
    return String(name ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("vi");
}

export function getWalletNameWithDefaultLabel(wallet, name = wallet?.name ?? "") {
    if (!name || !wallet?.isDefaultWallet || defaultWalletDisplayPattern.test(name.trim())) {
        return name;
    }

    return `${name} ${defaultWalletDisplaySuffix}`;
}

export function getWalletsWithResolvedDefault(wallets = [], defaultWalletId = "") {
    return wallets.map((wallet) => ({
        ...wallet,
        isDefaultWallet: Boolean(defaultWalletId && wallet.id === defaultWalletId),
    }));
}

export function getWalletsDefaultFirst(wallets = []) {
    return wallets
        .map((wallet, index) => ({ index, wallet }))
        .sort((firstItem, secondItem) => {
            const firstIsDefault = Boolean(firstItem.wallet.isDefaultWallet);
            const secondIsDefault = Boolean(secondItem.wallet.isDefaultWallet);

            if (firstIsDefault !== secondIsDefault) {
                return firstIsDefault ? -1 : 1;
            }

            return firstItem.index - secondItem.index;
        })
        .map(({ wallet }) => wallet);
}

export function getTransactionsWithCurrentWalletDisplayNames(transactions = [], wallets = []) {
    if (!transactions.length || !wallets.length) {
        return transactions;
    }

    const walletsById = new Map(wallets.map((wallet) => [wallet.id, wallet]));
    const getCurrentWalletName = (walletId, fallbackName) => {
        const wallet = walletsById.get(walletId);

        return wallet ? getWalletDisplayName(wallet) : fallbackName;
    };

    return transactions.map((transaction) => {
        const walletName = getCurrentWalletName(transaction.walletId, transaction.walletName);
        const fromWalletName = getCurrentWalletName(transaction.fromWalletId, transaction.fromWalletName);
        const toWalletName = getCurrentWalletName(transaction.toWalletId, transaction.toWalletName);

        if (
            walletName === transaction.walletName &&
            fromWalletName === transaction.fromWalletName &&
            toWalletName === transaction.toWalletName
        ) {
            return transaction;
        }

        return {
            ...transaction,
            fromWalletName,
            toWalletName,
            walletName,
        };
    });
}

export function getWalletDisplayName(wallet) {
    const name = wallet?.name ?? "";

    if (!name || !isCreditCardWallet(wallet)) {
        return getWalletNameWithDefaultLabel(wallet, name);
    }

    if (creditWalletDisplayPattern.test(name.trim())) {
        return getWalletNameWithDefaultLabel(wallet, name);
    }

    return getWalletNameWithDefaultLabel(wallet, `${name} ${creditWalletDisplaySuffix}`);
}
