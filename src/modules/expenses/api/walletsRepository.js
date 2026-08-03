import {
    Timestamp,
    deleteField,
    doc,
    getDocFromServer,
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
import { expenseCollections } from "./expenseFirestoreSchema";
import { getCollectionReference, getDocumentReference } from "./getReference";
import {
    creditCardWalletTypeId,
    expenseCurrencyLabels,
    expenseDefaultCurrency,
    expenseDefaultTimezone,
    expenseDefaultWalletTypeId,
    expenseDefaultWalletTypeMeta,
    expenseMaxSearchTokens,
    savingWalletTypeId,
    transactionTypes,
    walletTypeIds,
    walletTypeMeta,
} from "../constants/expenseMetadata";
import { isCreditCardWallet, normalizeWalletName } from "../utils/walletUtils";

async function hasActiveWalletTransactions(uid, walletId) {
    const transactionsQuery = query(
        getCollectionReference(uid, expenseCollections.TRANSACTIONS),
        where("walletIds", "array-contains", walletId),
        where("status", "==", "active"),
        orderBy("occurredAt", "desc"),
        limit(1),
    )
    const snapshot = await getDocsFromServer(transactionsQuery)

    return !snapshot.empty
}

function getCreditCardProjection(creditLimit, outstandingDebt = 0) {
    return {
        availableCredit: Math.max(creditLimit - outstandingDebt, 0),
        balance: 0,
        creditLimit,
        initialBalance: 0,
        outstandingDebt,
    }
}

function sortWallets(firstWallet, secondWallet) {
    const orderComparison = (
        (firstWallet.order ?? Number.MAX_SAFE_INTEGER) -
        (secondWallet.order ?? Number.MAX_SAFE_INTEGER)
    );

    if (orderComparison !== 0) {
        return orderComparison;
    }

    return 0;
}

function mapWallet(documentSnapshot) {
    const data = documentSnapshot.data();
    const creditLimit = data.creditLimit ?? 0;
    const outstandingDebt = data.outstandingDebt ?? 0;

    return {
        id: documentSnapshot.id,
        name: data.name,
        type: data.type,
        icon: data.icon ?? expenseDefaultWalletTypeMeta.icon,
        color: data.color ?? expenseDefaultWalletTypeMeta.color,
        balance: data.balance ?? data.currentBalance ?? 0,
        initialBalance: data.initialBalance ?? 0,
        creditLimit,
        outstandingDebt,
        availableCredit: data.availableCredit ?? Math.max(creditLimit - outstandingDebt, 0),
        currency: data.currency ?? expenseDefaultCurrency,
        order: data.order ?? data.sortOrder ?? Number.MAX_SAFE_INTEGER,
        isBalanceInitialized: data.isBalanceInitialized ?? true,
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

function assertUniqueWalletName(activeWallets, wallet, excludedWalletId) {
    const normalizedName = normalizeWalletName(wallet.name)
    const duplicateWallet = activeWallets.find(
        (activeWallet) =>
            activeWallet.id !== excludedWalletId &&
            normalizeWalletName(activeWallet.name) === normalizedName,
    )

    if (duplicateWallet) {
        throw new Error(`Tên ví "${wallet.name}" đã tồn tại. Vui lòng chọn tên khác.`)
    }
}

function normalizeInteger(value, label) {
    const numberValue = Math.round(Number(value ?? 0))

    if (!Number.isSafeInteger(numberValue)) {
        throw new Error(`${label} must be a safe integer.`)
    }

    return numberValue
}

function normalizeNonNegativeInteger(value, label) {
    const numberValue = normalizeInteger(value, label)

    if (numberValue < 0) {
        throw new Error(`${label} must be greater than or equal to zero.`)
    }

    return numberValue
}

function normalizePositiveInteger(value, label) {
    const numberValue = normalizeInteger(value, label)

    if (numberValue <= 0) {
        throw new Error(`${label} must be greater than zero.`)
    }

    return numberValue
}

function normalizeWalletType(value) {
    const type = String(value ?? expenseDefaultWalletTypeId).trim()

    if (!walletTypeIds.includes(type)) {
        throw new Error(`Unsupported wallet type: ${type}.`)
    }

    return type
}

function normalizeCurrency(value) {
    const currency = String(value ?? expenseDefaultCurrency).trim().toUpperCase()

    if (!expenseCurrencyLabels.includes(currency)) {
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

    return [...searchTokens].slice(0, expenseMaxSearchTokens)
}

function getTransactionWalletDelta(transaction, walletId) {
    const amountMinor = transaction.amountMinor ?? 0

    if (transaction.status !== "active") {
        return 0
    }

    if (transaction.type === transactionTypes.INCOME && transaction.walletId === walletId) {
        return amountMinor
    }

    if (transaction.type === transactionTypes.EXPENSE && transaction.walletId === walletId) {
        return -amountMinor
    }

    if (transaction.type === transactionTypes.ADJUSTMENT && transaction.walletId === walletId) {
        return transaction.adjustmentDirection === "increase" ? amountMinor : -amountMinor
    }

    if (
        transaction.type === transactionTypes.TRANSFER ||
        transaction.type === transactionTypes.CREDIT_PAYMENT
    ) {
        if (transaction.fromWalletId === walletId) {
            return -amountMinor
        }

        if (transaction.toWalletId === walletId) {
            return amountMinor
        }
    }

    return 0
}

async function getActiveWalletNetMovement(uid, walletId) {
    const transactionsQuery = query(
        getCollectionReference(uid, expenseCollections.TRANSACTIONS),
        where("walletIds", "array-contains", walletId),
        where("status", "==", "active"),
        orderBy("occurredAt", "desc"),
    )
    const snapshot = await getDocsFromServer(transactionsQuery)

    return snapshot.docs.reduce(
        (total, transactionSnapshot) => total + getTransactionWalletDelta(transactionSnapshot.data(), walletId),
        0,
    )
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
    return Intl.DateTimeFormat().resolvedOptions().timeZone || expenseDefaultTimezone
}

function getWalletSnapshot(wallet) {
    return {
        name: wallet.name,
        icon: wallet.icon ?? expenseDefaultWalletTypeMeta.icon,
        color: wallet.color ?? expenseDefaultWalletTypeMeta.color,
        type: wallet.type,
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
        currency: data.currency ?? expenseDefaultCurrency,
        date: data.localDate,
        fromWalletId: null,
        fromWalletName: "",
        icon: data.walletSnapshot?.icon ?? expenseDefaultWalletTypeMeta.icon,
        note: data.note ?? "",
        status: data.status ?? "active",
        subtitle: time,
        time,
        title: data.title,
        toWalletId: null,
        toWalletName: "",
        type: data.type,
        wallet: data.walletSnapshot?.icon ?? expenseDefaultWalletTypeMeta.icon,
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
        currency: wallet.currency ?? expenseDefaultCurrency,
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
        type: transactionTypes.ADJUSTMENT,
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
        isBalanceInitialized: Boolean(input.isBalanceInitialized ?? existingWallet?.isBalanceInitialized ?? true),
        name: normalizeText(input.name ?? existingWallet?.name, 'Wallet name'),
        order: normalizeInteger(input.order ?? existingWallet?.order ?? order, 'Wallet order'),
        type,
    }

    if (type === creditCardWalletTypeId) {
        const creditLimit = normalizePositiveInteger(
            input.creditLimit ?? existingWallet?.creditLimit,
            'Credit limit',
        )
        const outstandingDebt = normalizeNonNegativeInteger(
            existingWallet?.outstandingDebt ?? input.outstandingDebt ?? 0,
            'Outstanding debt',
        )

        if (outstandingDebt > creditLimit) {
            throw new Error('Outstanding debt cannot exceed credit limit.')
        }

        return {
            ...wallet,
            ...getCreditCardProjection(creditLimit, outstandingDebt),
        }
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

function assertWalletTypeChangeAllowed(existingWallet, wallet) {
    const isCreditCardBoundaryChange = isCreditCardWallet(existingWallet) !== isCreditCardWallet(wallet)
    const isSavingsBoundaryChange = (existingWallet.type === savingWalletTypeId) !== (wallet.type === savingWalletTypeId)

    if (isCreditCardBoundaryChange || isSavingsBoundaryChange) {
        throw new Error('Không thể đổi qua lại giữa ví chi tiêu, ví Tiết kiệm và thẻ tín dụng. Vui lòng tạo ví mới.')
    }
}

export async function getExpenseWallets(uid, { includeArchived = false } = {}) {
    const snapshot = await getDocsFromServer(
        getCollectionReference(uid, expenseCollections.WALLETS),
    );

    return snapshot.docs
        .map(mapWallet)
        .filter((wallet) => includeArchived || !wallet.isArchived)
        .sort(sortWallets);
}

export async function createExpenseWallet(uid, input) {
    const activeWallets = await getExpenseWallets(uid)
    const walletRef = doc(getCollectionReference(uid, expenseCollections.WALLETS))
    const wallet = normalizeWalletInput(input, {
        order: getNextWalletOrder(activeWallets),
    })

    if (activeWallets.length === 0 && !isCreditCardWallet(wallet) && wallet.balance <= 0) {
        throw new Error('Số dư ban đầu phải lớn hơn 0.')
    }

    assertUniqueWalletName(activeWallets, wallet)

    const timestamp = serverTimestamp()
    const batch = writeBatch(firestore)

    batch.set(walletRef, {
        ...wallet,
        isArchived: false,
        createdAt: timestamp,
        updatedAt: timestamp,
    })

    await batch.commit()

    return {
        id: walletRef.id,
        isArchived: false,
        ...wallet,
    }
}

export async function updateExpenseWallet(uid, input) {
    const walletId = input?.id
    const activeWallets = await getExpenseWallets(uid)
    const existingWallet = activeWallets.find((wallet) => wallet.id === walletId)
    const hasTargetBalance = input?.balance != null || input?.currentBalance != null
    const hasInitialBalance = input?.initialBalance != null

    if (!existingWallet) {
        throw new Error('Wallet not found.')
    }

    if (
        existingWallet.type === savingWalletTypeId
        && existingWallet.isBalanceInitialized
        && hasTargetBalance
    ) {
        throw new Error('Số dư ví Tiết kiệm chỉ có thể thay đổi qua luồng Nạp hoặc Rút tiền tiết kiệm.')
    }

    const wallet = {
        ...normalizeWalletInput(input, { existingWallet, includeBalance: false }),
    }
    assertWalletTypeChangeAllowed(existingWallet, wallet)
    assertUniqueWalletName(activeWallets, wallet, walletId)

    const isRegularWallet = !isCreditCardWallet(wallet)
    const shouldSetInitialBalance = hasInitialBalance && isRegularWallet && !existingWallet.isBalanceInitialized

    if (hasInitialBalance && !shouldSetInitialBalance) {
        throw new Error('Initial wallet balance can only be set during initial setup.')
    }

    const shouldApplyBalanceChange = (hasTargetBalance || shouldSetInitialBalance) && isRegularWallet
    const shouldRecalculateOpeningBalance = shouldApplyBalanceChange && !existingWallet.isBalanceInitialized && !shouldSetInitialBalance
    const initialBalance = shouldSetInitialBalance
        ? normalizePositiveInteger(input.initialBalance, 'Initial wallet balance')
        : null
    const targetBalance = shouldApplyBalanceChange
        ? shouldSetInitialBalance
            ? initialBalance + (await getActiveWalletNetMovement(uid, walletId))
            : normalizeInteger(input.balance ?? input.currentBalance, 'Target wallet balance')
        : null
    const netMovement = shouldRecalculateOpeningBalance
        ? await getActiveWalletNetMovement(uid, walletId)
        : 0
    const shouldCreateAdjustment = shouldApplyBalanceChange && !shouldRecalculateOpeningBalance
        ? await hasActiveWalletTransactions(uid, walletId)
        : false
    const timestamp = serverTimestamp()
    const walletRef = getDocumentReference(uid, expenseCollections.WALLETS, walletId)

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
        const balanceDelta = shouldApplyBalanceChange ? targetBalance - currentBalance : 0
        const walletUpdate = {
            ...wallet,
            isDefault: deleteField(),
            updatedAt: timestamp,
        }
        let adjustmentTransaction = null

        if (shouldSetInitialBalance) {
            walletUpdate.balance = targetBalance
            walletUpdate.initialBalance = initialBalance
            walletUpdate.isBalanceInitialized = true
        } else if (shouldRecalculateOpeningBalance) {
            walletUpdate.balance = targetBalance
            walletUpdate.initialBalance = targetBalance - netMovement
            walletUpdate.isBalanceInitialized = true
        } else if (balanceDelta !== 0 && shouldCreateAdjustment) {
            const transactionRef = doc(
                getCollectionReference(uid, expenseCollections.TRANSACTIONS),
            )
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
            walletUpdate.isBalanceInitialized = true
        }

        firestoreTransaction.update(walletRef, walletUpdate)

        const nextWallet = {
            ...existingWallet,
            ...wallet,
            balance: shouldSetInitialBalance || shouldRecalculateOpeningBalance || balanceDelta !== 0 ? targetBalance : currentBalance,
            initialBalance:
                shouldSetInitialBalance
                    ? initialBalance
                    : shouldRecalculateOpeningBalance
                    ? targetBalance - netMovement
                    : (
                balanceDelta !== 0 && !shouldCreateAdjustment
                    ? targetBalance
                    : (currentWalletData.initialBalance ?? existingWallet.initialBalance ?? 0)
                    ),
            id: walletId,
            isBalanceInitialized:
                shouldSetInitialBalance || shouldRecalculateOpeningBalance || (balanceDelta !== 0 && !shouldCreateAdjustment)
                    ? true
                    : (currentWalletData.isBalanceInitialized ?? existingWallet.isBalanceInitialized ?? true),
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

    const settingsSnapshot = await getDocFromServer(
        getDocumentReference(uid, expenseCollections.SETTINGS, "main"),
    )

    if (settingsSnapshot.data()?.defaultWalletId === walletId) {
        throw new Error('Choose another default wallet before archiving this wallet.')
    }

    if (isCreditCardWallet(wallet) && (wallet.outstandingDebt ?? 0) !== 0) {
        throw new Error('Credit card debt must be zero before archiving.')
    }

    if (!isCreditCardWallet(wallet) && (wallet.balance ?? 0) !== 0) {
        throw new Error('Wallet balance must be zero before archiving.')
    }

    const timestamp = serverTimestamp()
    const batch = writeBatch(firestore)

    batch.update(getDocumentReference(uid, expenseCollections.WALLETS, walletId), {
        isArchived: true,
        isDefault: deleteField(),
        updatedAt: timestamp,
    })

    await batch.commit()

    return {
        id: walletId,
    }
}

export async function reorderExpenseWallets(uid, walletIds = []) {
    const activeWallets = await getExpenseWallets(uid)
    const activeWalletIds = new Set(activeWallets.map((wallet) => wallet.id))
    const orderedWalletIds = [...new Set(walletIds)].filter((walletId) => activeWalletIds.has(walletId))

    if (orderedWalletIds.length !== activeWallets.length) {
        throw new Error('Wallet order must include every active wallet.')
    }

    const timestamp = serverTimestamp()
    const batch = writeBatch(firestore)

    orderedWalletIds.forEach((walletId, index) => {
        batch.update(getDocumentReference(uid, expenseCollections.WALLETS, walletId), {
            order: (index + 1) * 10,
            updatedAt: timestamp,
        })
    })

    await batch.commit()
    return orderedWalletIds
}
