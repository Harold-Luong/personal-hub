import { Navigate, Route, Routes } from "react-router";
import { selectAuthUid, useAuthSessionStore } from "../../../stores/authSessionStore";
import { quoteRoutes } from "../constants/quoteMetadata";
import useFavorites from "../hooks/useFavorites";
import useTheme from "../hooks/useTheme";
import CreatePage from "../pages/CreatePage";
import ExplorePage from "../pages/ExplorePage";
import FavoritesPage from "../pages/FavoritesPage";
import QuoteHomePage from "../pages/QuoteHomePage";
import "../styles/quotes.scss";

export default function QuotesRouter() {
    const uid = useAuthSessionStore(selectAuthUid);
    const favorites = useFavorites(uid);
    const { theme, toggleTheme } = useTheme();
    const sharedProps = {
        favoriteIds: favorites.favoriteIds,
        onToggleFavorite: favorites.toggleFavorite,
        onToggleTheme: toggleTheme,
        theme,
    };

    if (!uid || favorites.isLoading) {
        return <div className="auth-loading">Đang đồng bộ câu nói yêu thích...</div>;
    }

    if (favorites.error) {
        return (
            <main className="bootstrap-error">
                <section>
                    <h1>Không thể tải mục yêu thích</h1>
                    <p>Kiểm tra Firestore Rules và kết nối mạng, sau đó thử lại.</p>
                    <div>
                        <button onClick={favorites.retry} type="button">
                            Thử lại
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <div className="lang-module" data-theme={theme}>
            <Routes>
                <Route index element={<QuoteHomePage {...sharedProps} />} />
                <Route path="explore" element={<ExplorePage {...sharedProps} />} />
                <Route path="favorites" element={<FavoritesPage {...sharedProps} />} />
                <Route path="create" element={<CreatePage {...sharedProps} />} />
                <Route path="*" element={<Navigate replace to={quoteRoutes.home} />} />
            </Routes>
        </div>
    );
}
