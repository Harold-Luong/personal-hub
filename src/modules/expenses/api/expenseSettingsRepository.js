import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '../../../lib/firebase/firestore'

const defaultExpenseSettings = {
    theme: 'sage',
    currency: 'VND',
    timezone: 'Asia/Bangkok',
    hideBalance: false,
    notificationsEnabled: true,
    defaultWalletId: null,
}

function getExpenseSettingsRef(uid) {
    if (!uid) {
        throw new Error('A Firebase Authentication uid is required.')
    }

    return doc(firestore, 'users', uid, 'settings', 'expenses')
}

export async function getExpenseSettings(uid) {
    const snapshot = await getDoc(getExpenseSettingsRef(uid))

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

    await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(settingsRef)

        if (snapshot.exists()) {
            throw new Error(`Expense settings already exist for user ${uid}.`)
        }

        transaction.set(settingsRef, {
            ...defaultExpenseSettings,
            ...settings,
            updatedAt: serverTimestamp(),
        })
    })

    return getExpenseSettings(uid)
}
