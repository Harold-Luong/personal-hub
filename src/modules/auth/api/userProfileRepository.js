import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";

const userProfileInitializationRequests = new Map();

function getUserProfile(user) {
    return {
        displayName: user?.displayName ?? null,
        email: user?.email ?? null,
        photoURL: user?.photoURL ?? null,
    };
}

async function initializeUserProfile(user) {
    const uid = user?.uid;

    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    const userRef = doc(firestore, "users", uid);

    await runTransaction(firestore, async (transaction) => {
        const userSnapshot = await transaction.get(userRef);

        if (userSnapshot.exists()) {
            return;
        }

        const timestamp = serverTimestamp();

        transaction.set(userRef, {
            ...getUserProfile(user),
            createdAt: timestamp,
            initializedAt: timestamp,
            updatedAt: timestamp,
        });
    });
}

export function ensureUserProfileInitialized(user) {
    const uid = user?.uid;

    if (!uid) {
        return Promise.reject(new Error("A Firebase Authentication uid is required."));
    }

    const existingRequest = userProfileInitializationRequests.get(uid);

    if (existingRequest) {
        return existingRequest;
    }

    const request = initializeUserProfile(user).finally(() => {
        if (userProfileInitializationRequests.get(uid) === request) {
            userProfileInitializationRequests.delete(uid);
        }
    });

    userProfileInitializationRequests.set(uid, request);

    return request;
}
