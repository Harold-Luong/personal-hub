import {
    collection,
    doc,
    getDocsFromServer,
    serverTimestamp,
    writeBatch,
} from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";

const walletTypes = ['cash', 'bank', 'eWallet', 'card', 'saving', 'other']
const walletCurrencies = ['VND', 'USD']
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

export async function getExpenseWallets(uid) {
    const snapshot = await getDocsFromServer(getWalletsCollectionRef(uid));

    return snapshot.docs
        .map(mapWallet)
        .filter((wallet) => !wallet.isArchived)
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

    if (!existingWallet) {
        throw new Error('Wallet not found.')
    }

    const wallet = {
        ...normalizeWalletInput(input, { existingWallet, includeBalance: false }),
        isDefault: existingWallet.isDefault || Boolean(input?.isDefault),
    }
    const timestamp = serverTimestamp()
    const batch = writeBatch(firestore)

    if (wallet.isDefault) {
        activeWallets.forEach((activeWallet) => {
            if (activeWallet.id !== walletId && activeWallet.isDefault) {
                batch.update(getWalletRef(uid, activeWallet.id), {
                    isDefault: false,
                    updatedAt: timestamp,
                })
            }
        })
    }

    batch.update(getWalletRef(uid, walletId), {
        ...wallet,
        updatedAt: timestamp,
    })

    await batch.commit()

    return {
        ...existingWallet,
        ...wallet,
        id: walletId,
        isArchived: false,
    }
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

    const replacementWallet = wallet.isDefault
        ? activeWallets.find((activeWallet) => activeWallet.id !== walletId)
        : null
    const timestamp = serverTimestamp()
    const batch = writeBatch(firestore)

    batch.update(getWalletRef(uid, walletId), {
        isArchived: true,
        isDefault: false,
        updatedAt: timestamp,
    })

    if (replacementWallet) {
        batch.update(getWalletRef(uid, replacementWallet.id), {
            isDefault: true,
            updatedAt: timestamp,
        })
    }

    await batch.commit()

    return {
        id: walletId,
        replacementDefaultWalletId: replacementWallet?.id ?? null,
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
