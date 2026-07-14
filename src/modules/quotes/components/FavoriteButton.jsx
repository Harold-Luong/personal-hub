import { Heart } from "lucide-react";

export default function FavoriteButton({ isFavorite, onToggle, showLabel = true }) {
    return (
        <button
            aria-label={isFavorite ? "Bỏ lưu câu nói" : "Lưu câu nói"}
            aria-pressed={isFavorite}
            className={`quote-action quote-action--favorite${isFavorite ? " is-active" : ""}`}
            onClick={onToggle}
            type="button"
        >
            <Heart aria-hidden="true" fill={isFavorite ? "currentColor" : "none"} size={18} />
            {showLabel ? <span>{isFavorite ? "Đã lưu" : "Lưu"}</span> : null}
        </button>
    );
}
