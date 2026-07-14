import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";
import QuoteHero from "../components/QuoteHero";
import { quotes } from "../data/quoteData";
import useAmbientAudio from "../hooks/useAmbientAudio";
import useRandomQuote from "../hooks/useRandomQuote";
import useSwipe from "../hooks/useSwipe";

export default function QuoteHomePage({ favoriteIds, onToggleFavorite, onToggleTheme, theme }) {
    const [isAutoMode, setIsAutoMode] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(() => document.visibilityState === "visible");
    const { isPlaying: isAmbientPlaying, startAmbient, stopAmbient } = useAmbientAudio();
    const {
        canShowPrevious,
        currentQuote,
        showNext,
        showPrevious,
        transitionState,
    } = useRandomQuote(quotes);
    const swipeHandlers = useSwipe({
        onSwipeLeft: showNext,
        onSwipeRight: showPrevious,
    });

    useEffect(() => {
        const handleVisibilityChange = () => setIsPageVisible(document.visibilityState === "visible");

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    useEffect(() => {
        if (!isAutoMode || !isPageVisible || transitionState !== "idle") return undefined;

        const delay = 20000 + Math.round(Math.random() * 10000);
        const autoTimer = window.setTimeout(showNext, delay);
        return () => window.clearTimeout(autoTimer);
    }, [currentQuote.id, isAutoMode, isPageVisible, showNext, transitionState]);

    const handleToggleAutoMode = () => {
        if (isAutoMode) {
            setIsAutoMode(false);
            stopAmbient();
            return;
        }

        void startAmbient();
        setIsAutoMode(true);
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            const targetTagName = event.target?.tagName;

            if (targetTagName === "INPUT" || targetTagName === "SELECT" || targetTagName === "TEXTAREA") {
                return;
            }

            if (event.code === "Space" || event.key === "ArrowRight") {
                event.preventDefault();
                showNext();
            } else if (event.key === "ArrowLeft" && canShowPrevious) {
                showPrevious();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [canShowPrevious, showNext, showPrevious]);

    return (
        <main className="lang-home">
            <AppHeader
                favoriteCount={favoriteIds.length}
                onToggleTheme={onToggleTheme}
                theme={theme}
                transparent
            />
            <QuoteHero
                isAutoMode={isAutoMode}
                isAmbientPlaying={isAmbientPlaying}
                isFavorite={favoriteIds.includes(currentQuote.id)}
                onNext={showNext}
                onToggleAutoMode={handleToggleAutoMode}
                onToggleFavorite={() => onToggleFavorite(currentQuote.id)}
                quote={currentQuote}
                quoteCount={quotes.length}
                swipeHandlers={swipeHandlers}
                transitionState={transitionState}
            />
        </main>
    );
}
