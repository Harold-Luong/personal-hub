import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "react-router";
import AppHeader from "../components/AppHeader";
import CategoryCard from "../components/CategoryCard";
import QuoteCard from "../components/QuoteCard";
import { getCategoryById, quoteCategories, quotes } from "../data/quoteData";

export default function ExplorePage({ favoriteIds, onToggleFavorite, onToggleTheme, theme }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedCategoryId = searchParams.get("category");
    const selectedCategory = getCategoryById(selectedCategoryId);
    const visibleQuotes = selectedCategory
        ? quotes.filter((quote) => quote.categoryId === selectedCategory.id)
        : [];

    return (
        <main className="lang-page">
            <AppHeader favoriteCount={favoriteIds.length} onToggleTheme={onToggleTheme} theme={theme} />
            <div className="lang-page__content">
                {selectedCategory ? (
                    <>
                        <button className="lang-back-button" onClick={() => setSearchParams({})} type="button">
                            <ArrowLeft aria-hidden="true" size={17} /> Tất cả chủ đề
                        </button>
                        <header className="lang-page-intro">
                            <span>Chủ đề</span>
                            <h1>{selectedCategory.name}</h1>
                            <p>{selectedCategory.description}</p>
                        </header>
                        <section className="quote-grid" aria-label={`Câu nói về ${selectedCategory.name}`}>
                            {visibleQuotes.map((quote) => (
                                <QuoteCard
                                    isFavorite={favoriteIds.includes(quote.id)}
                                    key={quote.id}
                                    onToggleFavorite={onToggleFavorite}
                                    quote={quote}
                                />
                            ))}
                        </section>
                    </>
                ) : (
                    <>
                        <header className="lang-page-intro">
                            <span>Khám phá</span>
                            <h1>Mỗi tâm trạng, một khoảng trời.</h1>
                            <p>Chọn điều đang ở gần bạn nhất lúc này.</p>
                        </header>
                        <section className="category-grid" aria-label="Các chủ đề câu nói">
                            {quoteCategories.map((category) => (
                                <CategoryCard
                                    category={category}
                                    key={category.id}
                                    onClick={(categoryId) => setSearchParams({ category: categoryId })}
                                />
                            ))}
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
