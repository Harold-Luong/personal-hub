import { getDocFromServer, getDocsFromServer, orderBy, query, where } from "firebase/firestore";
import { expenseCollections } from "./expenseFirestoreSchema";
import { getCollectionReference, getDocumentReference } from "./getReference";
import { getEmptyMonthlyStats } from "../utils/monthlyStatsUtils";

export async function getExpenseMonthlyStats(uid, monthKey) {
    const snapshot = await getDocFromServer(
        getDocumentReference(uid, expenseCollections.MONTHLY_STATS, monthKey),
    );

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
        getCollectionReference(uid, expenseCollections.MONTHLY_STATS),
        where("monthKey", ">=", startMonthKey),
        where("monthKey", "<=", endMonthKey),
        orderBy("monthKey", "desc"),
    );
    const snapshot = await getDocsFromServer(monthlyStatsQuery);

    return snapshot.docs
        .map((documentSnapshot) => documentSnapshot.data().monthKey ?? documentSnapshot.id)
        .filter((monthKey) => typeof monthKey === "string" && monthKey >= startMonthKey && monthKey <= endMonthKey);
}
