import { getDocsFromServer, serverTimestamp, writeBatch } from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";
import { expenseCollections } from "./expenseFirestoreSchema";
import { getCollectionReference, getDocumentReference } from "./getReference";

function sortCategories(firstCategory, secondCategory) {
    const typeComparison = (firstCategory.type ?? "").localeCompare(
        secondCategory.type ?? "",
    );

    if (typeComparison !== 0) {
        return typeComparison;
    }

    return (
        (firstCategory.sortOrder ?? Number.MAX_SAFE_INTEGER) -
        (secondCategory.sortOrder ?? Number.MAX_SAFE_INTEGER)
    );
}

export async function getExpenseCategories(uid) {
    const snapshot = await getDocsFromServer(
        getCollectionReference(uid, expenseCollections.CATEGORIES),
    );

    return snapshot.docs
        .map((documentSnapshot) => ({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
        }))
        .filter((category) => !category.isArchived)
        .sort(sortCategories);
}

export async function reorderExpenseCategories(uid, categoryIds = []) {
    const uniqueCategoryIds = [...new Set(categoryIds.filter(Boolean))];

    if (!uid || uniqueCategoryIds.length === 0) {
        return [];
    }

    const batch = writeBatch(firestore);
    const timestamp = serverTimestamp();

    uniqueCategoryIds.forEach((categoryId, index) => {
        batch.update(getDocumentReference(uid, expenseCollections.CATEGORIES, categoryId), {
            sortOrder: (index + 1) * 10,
            updatedAt: timestamp,
        });
    });

    await batch.commit();
    return uniqueCategoryIds;
}
