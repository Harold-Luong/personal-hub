import {
    Timestamp,
    collection,
    doc,
    getDocsFromServer,
    limit,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";

const transactionTypes = ["expense", "income", "transfer"];
const defaultTimezone = "Asia/Bangkok";

function getTransactionsCollectionRef(uid) {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    return collection(
        firestore,
        "users",
        uid,
        "modules",
        "expenses",
        "transactions",
    );
}

function getTransactionRef(uid) {
    return doc(getTransactionsCollectionRef(uid));
}

function getWalletRef(uid, walletId) {
    if (!walletId) {
        throw new Error("A wallet id is required.");
    }

    return doc(
        firestore,
        "users",
        uid,
        "modules",
        "expenses",
        "wallets",
        walletId,
    );
}

function getCategoryRef(uid, categoryId) {
    if (!categoryId) {
        throw new Error("A category id is required.");
    }

    return doc(
        firestore,
        "users",
        uid,
        "modules",
        "expenses",
        "categories",
        categoryId,
    );
}

function getMonthlyStatsRef(uid, monthKey) {
    if (!monthKey) {
        throw new Error("A month key is required.");
    }

    return doc(
        firestore,
        "users",
        uid,
        "modules",
        "expenses",
        "monthlyStats",
        monthKey,
    );
}

function normalizeText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("vi")
        .replace(/đ/g, "d")
        .trim();
}

function toPositiveInteger(value) {
    const numberValue = Math.round(Math.abs(Number(value)));

    if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
        throw new Error("Transaction amount must be a positive integer.");
    }

    return numberValue;
}

function getOccurrence(date, time) {
    if (!date || !time) {
        throw new Error("Transaction date and time are required.");
    }

    const occurredDate = new Date(`${date}T${time}:00`);

    if (Number.isNaN(occurredDate.getTime())) {
        throw new Error("Transaction date or time is invalid.");
    }

    return Timestamp.fromDate(occurredDate);
}

function getTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || defaultTimezone;
}

function getSnapshotData(snapshot, label) {
    if (!snapshot.exists()) {
        throw new Error(`${label} does not exist.`);
    }

    const data = snapshot.data();

    if (data.isArchived) {
        throw new Error(`${label} is archived.`);
    }

    return data;
}

function getWalletSnapshot(wallet) {
    return {
        name: wallet.name,
        icon: wallet.icon ?? "wallet",
        color: wallet.color ?? "#56b879",
    };
}

function getCategorySnapshot(category) {
    return {
        name: category.name,
        icon: category.icon ?? "more",
        color: category.color ?? "#b8bec8",
    };
}

function getTransactionTime(data) {
    const date = data.occurredAt?.toDate?.();

    if (!date) {
        return "";
    }

    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
    });
}

function getTransactionSubtitle(data) {
    const date = data.occurredAt?.toDate?.();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const time = getTransactionTime(data);

    if (!date) {
        return time;
    }
    return [time, `${day}/${month}`].filter(Boolean).join(" ");
}

function getSignedAmount(data) {
    if (data.type === "income") {
        return data.amountMinor;
    }

    return -data.amountMinor;
}

function mapTransactionData(id, data) {
    const time = getTransactionTime(data);

    return {
        id,
        type: data.type,
        amount: getSignedAmount(data),
        amountMinor: data.amountMinor,
        category: data.categoryId ?? "transfer",
        icon:
            data.categorySnapshot?.icon ??
            data.fromWalletSnapshot?.icon ??
            data.walletSnapshot?.icon ??
            "transfer",
        title: data.title,
        subtitle: getTransactionSubtitle(data),
        date: data.localDate,
        time: time,
        walletId: data.walletId,
        fromWalletId: data.fromWalletId,
        toWalletId: data.toWalletId,
        note: data.note ?? "",
    };
}

function mapTransactionSnapshot(documentSnapshot) {
    return mapTransactionData(documentSnapshot.id, documentSnapshot.data());
}

