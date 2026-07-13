import AutoModeButton from "./AutoModeButton";
import CopyButton from "./CopyButton";
import FavoriteButton from "./FavoriteButton";
import RandomButton from "./RandomButton";

export default function QuoteActions({ isAutoMode, isFavorite, isTransitioning, onNext, onToggleAutoMode, onToggleFavorite, quote }) {
    return (
        <div className="quote-actions">
            <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
            <RandomButton disabled={isTransitioning} onClick={onNext} />
            <AutoModeButton isActive={isAutoMode} onToggle={onToggleAutoMode} />
            <CopyButton quote={quote} />
        </div>
    );
}
