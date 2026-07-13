import { getFirestore } from 'firebase/firestore'
import { firebaseApp } from './app'

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'

export const firestore = databaseId === '(default)'
    ? getFirestore(firebaseApp)
    : getFirestore(firebaseApp, databaseId)
