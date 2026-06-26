import { useEffect, useState } from 'react'

const initialState = {
    error: null,
    phase: 'idle',
    requestKey: null,
    settings: null,
}

export default function useEnsureExpenseSettings(user) {
    const [attempt, setAttempt] = useState(0)
    const [state, setState] = useState(initialState)
    const uid = user?.uid ?? null
    const requestKey = uid ? `${uid}:${attempt}` : null

    useEffect(() => {
        if (!uid) {
            return
        }

        let isCancelled = false

        import('../api/expenseSettingsRepository')
            .then(({ ensureUserDataInitialized }) => {
                if (!isCancelled) {
                    setState({
                        error: null,
                        phase: 'initializing',
                        requestKey,
                        settings: null,
                    })
                }

                return ensureUserDataInitialized(user)
            })
            .then((settings) => {
                if (!isCancelled) {
                    setState({
                        error: null,
                        phase: 'ready',
                        requestKey,
                        settings,
                    })
                }
            })
            .catch((error) => {
                if (!isCancelled) {
                    setState({
                        error,
                        phase: 'error',
                        requestKey,
                        settings: null,
                    })
                }
            })

        return () => {
            isCancelled = true
        }
    }, [requestKey, uid, user])

    if (!uid) {
        return {
            error: null,
            isLoading: false,
            retry: () => {},
            settings: null,
        }
    }

    const isCurrentRequest = state.requestKey === requestKey
    const status = isCurrentRequest ? state.phase : 'loading'

    return {
        error: isCurrentRequest ? state.error : null,
        isLoading: status === 'loading' || status === 'initializing',
        retry: () => setAttempt((currentAttempt) => currentAttempt + 1),
        settings: isCurrentRequest ? state.settings : null,
        status,
    }
}
