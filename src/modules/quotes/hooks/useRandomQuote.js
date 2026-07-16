import { useCallback, useEffect, useRef, useState } from "react";
import {
    createQuoteNavigationState,
    getNextQuoteNavigationState,
} from "../utils/quoteShuffle";

export default function useRandomQuote(availableQuotes) {
    const [navigationState, setNavigationState] = useState(() => createQuoteNavigationState(availableQuotes));
    const [transitionState, setTransitionState] = useState("idle");
    const timers = useRef([]);
    const { history, historyPosition } = navigationState;
    const initialQuoteId = history[0] ?? null;
    const currentQuoteId = history[historyPosition] ?? initialQuoteId;
    const currentQuote = availableQuotes.find((quote) => quote.id === currentQuoteId) ?? availableQuotes[0] ?? null;

    const clearTimers = useCallback(() => {
        timers.current.forEach((timerId) => window.clearTimeout(timerId));
        timers.current = [];
    }, []);

    useEffect(() => clearTimers, [clearTimers]);

    const runTransition = useCallback((changeQuote) => {
        if (transitionState !== "idle") {
            return;
        }

        clearTimers();
        setTransitionState("leaving");
        timers.current.push(window.setTimeout(() => {
            changeQuote();
            setTransitionState("entering");
            timers.current.push(window.setTimeout(() => setTransitionState("idle"), 300));
        }, 150));
    }, [clearTimers, transitionState]);

    const showNext = useCallback(() => {
        runTransition(() => {
            setNavigationState((currentState) => getNextQuoteNavigationState(currentState, availableQuotes));
        });
    }, [availableQuotes, runTransition]);

    const showPrevious = useCallback(() => {
        if (historyPosition === 0) {
            return;
        }

        runTransition(() => setNavigationState((currentState) => ({
            ...currentState,
            historyPosition: Math.max(0, currentState.historyPosition - 1),
        })));
    }, [historyPosition, runTransition]);

    return {
        canShowPrevious: historyPosition > 0,
        currentQuote,
        showNext,
        showPrevious,
        transitionState,
    };
}
