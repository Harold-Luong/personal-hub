import FavoriteButton from "./FavoriteButton";

export default function QuoteCard({ isFavorite, onToggleFavorite, quote }) {
    return (
        <article className="quote-card">
            <img alt="" loading="lazy" src={quote.background} />
            <span className="quote-card__overlay" />
            <div className="quote-card__content">
                <blockquote>“{quote.text}”</blockquote>
                <span>— {quote.author}</span>
            </div>
            <FavoriteButton
                isFavorite={isFavorite}
                onToggle={() => onToggleFavorite(quote.id)}
                showLabel={false}
            />
        </article>
    );
}
