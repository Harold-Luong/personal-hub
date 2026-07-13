import { collection, doc } from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";

/**
 * Lấy tham chiếu đến một collection thuộc module expenses của người dùng.
 * @param {*} uid - Firebase Authentication uid của người dùng.
 * @param {string} collectionName - Tên collection trong Firestore.
 * @returns {import("firebase/firestore").CollectionReference} Tham chiếu đến
 * `users/{uid}/modules/expenses/{collectionName}`.
 */
export const getCollectionReference = (uid, collectionName) => {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }
    if (!collectionName) {
        throw new Error("A collection is required.");
    }
    return collection(firestore, "users", uid, "modules", "expenses", collectionName);
};

/**
 * Lấy tham chiếu đến document thuộc module expenses của người dùng.
 * @param {*} uid - Firebase Authentication uid của người dùng.
 * @param {string} collectionName - Tên collection trong Firestore.
 * @param {string} documentId - ID của document trong Firestore.
 * @returns {import("firebase/firestore").DocumentReference} Tham chiếu đến
 * `users/{uid}/modules/expenses/{collectionName}/{documentId}`.
 */
export const getDocumentReference = (uid, collectionName, documentId) => {
    if (!documentId) {
        throw new Error("A documentId is required.");
    }
    return doc(getCollectionReference(uid, collectionName), documentId);
};
