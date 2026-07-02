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
    writeBatch,
} from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";

const walletTypes = ['cash', 'bank', 'eWallet', 'card', 'saving', 'other']
const walletCurrencies = ['VND', 'USD']
const maxSearchTokens = 500
const walletTypeMeta = {
    bank: { color: '#4f93d7', icon: 'bank' },
    card: { color: '#9b7bd8', icon: 'card' },
    cash: { color: '#56b879', icon: 'wallet' },
    eWallet: { color: '#d77fa1', icon: 'momo' },
    other: { color: '#b8bec8', icon: 'more' },
    saving: { color: '#d9a441', icon: 'saving' },
}

function getWalletsCollectionRef(uid) {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    return collection(
        firestore,
        "users",
        uid,
        "modules",
        "expenses",
        "wallets",
    );
}

function getWalletRef(uid, walletId) {
    if (!walletId) {
        throw new Error('A wallet id is required.')
    }

    return doc(getWalletsCollectionRef(uid), walletId)
}

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
    )
}

async function hasActiveWalletTransactions(uid, walletId) {
    const transactionsQuery = query(
        getTransactionsCollectionRef(uid),
        where("walletIds", "array-contains", walletId),
        where("status", "==", "active"),
        orderBy("occurredAt", "desc"),
        limit(1),
    )
    const snapshot = await getDocsFromServer(transactionsQuery)

    return !snapshot.empty
}

function sortWallets(firstWallet, secondWallet) {
    if (firstWallet.isDefault !== secondWallet.isDefault) {
        return firstWallet.isDefault ? -1 : 1;
    }

    return (
        (firstWallet.order ?? Number.MAX_SAFE_INTEGER) -
        (secondWallet.order ?? Number.MAX_SAFE_INTEGER)
    );
}

function mapWallet(documentSnapshot) {
    const data = documentSnapshot.data();

    return {
        id: documentSnapshot.id,
        name: data.name,
        type: data.type,
        icon: data.icon ?? "wallet",
        color: data.color ?? "#56b879",
        balance: data.balance ?? data.currentBalance ?? 0,
        initialBalance: data.initialBalance ?? 0,
        currency: data.currency ?? "VND",
        order: data.order ?? data.sortOrder ?? Number.MAX_SAFE_INTEGER,
        isDefault: data.isDefault ?? false,
        isArchived: data.isArchived ?? false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}

function normalizeText(value, label) {
    const text = String(value ?? '').trim()

    if (!text) {
        throw new Error(`${label} is required.`)
    }

    return text
}

function normalizeInteger(value, label) {
    const numberValue = Math.round(Number(value ?? 0))

    if (!Number.isSafeInteger(numberValue)) {
        throw new Error(`${label} must be a safe integer.`)
    }

    return numberValue
}

function normalizeWalletType(value) {
    const type = String(value ?? 'cash').trim()

    if (!walletTypes.includes(type)) {
        throw new Error(`Unsupported wallet type: ${type}.`)
    }

    return type
}

function normalizeCurrency(value) {
    const currency = String(value ?? 'VND').trim().toUpperCase()

    if (!walletCurrencies.includes(currency)) {
        throw new Error(`Unsupported wallet currency: ${currency}.`)
    }

    return currency
}

function normalizeColor(value, fallback) {
    const color = String(value ?? fallback).trim()

    if (!/^#[0-9a-f]{6}$/i.test(color)) {
        throw new Error('Wallet color must be a hex color.')
    }

    return color
}

function normalizeSearchText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("vi")
        .replace(/\u0111/g, "d")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function getSearchTokensForValue(value) {
    const normalizedValue = normalizeSearchText(value)

    if (!normalizedValue) {
        return []
    }

    const words = normalizedValue.split(" ").filter(Boolean)
    const tokens = new Set(words)

    words.slice(0, -1).forEach((word, index) => {
        tokens.add(`${word} ${words[index + 1]}`)
    })

    return [...tokens]
}

function getTransactionSearchTokens({ title, note }) {
    const searchTokens = new Set()
    const searchValues = [title, note]

    searchValues.forEach((value) => {
        getSearchTokensForValue(value).forEach((token) => {
            searchTokens.add(token)
        })
    })

    return [...searchTokens].slice(0, maxSearchTokens)
}

function getLocalDateTimeParts(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return {
        localDate: `${year}-${month}-${day}`,
        monthKey: `${year}-${month}`,
        time: `${hours}:${minutes}`,
    }
}

function getTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok"
}

function getWalletSnapshot(wallet) {
    return {
        name: wallet.name,
        icon: wallet.icon ?? "wallet",
        color: wallet.color ?? "#56b879",
    }
}

