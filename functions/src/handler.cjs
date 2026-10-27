const { HttpsError } = require("firebase-functions/v2/https");
const { FieldValue, Timestamp } = require("firebase-admin/firestore");
const { firestore } = require("./firestore.cjs");
// The bundled domain and handler must share the same AsyncLocalStorage instance.
const { withTransaction } = require("./firestoreAdapter.cjs");
const domain = require("../lib/domain.cjs");

function plainResult(value) {
    if (value instanceof FieldValue) return null;
    if (value instanceof Timestamp) return { seconds: value.seconds, nanoseconds: value.nanoseconds };
    if (Array.isArray(value)) return value.map(plainResult);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
        .filter(([, item]) => item !== undefined).map(([key, item]) => [key, plainResult(item)]));
    return value;
}

exports.handleMutation = async (request) => {
    if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Bạn cần đăng nhập.");
    const { action, input, transactionId } = request.data ?? {};
    if (!Object.hasOwn(domain, action)) throw new HttpsError("invalid-argument", "Thao tác không hợp lệ.");
    if (action !== "voidExpenseTransaction" && (!input || typeof input !== "object" || Array.isArray(input))) {
        throw new HttpsError("invalid-argument", "Dữ liệu không hợp lệ.");
    }
    if (transactionId !== undefined && !/^[a-zA-Z0-9_-]{1,128}$/.test(transactionId)) {
        throw new HttpsError("invalid-argument", "Mã giao dịch không hợp lệ.");
    }
    if (action === "createExpenseTransaction" && (!/^[a-zA-Z0-9_-]{1,128}$/.test(input.idempotencyKey ?? "")
        || !["expense", "income", "transfer", "creditPayment"].includes(input.type))) {
        throw new HttpsError("invalid-argument", "Thiếu mã gửi hoặc loại giao dịch không hợp lệ.");
    }
    if (input && [input.id, input.walletId, input.fromWalletId, input.toWalletId, input.categoryId]
        .some((id) => id != null && (typeof id !== "string" || id.includes("/") || id.length > 128))) {
        throw new HttpsError("invalid-argument", "Mã tham chiếu không hợp lệ.");
    }
    const uid = request.auth.uid; // Never authorize using a client-supplied UID.
    try {
        return await firestore.runTransaction(async (transaction) => {
            const lock = firestore.doc(`users/${uid}/modules/expenses/mutationLocks/main`);
            await transaction.get(lock);
            const result = await withTransaction(transaction, () => {
                if (action === "updateExpenseTransaction") return domain[action](uid, transactionId, input);
                if (action === "voidExpenseTransaction") return domain[action](uid, transactionId);
                return domain[action](uid, input);
            });
            transaction.set(lock, { updatedAt: FieldValue.serverTimestamp() });
            return plainResult(result);
        });
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("failed-precondition", error.message || "Không thể cập nhật dữ liệu.");
    }
};
