import {
    collection,
    deleteDoc,
    doc,
    getDocsFromServer,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    where,
} from 'firebase/firestore'
import { firestore } from '../../../lib/firebase/firestore'

function getBudgetsCollectionRef(uid) {
    if (!uid) {
        throw new Error('A Firebase Authentication uid is required.')
    }

    return collection(
        firestore,
        'users',
        uid,
        'modules',
        'expenses',
        'budgets',
    )
}

function mapBudget(documentSnapshot) {
    const data = documentSnapshot.data()

    return {
        id: documentSnapshot.id,
        monthKey: data.monthKey,
        categoryId: data.categoryId,
        limitMinor: data.limitMinor ?? 0,
        alertThreshold: data.alertThreshold ?? 80,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    }
}

function getBudgetRef(uid, monthKey, categoryId) {
    if (!uid) {
        throw new Error('A Firebase Authentication uid is required.')
    }

    if (!monthKey) {
        throw new Error('A month key is required.')
    }

    if (!categoryId) {
        throw new Error('A category id is required.')
    }

    return doc(getBudgetsCollectionRef(uid), `${monthKey}_${categoryId}`)
}

function toPositiveInteger(value, label) {
    const numberValue = Math.round(Math.abs(Number(value)))

    if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
        throw new Error(`${label} must be a positive integer.`)
    }

    return numberValue
}

function normalizeAlertThreshold(value) {
    const numberValue = Math.round(Number(value ?? 80))

    if (!Number.isSafeInteger(numberValue) || numberValue < 1 || numberValue > 100) {
        throw new Error('Budget alert threshold must be between 1 and 100.')
    }

    return numberValue
}

export async function getExpenseBudgets(uid, monthKey) {
    if (!monthKey) {
        throw new Error('A month key is required.')
    }

    const budgetsQuery = query(
        getBudgetsCollectionRef(uid),
        where('monthKey', '==', monthKey),
        orderBy('categoryId', 'asc'),
    )
    const snapshot = await getDocsFromServer(budgetsQuery)

    return snapshot.docs
        .map(mapBudget)
        .filter((budget) => budget.limitMinor > 0)
}

export async function upsertExpenseBudget(uid, input) {
    const monthKey = input?.monthKey
    const categoryId = input?.categoryId
    const limitMinor = toPositiveInteger(
        input?.limitMinor ?? input?.limit,
        'Budget limit',
    )
    const alertThreshold = normalizeAlertThreshold(input?.alertThreshold)
    const budgetRef = getBudgetRef(uid, monthKey, categoryId)

    await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(budgetRef)
        const timestamp = serverTimestamp()

        if (snapshot.exists()) {
            transaction.update(budgetRef, {
                limitMinor,
                alertThreshold,
                updatedAt: timestamp,
            })
            return
        }

        transaction.set(budgetRef, {
            monthKey,
            categoryId,
            limitMinor,
            alertThreshold,
            createdAt: timestamp,
            updatedAt: timestamp,
        })
    })

    return {
        id: budgetRef.id,
        monthKey,
        categoryId,
        limitMinor,
        alertThreshold,
    }
}

export async function deleteExpenseBudget(uid, input) {
    const monthKey = input?.monthKey
    const categoryId = input?.categoryId
    const budgetRef = getBudgetRef(uid, monthKey, categoryId)

    await deleteDoc(budgetRef)

    return {
        id: budgetRef.id,
        monthKey,
        categoryId,
    }
}
