import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from 'firebase/auth'
import { auth } from '../../../lib/firebase/auth'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
}

export function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
}

export function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider)
}

export function logout() {
    return signOut(auth)
}

export async function updateAuthDisplayName(displayName) {
    const normalizedDisplayName = String(displayName ?? '').trim().replace(/\s+/g, ' ')

    if (!auth.currentUser) {
        throw new Error('Bạn cần đăng nhập để cập nhật thông tin.')
    }

    if (normalizedDisplayName.length < 2 || normalizedDisplayName.length > 60) {
        throw new Error('Tên hiển thị cần có từ 2 đến 60 ký tự.')
    }

    const previousDisplayName = auth.currentUser.displayName ?? null

    await updateProfile(auth.currentUser, { displayName: normalizedDisplayName })

    try {
        const [{ doc, serverTimestamp, updateDoc }, { firestore }] = await Promise.all([
            import('firebase/firestore'),
            import('../../../lib/firebase/firestore'),
        ])

        await updateDoc(doc(firestore, 'users', auth.currentUser.uid), {
            displayName: normalizedDisplayName,
            updatedAt: serverTimestamp(),
        })
    } catch (error) {
        await updateProfile(auth.currentUser, { displayName: previousDisplayName }).catch(() => {})
        throw error
    }

    return auth.currentUser
}