function mapAdjustmentTransaction(id, data) {
    const occurredAt = data.occurredAt?.toDate?.()
    const time = occurredAt
        ? `${String(occurredAt.getHours()).padStart(2, "0")}:${String(occurredAt.getMinutes()).padStart(2, "0")}`
        : ""

    return {
        id,
        adjustmentDirection: data.adjustmentDirection,
        amount: data.adjustmentDirection === "increase" ? data.amountMinor : -data.amountMinor,
        amountMinor: data.amountMinor,
        category: "adjustment",
        categoryColor: data.walletSnapshot?.color ?? "",
        categoryId: null,
        categoryName: "Điều chỉnh số dư",
        currency: data.currency ?? "VND",
        date: data.localDate,
        fromWalletId: null,
        fromWalletName: "",
        icon: data.walletSnapshot?.icon ?? "wallet",
        note: data.note ?? "",
        status: data.status ?? "active",
        subtitle: time,
        time,
        title: data.title,
        toWalletId: null,
        toWalletName: "",
        type: data.type,
        wallet: data.walletSnapshot?.icon ?? "wallet",
        walletColor: data.walletSnapshot?.color ?? "",
        walletId: data.walletId,
        walletName: data.walletSnapshot?.name ?? "",
    }
}

function createBalanceAdjustmentTransactionData({ balanceDelta, currentBalance, targetBalance, timestamp, wallet, walletId }) {
    const now = new Date()
    const { localDate, monthKey } = getLocalDateTimeParts(now)
    const adjustmentDirection = balanceDelta > 0 ? "increase" : "decrease"
    const title = adjustmentDirection === "increase" ? "Điều chỉnh tăng số dư" : "Điều chỉnh giảm số dư"
    const note = `Cập nhật số dư ví từ ${currentBalance} thành ${targetBalance}.`

    return {
        adjustmentDirection,
        amountMinor: Math.abs(balanceDelta),
        categoryId: null,
        categorySnapshot: null,
        createdAt: timestamp,
        currency: wallet.currency ?? "VND",
        fromWalletId: null,
        fromWalletSnapshot: null,
        localDate,
        monthKey,
        note,
        occurredAt: Timestamp.fromDate(now),
        searchTokens: getTransactionSearchTokens({ title, note }),
        status: "active",
        timezone: getTimezone(),
        title,
        titleNormalized: normalizeSearchText(title),
        toWalletId: null,
        toWalletSnapshot: null,
        type: "adjustment",
        updatedAt: timestamp,
        voidedAt: null,
        walletId,
        walletIds: [walletId],
        walletSnapshot: getWalletSnapshot(wallet),
    }
}

function getNextWalletOrder(wallets) {
    const maxOrder = wallets.reduce((result, wallet) => {
        const order = Number(wallet.order)

        return Number.isFinite(order) ? Math.max(result, order) : result
    }, 0)

    return maxOrder + 10
}

function normalizeWalletInput(input = {}, { existingWallet, includeBalance = true, order } = {}) {
    const type = normalizeWalletType(input.type ?? existingWallet?.type)
    const typeMeta = walletTypeMeta[type] ?? walletTypeMeta.other
    const wallet = {
        color: normalizeColor(input.color ?? existingWallet?.color, typeMeta.color),
        currency: normalizeCurrency(input.currency ?? existingWallet?.currency),
        icon: normalizeText(input.icon ?? existingWallet?.icon ?? typeMeta.icon, 'Wallet icon'),
        isDefault: Boolean(input.isDefault ?? existingWallet?.isDefault ?? false),
        name: normalizeText(input.name ?? existingWallet?.name, 'Wallet name'),
        order: normalizeInteger(input.order ?? existingWallet?.order ?? order, 'Wallet order'),
        type,
    }

    if (includeBalance) {
        const balance = normalizeInteger(
            input.balance ?? input.currentBalance ?? existingWallet?.balance ?? 0,
            'Wallet balance',
        )

        wallet.balance = balance
        wallet.initialBalance = normalizeInteger(
            input.initialBalance ?? existingWallet?.initialBalance ?? balance,
            'Initial wallet balance',
        )
    }

    return wallet
}

export async function getExpenseWallets(uid, { includeArchived = false } = {}) {
    const snapshot = await getDocsFromServer(getWalletsCollectionRef(uid));

    return snapshot.docs
        .map(mapWallet)
        .filter((wallet) => includeArchived || !wallet.isArchived)
        .sort(sortWallets);
}

export async function createExpenseWallet(uid, input) {
    const activeWallets = await getExpenseWallets(uid)
    const walletRef = doc(getWalletsCollectionRef(uid))
    const wallet = normalizeWalletInput(input, {
        order: getNextWalletOrder(activeWallets),
    })
    const shouldBeDefault = wallet.isDefault || activeWallets.length === 0
    const timestamp = serverTimestamp()
    const batch = writeBatch(firestore)

    if (shouldBeDefault) {
        activeWallets.forEach((activeWallet) => {
            batch.update(getWalletRef(uid, activeWallet.id), {
                isDefault: false,
                updatedAt: timestamp,
            })
        })
    }

    batch.set(walletRef, {
        ...wallet,
        isDefault: shouldBeDefault,
        isArchived: false,
        createdAt: timestamp,
        updatedAt: timestamp,
    })

    await batch.commit()

    return {
        id: walletRef.id,
        isArchived: false,
        ...wallet,
        isDefault: shouldBeDefault,
    }
}

