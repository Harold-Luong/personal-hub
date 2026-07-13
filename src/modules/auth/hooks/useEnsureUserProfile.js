import { useEffect, useState } from "react";

const initialState = {
    error: null,
    phase: "idle",
    requestKey: null,
};

export default function useEnsureUserProfile(user) {
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState(initialState);
    const uid = user?.uid ?? null;
    const requestKey = uid ? `${uid}:${attempt}` : null;

    useEffect(() => {
        if (!user || !requestKey) {
            return;
        }

        let isCancelled = false;

        import("../api/userProfileRepository")
            .then(({ ensureUserProfileInitialized }) => ensureUserProfileInitialized(user))
            .then(() => {
                if (!isCancelled) {
                    setState({
                        error: null,
                        phase: "ready",
                        requestKey,
                    });
                }
            })
            .catch((error) => {
                if (!isCancelled) {
                    setState({
                        error,
                        phase: "error",
                        requestKey,
                    });
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [requestKey, user]);

    const isCurrentRequest = state.requestKey === requestKey;
    const status = isCurrentRequest ? state.phase : "loading";

    return {
        error: isCurrentRequest ? state.error : null,
        isLoading: Boolean(uid) && status === "loading",
        retry: () => setAttempt((currentAttempt) => currentAttempt + 1),
        status,
    };
}
