import { useEffect, useState } from 'react'

const initialState = {
    error: null,
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
            .then(({ ensureExpenseSettings }) => ensureExpenseSettings(uid))
            .then((settings) => {
                if (!isCancelled) {
                    setState({
                        error: null,
                        requestKey,
                        settings,
                    })
                }
            })
            .catch((error) => {
                if (!isCancelled) {
                    setState({
                        error,
                        requestKey,
                        settings: null,
                    })
                }
            })

        return () => {
            isCancelled = true
        }
    }, [requestKey, uid])

    if (!uid) {
        return {
            error: null,
            isLoading: false,
            retry: () => {},
            settings: null,
        }
    }

    const isCurrentRequest = state.requestKey === requestKey

    return {
        error: isCurrentRequest ? state.error : null,
        isLoading: !isCurrentRequest,
        retry: () => setAttempt((currentAttempt) => currentAttempt + 1),
        settings: isCurrentRequest ? state.settings : null,
    }
}
