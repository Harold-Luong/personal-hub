import {
    collection,
    getDocsFromServer,
} from 'firebase/firestore'
import { firestore } from '../../../lib/firebase/firestore'

function getWalletsCollectionRef(uid) {
    if (!uid) {
        throw new Error('A Firebase Authentication uid is required.')
    }

    return collection(
        firestore,
        'users',
        uid,
        'modules',
        'expenses',
        'wallets',
    )
}

function sortWallets(firstWallet, secondWallet) {
    if (firstWallet.isDefault !== secondWallet.isDefault) {
        return firstWallet.isDefault ? -1 : 1
    }

    return (firstWallet.order ?? Number.MAX_SAFE_INTEGER)
        - (secondWallet.order ?? Number.MAX_SAFE_INTEGER)
}

function mapWallet(documentSnapshot) {
    const data = documentSnapshot.data()

    return {
        id: documentSnapshot.id,
        name: data.name,
        type: data.type,
        icon: data.icon ?? 'wallet',
        color: data.color ?? '#56b879',
        balance: data.balance ?? data.currentBalance ?? 0,
        initialBalance: data.initialBalance ?? 0,
        currency: data.currency ?? 'VND',
        order: data.order ?? data.sortOrder ?? Number.MAX_SAFE_INTEGER,
        isDefault: data.isDefault ?? false,
        isArchived: data.isArchived ?? false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    }
}

export async function getExpenseWallets(uid) {
    const snapshot = await getDocsFromServer(getWalletsCollectionRef(uid))

    return snapshot.docs
        .map(mapWallet)
        .filter((wallet) => !wallet.isArchived)
        .sort(sortWallets)
}
