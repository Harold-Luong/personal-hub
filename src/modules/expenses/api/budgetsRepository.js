import { deleteDoc, getDocsFromServer, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";
import { expenseCollections } from "./expenseFirestoreSchema";
import { getCollectionReference, getDocumentReference } from "./getReference";
import { toPositiveInteger } from "../utils/formatNumber";

export function getBudgetDocumentId(monthKey, categoryId) {
    if (!monthKey) {
        throw new Error("A month key is required.");
    }
    if (!categoryId) {
        throw new Error("A category id is required.");
    }

    return `${monthKey}_${categoryId}`;
}

/**
 * Chuyển đổi snapshot tài liệu thành đối tượng ngân sách.
 * @param {*} documentSnapshot 
 * @returns {id, monthKey, categoryId, limitMinor, alertThreshold, createdAt, updatedAt }
 */
function mapBudget(documentSnapshot) {
    const data = documentSnapshot.data();
    const limitMinor = data.limitMinor ?? data.limit ?? 0;

    return {
        id: documentSnapshot.id,
        monthKey: data.monthKey,
        categoryId: data.categoryId,
        limit: limitMinor,
        limitMinor,
        alertThreshold: data.alertThreshold ?? 80,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}

function normalizeAlertThreshold(value) {
    const numberValue = Math.round(Number(value ?? 80));

    if (
        !Number.isSafeInteger(numberValue) ||
        numberValue < 1 ||
        numberValue > 100
    ) {
        throw new Error("Budget alert threshold must be between 1 and 100.");
    }
    return numberValue;
}

/**
 * Lấy danh sách ngân sách chi tiêu của người dùng trong một tháng cụ thể.
 * @param {*} uid 
 * @param {*} monthKey 
 * @returns {Promise<Array>} Danh sách ngân sách chi tiêu.
 * @throws {Error} Nếu uid hoặc monthKey không được cung cấp.
 */
export async function getExpenseBudgetsByMonth(uid, monthKey) {
    if (!monthKey) {
        throw new Error("A month key is required.");
    }

    const budgetsQuery = query(
        getCollectionReference(uid, expenseCollections.BUDGETS),
        where("monthKey", "==", monthKey),
    );
    const snapshot = await getDocsFromServer(budgetsQuery);

    return snapshot.docs
        .map(mapBudget)
        .filter((budget) => budget.limitMinor > 0)
        .sort((firstBudget, secondBudget) =>
            String(firstBudget.categoryId ?? "").localeCompare(String(secondBudget.categoryId ?? ""), "vi"),
        );
}

export async function upsertExpenseBudget(uid, input) {
    const monthKey = input?.monthKey;
    const categoryId = input?.categoryId;
    const limitMinor = input?.limitMinor ?? input?.limit;
    const limitMinorPositive = toPositiveInteger(limitMinor, "Budget limit");
    const alertThreshold = normalizeAlertThreshold(input?.alertThreshold);
    const documentId = getBudgetDocumentId(monthKey, categoryId);
    const budgetDocRef = getDocumentReference(
        uid,
        expenseCollections.BUDGETS,
        documentId,
    );
    console.log(documentId, budgetDocRef)
    await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(budgetDocRef);
        const timestamp = serverTimestamp();

        if (snapshot.exists()) {
            transaction.update(budgetDocRef, {
                limitMinor: limitMinorPositive,
                alertThreshold: alertThreshold,
                updatedAt: timestamp,
            });
            return;
        }

        transaction.set(budgetDocRef, {
            monthKey: monthKey,
            categoryId: categoryId,
            limitMinor: limitMinorPositive,
            alertThreshold: alertThreshold,
            createdAt: timestamp,
            updatedAt: timestamp,
        });
    });

    return {
        id: budgetDocRef.id,
        monthKey: monthKey,
        categoryId: categoryId,
        limit: limitMinorPositive,
        limitMinor: limitMinorPositive,
        alertThreshold: alertThreshold,
    };
}

export async function deleteExpenseBudget(uid, input) {
    const monthKey = input?.monthKey;
    const categoryId = input?.categoryId;
    const budgetDocRef = getDocumentReference(
        uid,
        expenseCollections.BUDGETS,
        getBudgetDocumentId(monthKey, categoryId),
    );

    await deleteDoc(budgetDocRef);

    return {
        id: budgetDocRef.id,
        monthKey: monthKey,
        categoryId: categoryId,
    };
}
