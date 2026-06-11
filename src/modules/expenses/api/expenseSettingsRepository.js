import {
    doc,
    getDocFromServer,
    runTransaction,
    serverTimestamp,
    updateDoc,
} from 'firebase/firestore'
import { firestore } from '../../../lib/firebase/firestore'

const expenseThemes = ['sage', 'fjord', 'clay', 'blossom', 'vintage', 'retro']
const expenseCurrencies = ['VND', 'USD']

const defaultExpenseSettings = {
    theme: 'sage',
    currency: 'VND',
    timezone: 'Asia/Bangkok',
    hideBalance: false,
    notificationsEnabled: true,
    defaultWalletId: null,
}

function validateExpenseSetting(key, value) {
    if (key === 'theme' && !expenseThemes.includes(value)) {
        throw new Error(`Unsupported expense theme: ${value}.`)
    }

    if (key === 'currency' && !expenseCurrencies.includes(value)) {
        throw new Error(`Unsupported expense currency: ${value}.`)
    }

    if (
        (key === 'hideBalance' || key === 'notificationsEnabled')
        && typeof value !== 'boolean'
    ) {
        throw new Error(`${key} must be a boolean.`)
    }

    if (
        key === 'timezone'
        && (typeof value !== 'string' || value.trim().length === 0)
    ) {
        throw new Error('timezone must be a non-empty string.')
    }

    if (
        key === 'defaultWalletId'
        && value !== null
        && (typeof value !== 'string' || value.trim().length === 0)
    ) {
        throw new Error('defaultWalletId must be a non-empty string or null.')
    }
}

function validateExpenseSettings(settings, { allowEmpty = false } = {}) {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
        throw new Error('Expense settings must be an object.')
    }

    const entries = Object.entries(settings)

    if (!allowEmpty && entries.length === 0) {
        throw new Error('At least one expense setting is required.')
    }

    for (const [key, value] of entries) {
        if (!Object.hasOwn(defaultExpenseSettings, key)) {
            throw new Error(`Unsupported expense setting: ${key}.`)
        }

        validateExpenseSetting(key, value)
    }

    return Object.fromEntries(entries)
}

function getExpenseSettingsRef(uid) {
    if (!uid) {
        throw new Error('A Firebase Authentication uid is required.')
    }

    return doc(firestore, 'users', uid, 'settings', 'expenses')
}

export async function getExpenseSettings(uid) {
    const snapshot = await getDocFromServer(getExpenseSettingsRef(uid))

    if (!snapshot.exists()) {
        return null
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
    }
}

export async function createExpenseSettings(uid, settings = {}) {
    const settingsRef = getExpenseSettingsRef(uid)
    const validatedSettings = validateExpenseSettings(settings, {
        allowEmpty: true,
    })

    await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(settingsRef)

        if (snapshot.exists()) {
            throw new Error(`Expense settings already exist for user ${uid}.`)
        }

        transaction.set(settingsRef, {
            ...defaultExpenseSettings,
            ...validatedSettings,
            updatedAt: serverTimestamp(),
        })
    })

    return getExpenseSettings(uid)
}

export async function ensureExpenseSettings(uid, settings = {}) {
    const settingsRef = getExpenseSettingsRef(uid)
    const validatedSettings = validateExpenseSettings(settings, {
        allowEmpty: true,
    })

    await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(settingsRef)

        if (snapshot.exists()) {
            return
        }

        transaction.set(settingsRef, {
            ...defaultExpenseSettings,
            ...validatedSettings,
            updatedAt: serverTimestamp(),
        })
    })

    return getExpenseSettings(uid)
}

export async function updateExpenseSettings(uid, settings) {
    const validatedSettings = validateExpenseSettings(settings)

    await updateDoc(getExpenseSettingsRef(uid), {
        ...validatedSettings,
        updatedAt: serverTimestamp(),
    })
}

export async function updateExpenseTheme(uid, theme) {
    return updateExpenseSettings(uid, { theme })
}
