import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
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