function getMonthlyStatsData(monthKey, data = {}) {
    return {
        monthKey,
        incomeMinor: data.incomeMinor ?? 0,
        expenseMinor: data.expenseMinor ?? 0,
        netMinor: data.netMinor ?? 0,
        transactionCount: data.transactionCount ?? 0,
        categoryExpenseMinor: data.categoryExpenseMinor ?? {},
        categoryIncomeMinor: data.categoryIncomeMinor ?? {},
    };
}

function getNextMonthlyStats(
    monthKey,
    currentStats,
    transactionData,
    timestamp,
) {
    const nextStats = {
        ...currentStats,
        monthKey,
        transactionCount: currentStats.transactionCount + 1,
        updatedAt: timestamp,
    };

    if (transactionData.type === "income") {
        nextStats.incomeMinor += transactionData.amountMinor;
        nextStats.categoryIncomeMinor = {
            ...currentStats.categoryIncomeMinor,
            [transactionData.categoryId]:
                (currentStats.categoryIncomeMinor[transactionData.categoryId] ??
                    0) + transactionData.amountMinor,
        };
    }

    if (transactionData.type === "expense") {
        nextStats.expenseMinor += transactionData.amountMinor;
        nextStats.categoryExpenseMinor = {
            ...currentStats.categoryExpenseMinor,
            [transactionData.categoryId]:
                (currentStats.categoryExpenseMinor[
                    transactionData.categoryId
                ] ?? 0) + transactionData.amountMinor,
        };
    }

    nextStats.netMinor = nextStats.incomeMinor - nextStats.expenseMinor;

    return nextStats;
}

export async function getExpenseTransactions(uid, maxTransactions = 50) {
    const transactionsQuery = query(
        getTransactionsCollectionRef(uid),
        where("status", "==", "active"),
        orderBy("occurredAt", "desc"),
        limit(maxTransactions),
    );
    const snapshot = await getDocsFromServer(transactionsQuery);

    return snapshot.docs.map(mapTransactionSnapshot);
}

