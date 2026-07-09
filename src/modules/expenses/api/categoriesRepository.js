import { getDocsFromServer } from "firebase/firestore";
import { getCollectionReference } from "./getReference";
const CATEGORIES_COLLECTION = "categories";

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
    const snapshot = await getDocsFromServer(getCollectionReference(uid, CATEGORIES_COLLECTION));

    return snapshot.docs
        .map((documentSnapshot) => ({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
        }))
        .filter((category) => !category.isArchived)
        .sort(sortCategories);
}
