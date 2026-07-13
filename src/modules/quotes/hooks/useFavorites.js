import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { quoteStorageKeys } from "../constants/quoteMetadata";
import { getQuoteById } from "../data/quoteData";

const loadQuoteFavoritesRepository = () => import("../api/quoteFavoritesRepository");

function getLegacyFavoriteIds() {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const storedValue = JSON.parse(window.localStorage.getItem(quoteStorageKeys.favorites) ?? "[]");
        return Array.isArray(storedValue) ? storedValue.filter((quoteId) => getQuoteById(quoteId)) : [];
    } catch {
        return [];
    }
}

async function migrateLegacyFavorites(uid, repository) {
    const legacyFavoriteIds = getLegacyFavoriteIds();

    if (legacyFavoriteIds.length === 0) {
        return;
    }

    await Promise.all(
        legacyFavoriteIds.map((quoteId) => repository.ensureQuoteFavorite(uid, quoteId)),
    );
    window.localStorage.removeItem(quoteStorageKeys.favorites);
}

const initialState = {
    error: null,
    favoriteIds: [],
    phase: "idle",
    requestKey: null,
};

export default function useFavorites(uid) {
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState(initialState);
    const pendingQuoteIds = useRef(new Set());
    const requestKey = uid ? `${uid}:${attempt}` : null;

    useEffect(() => {
        if (!uid || !requestKey) {
            return;
        }

        let isCancelled = false;
        let unsubscribe = () => {};

        loadQuoteFavoritesRepository()
            .then((repository) => {
                if (isCancelled) {
                    return;
                }

                unsubscribe = repository.subscribeToQuoteFavorites(
                    uid,
                    (favoriteIds) => {
                        setState({
                            error: null,
                            favoriteIds,
                            phase: "ready",
                            requestKey,
                        });
                    },
                    (error) => {
                        setState({
                            error,
                            favoriteIds: [],
                            phase: "error",
                            requestKey,
                        });
                    },
                );

                return migrateLegacyFavorites(uid, repository);
            })
            .catch((error) => {
                if (!isCancelled) {
                    setState({
                        error,
                        favoriteIds: [],
                        phase: "error",
                        requestKey,
                    });
                }
            });

        return () => {
            isCancelled = true;
            unsubscribe();
        };
    }, [requestKey, uid]);

    const isCurrentRequest = state.requestKey === requestKey;
    const favoriteIds = useMemo(
        () => (isCurrentRequest ? state.favoriteIds : []),
        [isCurrentRequest, state.favoriteIds],
    );

    const toggleFavorite = useCallback(async (quoteId) => {
        if (!uid || pendingQuoteIds.current.has(quoteId)) {
            return;
        }

        const wasFavorite = favoriteIds.includes(quoteId);
        pendingQuoteIds.current.add(quoteId);

        setState((currentState) => ({
            ...currentState,
            error: null,
            favoriteIds: wasFavorite
                ? currentState.favoriteIds.filter((currentId) => currentId !== quoteId)
                : [...currentState.favoriteIds, quoteId],
        }));

        try {
            const repository = await loadQuoteFavoritesRepository();

            if (wasFavorite) {
                await repository.removeQuoteFavorite(uid, quoteId);
            } else {
                await repository.addQuoteFavorite(uid, quoteId);
            }
        } catch (error) {
            setState((currentState) => ({
                ...currentState,
                error,
                favoriteIds: wasFavorite
                    ? [...new Set([...currentState.favoriteIds, quoteId])]
                    : currentState.favoriteIds.filter((currentId) => currentId !== quoteId),
            }));
        } finally {
            pendingQuoteIds.current.delete(quoteId);
        }
    }, [favoriteIds, uid]);

    return {
        favoriteIds,
        error: isCurrentRequest ? state.error : null,
        isLoading: Boolean(uid) && (!isCurrentRequest || state.phase === "idle"),
        retry: () => setAttempt((currentAttempt) => currentAttempt + 1),
        toggleFavorite,
    };
}
