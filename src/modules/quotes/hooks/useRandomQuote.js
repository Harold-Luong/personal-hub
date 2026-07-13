import { useCallback, useEffect, useRef, useState } from "react";

function getRandomQuoteId(availableQuotes, excludedQuoteId) {
    const candidates = availableQuotes.filter((quote) => quote.id !== excludedQuoteId);
    const source = candidates.length > 0 ? candidates : availableQuotes;
    return source[Math.floor(Math.random() * source.length)]?.id ?? null;
}

export default function useRandomQuote(availableQuotes) {
    const initialQuoteId = availableQuotes[0]?.id ?? null;
    const [history, setHistory] = useState(() => initialQuoteId ? [initialQuoteId] : []);
    const [historyPosition, setHistoryPosition] = useState(0);
    const [transitionState, setTransitionState] = useState("idle");
    const timers = useRef([]);
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
            if (historyPosition < history.length - 1) {
                setHistoryPosition((currentPosition) => currentPosition + 1);
                return;
            }

            const nextQuoteId = getRandomQuoteId(availableQuotes, currentQuoteId);

            if (!nextQuoteId) {
                return;
            }

            setHistory((currentHistory) => [...currentHistory, nextQuoteId]);
            setHistoryPosition((currentPosition) => currentPosition + 1);
        });
    }, [availableQuotes, currentQuoteId, history.length, historyPosition, runTransition]);

    const showPrevious = useCallback(() => {
        if (historyPosition === 0) {
            return;
        }

        runTransition(() => setHistoryPosition((currentPosition) => Math.max(0, currentPosition - 1)));
    }, [historyPosition, runTransition]);

    return {
        canShowPrevious: historyPosition > 0,
        currentQuote,
        showNext,
        showPrevious,
        transitionState,
    };
}
