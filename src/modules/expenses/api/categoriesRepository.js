import {
    collection,
    getDocsFromServer,
} from 'firebase/firestore'
import { firestore } from '../../../lib/firebase/firestore'

function getCategoriesCollectionRef(uid) {
    if (!uid) {
        throw new Error('A Firebase Authentication uid is required.')
    }

    return collection(
        firestore,
        'users',
        uid,
        'modules',
        'expenses',
        'categories',
    )
}

function sortCategories(firstCategory, secondCategory) {
    const typeComparison = (firstCategory.type ?? '')
        .localeCompare(secondCategory.type ?? '')

    if (typeComparison !== 0) {
        return typeComparison
    }

    return (firstCategory.sortOrder ?? Number.MAX_SAFE_INTEGER) - (secondCategory.sortOrder ?? Number.MAX_SAFE_INTEGER)
}

export async function getExpenseCategories(uid) {
    const snapshot = await getDocsFromServer(getCategoriesCollectionRef(uid))

    return snapshot.docs
        .map((documentSnapshot) => ({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
        }))
        .filter((category) => !category.isArchived)
        .sort(sortCategories)
}
