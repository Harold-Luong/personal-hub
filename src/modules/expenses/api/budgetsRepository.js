import {
    collection,
    getDocsFromServer,
    orderBy,
    query,
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
