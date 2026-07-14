import { Music2 } from "lucide-react";
import AmbientWaveform from "./AmbientWaveform";
import QuoteActions from "./QuoteActions";
import QuoteText from "./QuoteText";

export default function QuoteHero({
    isAmbientPlaying,
    isAutoMode,
    isFavorite,
    onNext,
    onToggleAutoMode,
    onToggleFavorite,
    quote,
    quoteCount,
    swipeHandlers,
    transitionState,
}) {
    return (
        <section
            {...swipeHandlers}
            className={`quote-hero is-${transitionState}`}
            style={{ "--quote-background": `url(${quote.background})` }}
        >
            <div className="quote-hero__backdrop" />
            <div className="quote-hero__content">
                <QuoteText quote={quote} />
                <QuoteActions
                    isAutoMode={isAutoMode}
                    isFavorite={isFavorite}
                    isTransitioning={transitionState !== "idle"}
                    onNext={onNext}
                    onToggleAutoMode={onToggleAutoMode}
                    onToggleFavorite={onToggleFavorite}
                    quote={quote}
                />
                <small className="quote-hero__swipe-hint">Vuốt để xem câu khác</small>
            </div>
            <footer className="quote-hero__footer">
                <span>{quoteCount} câu nói</span>
                <span className={isAmbientPlaying ? "is-active" : ""}>
                    <Music2 aria-hidden="true" size={15} />
                    {isAmbientPlaying ? <AmbientWaveform isActive /> : null}
                    {isAmbientPlaying ? "Không gian tĩnh đang phát" : "Không gian tĩnh"}
                </span>
            </footer>
        </section>
    );
}
