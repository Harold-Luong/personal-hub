import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../../lib/firebase/auth'
import { useAuthSessionStore } from '../../../stores/authSessionStore'

export default function useAuthSession() {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        return onAuthStateChanged(auth, (currentUser) => {
            useAuthSessionStore.getState().setAuthUser(currentUser)
            setUser(currentUser)
            setIsLoading(false)
        })
    }, [])

    return {
        user: user,
        isLoading: isLoading,
    }
}
