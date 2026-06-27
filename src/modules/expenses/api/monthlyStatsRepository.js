import {
    doc,
    getDocFromServer,
} from 'firebase/firestore'
import { firestore } from '../../../lib/firebase/firestore'

function getMonthlyStatsRef(uid, monthKey) {
    if (!uid) {
        throw new Error('A Firebase Authentication uid is required.')
    }

    if (!monthKey) {
        throw new Error('A month key is required.')
    }

    return doc(
        firestore,
        'users',
        uid,
        'modules',
        'expenses',
        'monthlyStats',
        monthKey,
    )
}

function getEmptyMonthlyStats(monthKey) {
    return {
        monthKey,
        incomeMinor: 0,
        expenseMinor: 0,
        netMinor: 0,
        transactionCount: 0,
        categoryExpenseMinor: {},
        categoryIncomeMinor: {},
    }
}

export async function getExpenseMonthlyStats(uid, monthKey) {
    const snapshot = await getDocFromServer(getMonthlyStatsRef(uid, monthKey))

    if (!snapshot.exists()) {
        return getEmptyMonthlyStats(monthKey)
    }

    const data = snapshot.data()

    return {
        ...getEmptyMonthlyStats(monthKey),
        ...data,
        monthKey: data.monthKey ?? monthKey,
        categoryExpenseMinor: data.categoryExpenseMinor ?? {},
        categoryIncomeMinor: data.categoryIncomeMinor ?? {},
    }
}
