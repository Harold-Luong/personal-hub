import { collection, doc } from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";

/**
 * Lấy tham chiếu đến bộ sưu tập ngân sách của người dùng trong Firestore.
 * @param {*} uid - Firebase Authentication uid của người dùng.
 * @param {*} collectionName - Tên của collection hoặc document trong Firestore.
 * @returns {returns reference: user/uid/modules/expenses/collectionName} Tham chiếu đến collection firestore của người dùng.
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
 * Lấy tham chiếu đến tài liệu trong collection của người dùng trong Firestore.
 * @param {*} uid - Firebase Authentication uid của người dùng.
 * @param {*} collectionName - Tên của collection trong Firestore.
 * @param {*} documentId - ID của tài liệu trong Firestore.
 * @returns {returns reference: user/uid/modules/expenses/collection/documentId} Tham chiếu đến tài liệu firestore của người dùng.
 */
export const getDocumentReference = (uid, collectionName, documentId) => {
    if (!documentId) {
        throw new Error("A documentId is required.");
    }
    return doc(getCollectionReference(uid, collectionName), documentId);
};