export async function updateExpenseWallet(uid, input) {
    const walletId = input?.id
    const activeWallets = await getExpenseWallets(uid)
    const existingWallet = activeWallets.find((wallet) => wallet.id === walletId)
    const hasTargetBalance = input?.balance != null || input?.currentBalance != null

    if (!existingWallet) {
        throw new Error('Wallet not found.')
    }

    const wallet = {
        ...normalizeWalletInput(input, { existingWallet, includeBalance: false }),
        isDefault: existingWallet.isDefault || Boolean(input?.isDefault),
    }
    const targetBalance = hasTargetBalance
        ? normalizeInteger(input.balance ?? input.currentBalance, 'Target wallet balance')
        : null
    const shouldCreateAdjustment = hasTargetBalance
        ? await hasActiveWalletTransactions(uid, walletId)
        : false
    const timestamp = serverTimestamp()
    const walletRef = getWalletRef(uid, walletId)

    return runTransaction(firestore, async (firestoreTransaction) => {
        const walletSnapshot = await firestoreTransaction.get(walletRef)

        if (!walletSnapshot.exists()) {
            throw new Error('Wallet not found.')
        }

        const currentWalletData = walletSnapshot.data()

        if (currentWalletData.isArchived) {
            throw new Error('Wallet is archived.')
        }

        const currentBalance = currentWalletData.balance ?? 0
        const balanceDelta = hasTargetBalance ? targetBalance - currentBalance : 0
        const walletUpdate = {
            ...wallet,
            updatedAt: timestamp,
        }
        let adjustmentTransaction = null

        if (balanceDelta !== 0 && shouldCreateAdjustment) {
            const transactionRef = doc(getTransactionsCollectionRef(uid))
            const transactionData = createBalanceAdjustmentTransactionData({
                balanceDelta,
                currentBalance,
                targetBalance,
                timestamp,
                wallet: {
                    ...currentWalletData,
                    ...wallet,
                },
                walletId,
            })

            walletUpdate.balance = targetBalance
            firestoreTransaction.set(transactionRef, transactionData)
            adjustmentTransaction = mapAdjustmentTransaction(transactionRef.id, transactionData)
        } else if (balanceDelta !== 0) {
            walletUpdate.balance = targetBalance
            walletUpdate.initialBalance = targetBalance
        }

        if (wallet.isDefault) {
            activeWallets.forEach((activeWallet) => {
                if (activeWallet.id !== walletId && activeWallet.isDefault) {
                    firestoreTransaction.update(getWalletRef(uid, activeWallet.id), {
                        isDefault: false,
                        updatedAt: timestamp,
                    })
                }
            })
        }

        firestoreTransaction.update(walletRef, walletUpdate)

        const nextWallet = {
            ...existingWallet,
            ...wallet,
            balance: balanceDelta !== 0 ? targetBalance : currentBalance,
            initialBalance:
                balanceDelta !== 0 && !shouldCreateAdjustment
                    ? targetBalance
                    : (currentWalletData.initialBalance ?? existingWallet.initialBalance ?? 0),
            id: walletId,
            isArchived: false,
        }

        return {
            adjustmentTransaction,
            wallet: nextWallet,
            walletBalanceUpdates: balanceDelta !== 0 ? { [walletId]: targetBalance } : {},
        }
    })
}

export async function upsertExpenseWallet(uid, input) {
    if (input?.id) {
        return updateExpenseWallet(uid, input)
    }

    return createExpenseWallet(uid, input)
}

export async function deleteExpenseWallet(uid, input) {
    const walletId = input?.id
    const activeWallets = await getExpenseWallets(uid)
    const wallet = activeWallets.find((activeWallet) => activeWallet.id === walletId)

    if (!wallet) {
        throw new Error('Wallet not found.')
    }

    if (activeWallets.length <= 1) {
        throw new Error('At least one active wallet is required.')
    }

    if (wallet.isDefault) {
        throw new Error('Choose another default wallet before archiving this wallet.')
    }

    if ((wallet.balance ?? 0) !== 0) {
        throw new Error('Wallet balance must be zero before archiving.')
    }

    const timestamp = serverTimestamp()
    const batch = writeBatch(firestore)

    batch.update(getWalletRef(uid, walletId), {
        isArchived: true,
        isDefault: false,
        updatedAt: timestamp,
    })

    await batch.commit()

    return {
        id: walletId,
    }
}

export async function setDefaultExpenseWallet(uid, walletId) {
    const activeWallets = await getExpenseWallets(uid)

    if (!activeWallets.some((wallet) => wallet.id === walletId)) {
        throw new Error('Wallet not found.')
    }

    const timestamp = serverTimestamp()
    const batch = writeBatch(firestore)

    activeWallets.forEach((wallet) => {
        batch.update(getWalletRef(uid, wallet.id), {
            isDefault: wallet.id === walletId,
            updatedAt: timestamp,
        })
    })

    await batch.commit()

    return { id: walletId }
}
