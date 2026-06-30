import {
    Timestamp,
    collection,
    doc,
    getDocsFromServer,
    limit,
    or as orFilter,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    startAfter,
    where,
} from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";
import { transactionTypeIds as transactionTypes } from "../constant/expensesMetaData";

const defaultTimezone = "Asia/Bangkok";
const defaultTransactionPageSize = 10;
const maxTransactionPageSize = 50;
const maxSearchTokens = 500;

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

function getTransactionRef(uid, transactionId) {
    if (transactionId) {
        return doc(getTransactionsCollectionRef(uid), transactionId);
    }

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
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("vi")
        .replace(/\u0111/g, "d")
        .trim();
}

function normalizeSearchText(value) {
    return normalizeText(value)
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getSearchTokensForValue(value) {
    const normalizedValue = normalizeSearchText(value);

    if (!normalizedValue) {
        return [];
    }

    const words = normalizedValue.split(" ").filter(Boolean);
    const tokens = new Set(words);

    words.slice(0, -1).forEach((word, index) => {
        tokens.add(`${word} ${words[index + 1]}`);
    });

    return [...tokens];
}

function getSearchQueryToken(searchTerm) {
    return normalizeSearchText(searchTerm);
}

function getTransactionSearchTokens({ input }) {
    const searchValues = [
        input.title,
        input.note,
    ];
    const searchTokens = new Set();

    searchValues.forEach((value) => {
        getSearchTokensForValue(value).forEach((token) => {
            searchTokens.add(token);
        });
    });

    return [...searchTokens].slice(0, maxSearchTokens);
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
    const time = getTransactionTime(data);

    if (!date) {
        return time;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");

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
    const walletName = data.walletSnapshot?.name ?? "";
    const fromWalletName = data.fromWalletSnapshot?.name ?? "";
    const toWalletName = data.toWalletSnapshot?.name ?? "";
    const walletIcon =
        data.walletSnapshot?.icon ??
        data.fromWalletSnapshot?.icon ??
        data.toWalletSnapshot?.icon ??
        "wallet";
    const categoryName =
        data.type === "transfer"
            ? "Chuyển khoản"
            : (data.categorySnapshot?.name ?? data.categoryId ?? "");

    return {
        id,
        type: data.type,
        amount: getSignedAmount(data),
        amountMinor: data.amountMinor,
        category: data.categoryId ?? "transfer",
        categoryId: data.categoryId,
        categoryColor: data.categorySnapshot?.color ?? "",
        walletColor: data.walletSnapshot?.color ?? "",
        categoryName: categoryName,
        currency: data.currency ?? "VND",
        icon:
            data.categorySnapshot?.icon ??
            data.fromWalletSnapshot?.icon ??
            data.walletSnapshot?.icon ??
            "transfer",
        title: data.title,
        subtitle: getTransactionSubtitle(data),
        date: data.localDate,
        time: time,
        wallet: walletIcon,
        walletId: data.walletId,
        walletName: walletName,
        fromWalletId: data.fromWalletId,
        fromWalletName: fromWalletName,
        toWalletId: data.toWalletId,
        toWalletName: toWalletName,
        note: data.note ?? "",
        status: data.status ?? "active",
    };
}

function mapTransactionSnapshot(documentSnapshot) {
    return mapTransactionData(documentSnapshot.id, documentSnapshot.data());
}

function getPageSize(pageSize) {
    const size = Number(pageSize);

    if (!Number.isSafeInteger(size) || size <= 0) {
        return defaultTransactionPageSize;
    }

    return Math.min(size, maxTransactionPageSize);
}

function isActiveFilterValue(value) {
    return value && value !== "all";
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
    return applyTransactionToMonthlyStats(monthKey, currentStats, transactionData, 1, timestamp);
}

function addMinorToMap(sourceMap = {}, key, delta) {
    if (!key) {
        return sourceMap;
    }

    const nextMap = { ...sourceMap };
    const nextValue = (nextMap[key] ?? 0) + delta;

    if (nextValue <= 0) {
        delete nextMap[key];
    } else {
        nextMap[key] = nextValue;
    }

    return nextMap;
}

function applyTransactionToMonthlyStats(
    monthKey,
    currentStats,
    transactionData,
    direction,
    timestamp,
) {
    const nextStats = {
        ...currentStats,
        monthKey,
        transactionCount: Math.max(0, currentStats.transactionCount + direction),
        updatedAt: timestamp,
    };

    if (transactionData.type === "income") {
        const delta = transactionData.amountMinor * direction;
        nextStats.incomeMinor = Math.max(0, nextStats.incomeMinor + delta);
        nextStats.categoryIncomeMinor = addMinorToMap(
            currentStats.categoryIncomeMinor,
            transactionData.categoryId,
            delta,
        );
    }

    if (transactionData.type === "expense") {
        const delta = transactionData.amountMinor * direction;
        nextStats.expenseMinor = Math.max(0, nextStats.expenseMinor + delta);
        nextStats.categoryExpenseMinor = addMinorToMap(
            currentStats.categoryExpenseMinor,
            transactionData.categoryId,
            delta,
        );
    }

    nextStats.netMinor = nextStats.incomeMinor - nextStats.expenseMinor;

    return nextStats;
}

function addWalletDelta(walletDeltas, walletId, delta) {
    if (!walletId || !delta) {
        return;
    }

    walletDeltas[walletId] = (walletDeltas[walletId] ?? 0) + delta;
}

function addTransactionWalletDeltas(walletDeltas, transactionData, direction) {
    const amountDelta = transactionData.amountMinor * direction;

    if (transactionData.type === "income") {
        addWalletDelta(walletDeltas, transactionData.walletId, amountDelta);
        return;
    }

    if (transactionData.type === "expense") {
        addWalletDelta(walletDeltas, transactionData.walletId, -amountDelta);
        return;
    }

    addWalletDelta(walletDeltas, transactionData.fromWalletId, -amountDelta);
    addWalletDelta(walletDeltas, transactionData.toWalletId, amountDelta);
}

function createTransactionDataFromInput({
    category,
    createdAt,
    input,
    timestamp,
    wallet,
    fromWallet,
    toWallet,
}) {
    if (!transactionTypes.includes(input?.type)) {
        throw new Error("Unsupported transaction type.");
    }

    const amountMinor = toPositiveInteger(input.amount ?? input.amountMinor);
    const title = input.title?.trim();
    const note = input.note?.trim() ?? "";
    const occurredAt = getOccurrence(input.date, input.time);
    const monthKey = input.date.slice(0, 7);

    if (!title) {
        throw new Error("Transaction title is required.");
    }

    if (input.type === "transfer") {
        if (input.fromWalletId === input.toWalletId) {
            throw new Error("Transfer wallets must be different.");
        }

        return {
            type: input.type,
            amountMinor,
            currency: fromWallet.currency ?? "VND",
            title,
            titleNormalized: normalizeText(title),
            searchTokens: getTransactionSearchTokens({
                input,
            }),
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
            createdAt,
            updatedAt: timestamp,
            voidedAt: null,
        };
    }

    if ((category.type ?? "expense") !== input.type) {
        throw new Error("Transaction category does not match its type.");
    }

    return {
        type: input.type,
        amountMinor,
        currency: wallet.currency ?? "VND",
        title,
        titleNormalized: normalizeText(title),
        searchTokens: getTransactionSearchTokens({
            input,
        }),
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
        createdAt,
        updatedAt: timestamp,
        voidedAt: null,
    };
}

export async function getExpenseTransactionsPage(uid, options = {}) {
    const {
        cursor = null,
        date = "",
        monthKey = "all",
        pageSize = defaultTransactionPageSize,
        searchTerm = "",
        type = "all",
        walletId = "all",
    } = options;
    const normalizedPageSize = getPageSize(pageSize);
    const searchToken = getSearchQueryToken(searchTerm);
    const queryConstraints = [
        where("status", "==", "active"),
    ];
    const hasSearchTerm = Boolean(searchToken);

    if (transactionTypes.includes(type)) {
        queryConstraints.push(where("type", "==", type));
    }

    if (isActiveFilterValue(walletId)) {
        if (hasSearchTerm) {
            queryConstraints.push(
                orFilter(
                    where("walletId", "==", walletId),
                    where("fromWalletId", "==", walletId),
                    where("toWalletId", "==", walletId),
                ),
            );
        } else {
            queryConstraints.push(where("walletIds", "array-contains", walletId));
        }
    }

    if (isActiveFilterValue(date)) {
        queryConstraints.push(where("localDate", "==", date));
    } else if (isActiveFilterValue(monthKey)) {
        queryConstraints.push(where("monthKey", "==", monthKey));
    }

    if (hasSearchTerm) {
        queryConstraints.push(where("searchTokens", "array-contains", searchToken));
    }

    queryConstraints.push(orderBy("occurredAt", "desc"));

    if (cursor) {
        queryConstraints.push(startAfter(cursor));
    }

    queryConstraints.push(limit(normalizedPageSize + 1));

    const transactionsQuery = query(getTransactionsCollectionRef(uid), ...queryConstraints);
    const snapshot = await getDocsFromServer(transactionsQuery);
    const pageDocs = snapshot.docs.slice(0, normalizedPageSize);

    return {
        cursor: pageDocs.at(-1) ?? null,
        hasNextPage: snapshot.docs.length > normalizedPageSize,
        transactions: pageDocs.map(mapTransactionSnapshot),
    };
}

export async function getExpenseTransactions(uid, maxTransactions = 50) {
    const { transactions } = await getExpenseTransactionsPage(uid, {
        pageSize: getPageSize(maxTransactions),
    });

    return transactions;
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
                amountMinor: amountMinor,
                currency: fromWallet.currency ?? "VND",
                title: title,
                titleNormalized: normalizeText(title),
                searchTokens: getTransactionSearchTokens({ input: input }),
                note: note,
                categoryId: null,
                walletId: null,
                fromWalletId: input.fromWalletId,
                toWalletId: input.toWalletId,
                walletIds: [input.fromWalletId, input.toWalletId],
                occurredAt: occurredAt,
                localDate: input.date,
                monthKey: monthKey,
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
                searchTokens: getTransactionSearchTokens({
                    input,
                }),
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

export async function updateExpenseTransaction(uid, transactionId, input) {
    if (!transactionId) {
        throw new Error("A transaction id is required.");
    }

    if (!transactionTypes.includes(input?.type)) {
        throw new Error("Unsupported transaction type.");
    }

    const transactionRef = getTransactionRef(uid, transactionId);
    const timestamp = serverTimestamp();

    return runTransaction(firestore, async (firestoreTransaction) => {
        const transactionSnapshot = await firestoreTransaction.get(transactionRef);

        if (!transactionSnapshot.exists()) {
            throw new Error("Transaction does not exist.");
        }

        const currentTransactionData = transactionSnapshot.data();

        if (currentTransactionData.status !== "active") {
            throw new Error("Only active transactions can be updated.");
        }

        let wallet;
        let category;
        let fromWallet;
        let toWallet;

        if (input.type === "transfer") {
            const fromWalletRef = getWalletRef(uid, input.fromWalletId);
            const toWalletRef = getWalletRef(uid, input.toWalletId);
            const [fromWalletSnapshot, toWalletSnapshot] = await Promise.all([
                firestoreTransaction.get(fromWalletRef),
                firestoreTransaction.get(toWalletRef),
            ]);

            fromWallet = getSnapshotData(fromWalletSnapshot, "Source wallet");
            toWallet = getSnapshotData(toWalletSnapshot, "Destination wallet");
        } else {
            const walletRef = getWalletRef(uid, input.walletId);
            const categoryRef = getCategoryRef(uid, input.categoryId);
            const [walletSnapshot, categorySnapshot] = await Promise.all([
                firestoreTransaction.get(walletRef),
                firestoreTransaction.get(categoryRef),
            ]);

            wallet = getSnapshotData(walletSnapshot, "Wallet");
            category = getSnapshotData(categorySnapshot, "Category");
        }

        const nextTransactionData = createTransactionDataFromInput({
            category,
            createdAt: currentTransactionData.createdAt,
            input,
            timestamp,
            wallet,
            fromWallet,
            toWallet,
        });
        const affectedMonthKeys = [
            ...new Set([currentTransactionData.monthKey, nextTransactionData.monthKey].filter(Boolean)),
        ];
        const monthlyStatsRefs = new Map(
            affectedMonthKeys.map((monthKey) => [monthKey, getMonthlyStatsRef(uid, monthKey)]),
        );
        const monthlyStatsSnapshots = await Promise.all(
            affectedMonthKeys.map((monthKey) => firestoreTransaction.get(monthlyStatsRefs.get(monthKey))),
        );
        const nextMonthlyStatsByMonth = new Map(
            affectedMonthKeys.map((monthKey, index) => [
                monthKey,
                getMonthlyStatsData(monthKey, monthlyStatsSnapshots[index].data()),
            ]),
        );
        const walletDeltas = {};

        nextMonthlyStatsByMonth.set(
            currentTransactionData.monthKey,
            applyTransactionToMonthlyStats(
                currentTransactionData.monthKey,
                nextMonthlyStatsByMonth.get(currentTransactionData.monthKey),
                currentTransactionData,
                -1,
                timestamp,
            ),
        );
        nextMonthlyStatsByMonth.set(
            nextTransactionData.monthKey,
            applyTransactionToMonthlyStats(
                nextTransactionData.monthKey,
                nextMonthlyStatsByMonth.get(nextTransactionData.monthKey),
                nextTransactionData,
                1,
                timestamp,
            ),
        );

        addTransactionWalletDeltas(walletDeltas, currentTransactionData, -1);
        addTransactionWalletDeltas(walletDeltas, nextTransactionData, 1);

        const affectedWalletIds = Object.keys(walletDeltas).filter((walletId) => walletDeltas[walletId] !== 0);
        const walletRefs = new Map(affectedWalletIds.map((walletId) => [walletId, getWalletRef(uid, walletId)]));
        const walletSnapshots = await Promise.all(
            affectedWalletIds.map((walletId) => firestoreTransaction.get(walletRefs.get(walletId))),
        );
        const walletBalanceUpdates = {};

        affectedWalletIds.forEach((walletId, index) => {
            const walletSnapshot = walletSnapshots[index];

            if (!walletSnapshot.exists()) {
                throw new Error("Wallet does not exist.");
            }

            walletBalanceUpdates[walletId] = (walletSnapshot.data().balance ?? 0) + walletDeltas[walletId];
        });

        firestoreTransaction.set(transactionRef, nextTransactionData, { merge: true });
        nextMonthlyStatsByMonth.forEach((nextMonthlyStats, monthKey) => {
            firestoreTransaction.set(monthlyStatsRefs.get(monthKey), nextMonthlyStats);
        });
        affectedWalletIds.forEach((walletId) => {
            firestoreTransaction.update(walletRefs.get(walletId), {
                balance: walletBalanceUpdates[walletId],
                updatedAt: timestamp,
            });
        });

        return {
            monthlyStatsUpdates: Object.fromEntries(nextMonthlyStatsByMonth),
            transaction: mapTransactionData(transactionId, nextTransactionData),
            walletBalanceUpdates,
        };
    });
}

export async function voidExpenseTransaction(uid, transactionId) {
    if (!transactionId) {
        throw new Error("A transaction id is required.");
    }

    const transactionRef = getTransactionRef(uid, transactionId);
    const timestamp = serverTimestamp();

    return runTransaction(firestore, async (firestoreTransaction) => {
        const transactionSnapshot = await firestoreTransaction.get(transactionRef);

        if (!transactionSnapshot.exists()) {
            throw new Error("Transaction does not exist.");
        }

        const transactionData = transactionSnapshot.data();

        if (transactionData.status !== "active") {
            throw new Error("Only active transactions can be deleted.");
        }

        const monthlyStatsRef = getMonthlyStatsRef(uid, transactionData.monthKey);
        const walletDeltas = {};

        addTransactionWalletDeltas(walletDeltas, transactionData, -1);

        const affectedWalletIds = Object.keys(walletDeltas).filter((walletId) => walletDeltas[walletId] !== 0);
        const walletRefs = new Map(affectedWalletIds.map((walletId) => [walletId, getWalletRef(uid, walletId)]));
        const [monthlyStatsSnapshot, ...walletSnapshots] = await Promise.all([
            firestoreTransaction.get(monthlyStatsRef),
            ...affectedWalletIds.map((walletId) => firestoreTransaction.get(walletRefs.get(walletId))),
        ]);
        const nextMonthlyStats = applyTransactionToMonthlyStats(
            transactionData.monthKey,
            getMonthlyStatsData(transactionData.monthKey, monthlyStatsSnapshot.data()),
            transactionData,
            -1,
            timestamp,
        );
        const walletBalanceUpdates = {};

        affectedWalletIds.forEach((walletId, index) => {
            const walletSnapshot = walletSnapshots[index];

            if (!walletSnapshot.exists()) {
                throw new Error("Wallet does not exist.");
            }

            walletBalanceUpdates[walletId] = (walletSnapshot.data().balance ?? 0) + walletDeltas[walletId];
        });

        firestoreTransaction.set(
            transactionRef,
            {
                status: "voided",
                updatedAt: timestamp,
                voidedAt: timestamp,
            },
            { merge: true },
        );
        firestoreTransaction.set(monthlyStatsRef, nextMonthlyStats);
        affectedWalletIds.forEach((walletId) => {
            firestoreTransaction.update(walletRefs.get(walletId), {
                balance: walletBalanceUpdates[walletId],
                updatedAt: timestamp,
            });
        });

        return {
            monthlyStatsUpdates: {
                [transactionData.monthKey]: nextMonthlyStats,
            },
            transactionId,
            walletBalanceUpdates,
        };
    });
}
