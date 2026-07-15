import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { logout } from "../modules/auth/api/authRepository";
import useEnsureUserProfile from "../modules/auth/hooks/useEnsureUserProfile";
import AuthPage from "../modules/auth/pages/AuthPage";
import ExpenseModuleRoute from "../modules/expenses/routes/ExpenseModuleRoute";
import HubHomePage from "../modules/hub/pages/HubHomePage";
import QuotesRouter from "../modules/quotes/routes/QuotesRouter";

const MediaCutterRouter = lazy(() => import("../modules/media-cutter/routes/MediaCutterRouter"));

function AuthenticatedApplication({ user }) {
    const userProfile = useEnsureUserProfile(user);

    if (userProfile.isLoading) {
        return <div className="auth-loading">Đang chuẩn bị Personal Hub...</div>;
    }

    if (userProfile.error) {
        return (
            <main className="bootstrap-error">
                <section>
                    <h1>Không thể mở Personal Hub</h1>
                    <p>Kiểm tra Firestore Rules và kết nối mạng, sau đó thử lại.</p>
                    <div>
                        <button onClick={userProfile.retry} type="button">
                            Thử lại
                        </button>
                        <button onClick={logout} type="button">
                            Đăng xuất
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Navigate replace to="/hub" />} />
            <Route path="/auth" element={<Navigate replace to="/hub" />} />
            <Route path="/hub" element={<HubHomePage onLogout={logout} user={user} />} />
            <Route path="/expenses" element={<Navigate replace to="/expenses/dashboard" />} />
            <Route path="/expenses/*" element={<ExpenseModuleRoute onLogout={logout} />} />
            <Route path="/quotes/*" element={<QuotesRouter />} />
            <Route
                path="/tools/media-cutter/*"
                element={(
                    <Suspense fallback={<div className="auth-loading">Đang mở Media Cutter...</div>}>
                        <MediaCutterRouter />
                    </Suspense>
                )}
            />
            <Route path="*" element={<Navigate replace to="/hub" />} />
        </Routes>
    );
}

export default function AppRoutes({ user }) {
    return (
        <BrowserRouter>
            {user ? (
                <AuthenticatedApplication user={user} />
            ) : (
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="*" element={<Navigate replace to="/auth" />} />
                </Routes>
            )}
        </BrowserRouter>
    );
}
