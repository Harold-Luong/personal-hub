import { collection, doc, getDocFromServer, getDocsFromServer, orderBy, query, where } from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";
import { getEmptyMonthlyStats } from "../utils/monthlyStatsUtils";

function getMonthlyStatsCollectionRef(uid) {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    return collection(
        firestore,
        "users",
        uid,
        "modules",
        "expenses",
        "monthlyStats",
    );
}

function getMonthlyStatsRef(uid, monthKey) {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    if (!monthKey) {
        throw new Error("A month key is required.");
    }

    return doc(
        firestore,
        "users",
        uid,
        "modules",
        "expenses",
        "monthlyStats",
        monthKey,
    );
}

export async function getExpenseMonthlyStats(uid, monthKey) {
    const snapshot = await getDocFromServer(getMonthlyStatsRef(uid, monthKey));

    if (!snapshot.exists()) {
        return getEmptyMonthlyStats(monthKey);
    }

    const data = snapshot.data();

    return {
        ...getEmptyMonthlyStats(monthKey),
        ...data,
        monthKey: data.monthKey ?? monthKey,
        categoryExpenseMinor: data.categoryExpenseMinor ?? {},
        categoryIncomeMinor: data.categoryIncomeMinor ?? {},
    };
}

export async function getExpenseMonthlyStatsMonths(uid, year = new Date().getFullYear()) {
    const yearValue = Number(year);

    if (!Number.isSafeInteger(yearValue)) {
        throw new Error("A valid year is required.");
    }

    const startMonthKey = `${yearValue}-01`;
    const endMonthKey = `${yearValue}-12`;
    const monthlyStatsQuery = query(
        getMonthlyStatsCollectionRef(uid),
        where("monthKey", ">=", startMonthKey),
        where("monthKey", "<=", endMonthKey),
        orderBy("monthKey", "desc"),
    );
    const snapshot = await getDocsFromServer(monthlyStatsQuery);

    return snapshot.docs
        .map((documentSnapshot) => documentSnapshot.data().monthKey ?? documentSnapshot.id)
        .filter((monthKey) => typeof monthKey === "string" && monthKey >= startMonthKey && monthKey <= endMonthKey);
}
