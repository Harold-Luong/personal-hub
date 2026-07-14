import AppHeader from "../components/AppHeader";
import EmptyState from "../components/EmptyState";
import QuoteCard from "../components/QuoteCard";
import { quotes } from "../data/quoteData";

export default function FavoritesPage({ favoriteIds, onToggleFavorite, onToggleTheme, theme }) {
    const favoriteQuotes = favoriteIds
        .map((quoteId) => quotes.find((quote) => quote.id === quoteId))
        .filter(Boolean);

    return (
        <main className="lang-page">
            <AppHeader favoriteCount={favoriteIds.length} onToggleTheme={onToggleTheme} theme={theme} />
            <div className="lang-page__content">
                <header className="lang-page-intro">
                    <span>Bộ sưu tập</span>
                    <h1>Những câu bạn muốn giữ lại.</h1>
                    <p>Một góc nhỏ cho những câu chữ đã từng chạm đến bạn.</p>
                </header>
                {favoriteQuotes.length > 0 ? (
                    <section className="quote-grid" aria-label="Các câu nói đã lưu">
                        {favoriteQuotes.map((quote) => (
                            <QuoteCard
                                isFavorite
                                key={quote.id}
                                onToggleFavorite={onToggleFavorite}
                                quote={quote}
                            />
                        ))}
                    </section>
                ) : <EmptyState />}
            </div>
        </main>
    );
}