export async function createExpenseTransaction(uid, input) {
    if (!transactionTypes.includes(input?.type)) {
        throw new Error("Unsupported transaction type.");
    }

    const transactionRef = getTransactionRef(uid);
    const amountMinor = toPositiveInteger(input.amount ?? input.amountMinor);
    const title = input.title?.trim();
    const note = input.note?.trim() ?? "";
    const occurredAt = getOccurrence(input.date, input.time);
    const monthKey = input.date.slice(0, 7);
    const timestamp = serverTimestamp();

    if (!title) {
        throw new Error("Transaction title is required.");
    }

    return runTransaction(firestore, async (firestoreTransaction) => {
        const walletBalanceUpdates = {};
        const monthlyStatsRef = getMonthlyStatsRef(uid, monthKey);
        let nextMonthlyStats;
        let transactionData;

        if (input.type === "transfer") {
            const fromWalletRef = getWalletRef(uid, input.fromWalletId);
            const toWalletRef = getWalletRef(uid, input.toWalletId);

            if (input.fromWalletId === input.toWalletId) {
                throw new Error("Transfer wallets must be different.");
            }

            const [fromWalletSnapshot, toWalletSnapshot, monthlyStatsSnapshot] =
                await Promise.all([
                    firestoreTransaction.get(fromWalletRef),
                    firestoreTransaction.get(toWalletRef),
                    firestoreTransaction.get(monthlyStatsRef),
                ]);
            const fromWallet = getSnapshotData(
                fromWalletSnapshot,
                "Source wallet",
            );
            const toWallet = getSnapshotData(
                toWalletSnapshot,
                "Destination wallet",
            );
            const currentMonthlyStats = getMonthlyStatsData(
                monthKey,
                monthlyStatsSnapshot.data(),
            );
            const fromBalance = (fromWallet.balance ?? 0) - amountMinor;
            const toBalance = (toWallet.balance ?? 0) + amountMinor;

            transactionData = {
                type: input.type,
                amountMinor,
                currency: fromWallet.currency ?? "VND",
                title,
                titleNormalized: normalizeText(title),
                note,
                categoryId: null,
                walletId: null,
                fromWalletId: input.fromWalletId,
                toWalletId: input.toWalletId,
                walletIds: [input.fromWalletId, input.toWalletId],
                occurredAt,
                localDate: input.date,
                monthKey,
                timezone: getTimezone(),
                categorySnapshot: null,
                walletSnapshot: null,
                fromWalletSnapshot: getWalletSnapshot(fromWallet),
                toWalletSnapshot: getWalletSnapshot(toWallet),
                status: "active",
                createdAt: timestamp,
                updatedAt: timestamp,
                voidedAt: null,
            };
            nextMonthlyStats = getNextMonthlyStats(
                monthKey,
                currentMonthlyStats,
                transactionData,
                timestamp,
            );

            firestoreTransaction.set(transactionRef, transactionData);
            firestoreTransaction.set(monthlyStatsRef, nextMonthlyStats);
            firestoreTransaction.update(fromWalletRef, {
                balance: fromBalance,
                updatedAt: timestamp,
            });
            firestoreTransaction.update(toWalletRef, {
                balance: toBalance,
                updatedAt: timestamp,
            });

            walletBalanceUpdates[input.fromWalletId] = fromBalance;
            walletBalanceUpdates[input.toWalletId] = toBalance;
        } else {
            const walletRef = getWalletRef(uid, input.walletId);
            const categoryRef = getCategoryRef(uid, input.categoryId);
            const [walletSnapshot, categorySnapshot, monthlyStatsSnapshot] =
                await Promise.all([
                    firestoreTransaction.get(walletRef),
                    firestoreTransaction.get(categoryRef),
                    firestoreTransaction.get(monthlyStatsRef),
                ]);
            const wallet = getSnapshotData(walletSnapshot, "Wallet");
            const category = getSnapshotData(categorySnapshot, "Category");
            const currentMonthlyStats = getMonthlyStatsData(
                monthKey,
                monthlyStatsSnapshot.data(),
            );

            if ((category.type ?? "expense") !== input.type) {
                throw new Error(
                    "Transaction category does not match its type.",
                );
            }

            const balanceDelta =
                input.type === "income" ? amountMinor : -amountMinor;
            const nextBalance = (wallet.balance ?? 0) + balanceDelta;

            transactionData = {
                type: input.type,
                amountMinor,
                currency: wallet.currency ?? "VND",
                title,
                titleNormalized: normalizeText(title),
                note,
                categoryId: input.categoryId,
                walletId: input.walletId,
                fromWalletId: null,
                toWalletId: null,
                walletIds: [input.walletId],
                occurredAt,
                localDate: input.date,
                monthKey,
                timezone: getTimezone(),
                categorySnapshot: getCategorySnapshot(category),
                walletSnapshot: getWalletSnapshot(wallet),
                fromWalletSnapshot: null,
                toWalletSnapshot: null,
                status: "active",
                createdAt: timestamp,
                updatedAt: timestamp,
                voidedAt: null,
            };
            nextMonthlyStats = getNextMonthlyStats(
                monthKey,
                currentMonthlyStats,
                transactionData,
                timestamp,
            );

            firestoreTransaction.set(transactionRef, transactionData);
            firestoreTransaction.set(monthlyStatsRef, nextMonthlyStats);
            firestoreTransaction.update(walletRef, {
                balance: nextBalance,
                updatedAt: timestamp,
            });

            walletBalanceUpdates[input.walletId] = nextBalance;
        }

        return {
            monthlyStats: nextMonthlyStats,
            transaction: mapTransactionData(transactionRef.id, transactionData),
            walletBalanceUpdates,
        };
    });
}
