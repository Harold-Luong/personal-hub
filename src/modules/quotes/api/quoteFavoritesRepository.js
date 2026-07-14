import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";

function assertUid(uid) {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }
}

function assertQuoteId(quoteId) {
    if (!quoteId || typeof quoteId !== "string") {
        throw new Error("A quoteId is required.");
    }
}

function getQuoteFavoritesCollection(uid) {
    assertUid(uid);
    return collection(firestore, "users", uid, "modules", "quotes", "favorites");
}

function getQuoteFavoriteDocument(uid, quoteId) {
    assertQuoteId(quoteId);
    return doc(getQuoteFavoritesCollection(uid), quoteId);
}

export function subscribeToQuoteFavorites(uid, onFavoritesChanged, onError) {
    return onSnapshot(
        getQuoteFavoritesCollection(uid),
        (snapshot) => {
            onFavoritesChanged(snapshot.docs.map((favoriteDocument) => favoriteDocument.id));
        },
        onError,
    );
}

export async function addQuoteFavorite(uid, quoteId) {
    await setDoc(getQuoteFavoriteDocument(uid, quoteId), {
        createdAt: serverTimestamp(),
        quoteId,
    });
}

export async function ensureQuoteFavorite(uid, quoteId) {
    const favoriteDocument = getQuoteFavoriteDocument(uid, quoteId);
    const favoriteSnapshot = await getDoc(favoriteDocument);

    if (!favoriteSnapshot.exists()) {
        await setDoc(favoriteDocument, {
            createdAt: serverTimestamp(),
            quoteId,
        });
    }
}

export async function removeQuoteFavorite(uid, quoteId) {
    await deleteDoc(getQuoteFavoriteDocument(uid, quoteId));
}
