export function getTransactionWalletLabel(transaction) {
    if (transaction.type === "transfer") {
        return [
            transaction.fromWalletName || transaction.fromWalletId,
            transaction.toWalletName || transaction.toWalletId,
        ]
            .filter(Boolean)
            .join(" -> ");
    }

    return transaction.walletName || transaction.walletId || "-";
}

export function getTransactionCategoryLabel(transaction) {
    if (transaction.type === "transfer") {
        return "Chuyển khoản";
    }

    if (transaction.type === "adjustment") {
        return "Điều chỉnh số dư";
    }

    return transaction.categoryName || transaction.category || "-";
}

export function getTransactionDateParts(transaction) {
    const [day, month] = transaction.date?.split("-").reverse() || [];
    const dateLabel = day && month ? `${day}/${month}` : transaction.date || "-";

    return {
        dateLabel,
        dateTime: `${transaction.date ?? ""}T${transaction.time ?? ""}`,
        timeLabel: transaction.time || "--:--",
    };
}

export function getTransactionSortTime(transaction) {
    const timestamp = new Date(`${transaction.date ?? ""}T${transaction.time || "00:00"}`).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getTransactionSortAmount(transaction) {
    return Number(transaction.amount ?? 0);
}
