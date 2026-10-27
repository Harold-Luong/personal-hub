// The key belongs to a submission, not a network attempt.
export function createTransactionSubmission() {
    let previousPayload;
    let key;
    return (payload) => {
        const serialized = JSON.stringify(payload);
        if (serialized !== previousPayload) {
            previousPayload = serialized;
            key = crypto.randomUUID();
        }
        return { ...payload, idempotencyKey: key };
    };
}

export function getTransactionRequestFingerprint(input) {
    return JSON.stringify({
        type: input.type,
        amountMinor: Math.round(Math.abs(Number(input.amount ?? input.amountMinor))),
        title: input.title?.trim() ?? "",
        note: input.note?.trim() ?? "",
        date: input.date,
        time: input.time,
        timezone: input.timezone ?? null,
        walletId: input.walletId ?? null,
        categoryId: input.categoryId ?? null,
        fromWalletId: input.fromWalletId ?? null,
        toWalletId: input.toWalletId ?? null,
        adjustmentDirection: input.adjustmentDirection ?? null,
        savingsTransferKind: input.savingsTransferKind ?? null,
        budgetSavingsMonthKey: input.budgetSavingsMonthKey ?? null,
        budgetSavingsCategoryId: input.budgetSavingsCategoryId ?? null,
    });
}
