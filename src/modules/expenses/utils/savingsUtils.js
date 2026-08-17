import {
    creditCardWalletTypeId,
    savingWalletTypeId,
    savingsTransferKindIds,
    savingsTransferKinds,
} from "../constants/expenseMetadata";

export function isSavingWallet(wallet) {
    return wallet?.type === savingWalletTypeId;
}

export function isSpendableWallet(wallet) {
    return Boolean(
        wallet
        && wallet.type !== savingWalletTypeId
        && wallet.type !== creditCardWalletTypeId,
    );
}

export function getSavingWallets(wallets = []) {
    return wallets.filter(isSavingWallet);
}

export function getSpendableWallets(wallets = []) {
    return wallets.filter(isSpendableWallet);
}

export function getSavingsSummary(wallets = []) {
    const savingWallets = getSavingWallets(wallets);
    const spendableWallets = getSpendableWallets(wallets);

    return {
        savingBalance: savingWallets.reduce(
            (total, wallet) => total + Number(wallet.balance ?? 0),
            0,
        ),
        savingWalletCount: savingWallets.length,
        spendableBalance: spendableWallets.reduce(
            (total, wallet) => total + Number(wallet.balance ?? 0),
            0,
        ),
    };
}

export function getSavingsTransferKind(transaction, wallets = []) {
    if (savingsTransferKindIds.includes(transaction?.savingsTransferKind)) {
        return transaction.savingsTransferKind;
    }

    if (transaction?.budgetSavingsMonthKey) {
        return savingsTransferKinds.DEPOSIT;
    }

    const savingWalletIds = new Set(getSavingWallets(wallets).map((wallet) => wallet.id));

    if (savingWalletIds.has(transaction?.toWalletId)) {
        return savingsTransferKinds.DEPOSIT;
    }

    if (savingWalletIds.has(transaction?.fromWalletId)) {
        return savingsTransferKinds.WITHDRAWAL;
    }

    return null;
}

export function getSavingsTransferValidationError({ fromWallet, kind, toWallet }) {
    const fromIsSaving = isSavingWallet(fromWallet);
    const toIsSaving = isSavingWallet(toWallet);

    if (!kind) {
        return fromIsSaving || toIsSaving
            ? "Ví Tiết kiệm chỉ được sử dụng qua luồng Nạp hoặc Rút tiền tiết kiệm."
            : "";
    }

    if (!savingsTransferKindIds.includes(kind)) {
        return "Loại giao dịch tiết kiệm không hợp lệ.";
    }

    if (kind === savingsTransferKinds.DEPOSIT) {
        if (!isSpendableWallet(fromWallet) || !toIsSaving) {
            return "Tiền tiết kiệm phải được nạp từ ví chi tiêu sang ví Tiết kiệm.";
        }
    } else if (!fromIsSaving || !isSpendableWallet(toWallet)) {
        return "Tiền tiết kiệm chỉ được rút từ ví Tiết kiệm sang ví chi tiêu.";
    }

    if ((fromWallet?.currency ?? "VND") !== (toWallet?.currency ?? "VND")) {
        return "Ví nguồn và ví nhận phải dùng cùng loại tiền tệ.";
    }

    return "";
}
