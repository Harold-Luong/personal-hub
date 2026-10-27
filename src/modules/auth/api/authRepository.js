import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from 'firebase/auth'
import { auth } from '../../../lib/firebase/auth'
import { useAuthSessionStore } from '../../../stores/authSessionStore'

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
    const user = auth.currentUser
    const sessionRevision = useAuthSessionStore.getState().sessionRevision
    const isCurrentSession = () => auth.currentUser === user
        && useAuthSessionStore.getState().sessionRevision === sessionRevision
    const assertCurrentSession = () => {
        if (!isCurrentSession()) throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.')
    }

    if (!user) {
        throw new Error('Bạn cần đăng nhập để cập nhật thông tin.')
    }

    if (normalizedDisplayName.length < 2 || normalizedDisplayName.length > 60) {
        throw new Error('Tên hiển thị cần có từ 2 đến 60 ký tự.')
    }

    const previousDisplayName = user.displayName ?? null

    await updateProfile(user, { displayName: normalizedDisplayName })

    try {
        assertCurrentSession()
        const [{ doc, serverTimestamp, updateDoc }, { firestore }] = await Promise.all([
            import('firebase/firestore'),
            import('../../../lib/firebase/firestore'),
        ])

        assertCurrentSession()
        await updateDoc(doc(firestore, 'users', user.uid), {
            displayName: normalizedDisplayName,
            updatedAt: serverTimestamp(),
        })
        assertCurrentSession()
    } catch (error) {
        if (isCurrentSession()) {
            await updateProfile(user, { displayName: previousDisplayName }).catch(() => {})
        }
        throw error
    }

    return user
}
