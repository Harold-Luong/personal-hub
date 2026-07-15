import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { logout } from "../modules/auth/api/authRepository";
import useEnsureUserProfile from "../modules/auth/hooks/useEnsureUserProfile";
import AuthPage from "../modules/auth/pages/AuthPage";
import HubHomePage from "../modules/hub/pages/HubHomePage";

const ExpenseModuleRoute = lazy(() => import("../modules/expenses/routes/ExpenseModuleRoute"));
const QuotesRouter = lazy(() => import("../modules/quotes/routes/QuotesRouter"));
const MediaCutterRouter = lazy(() => import("../modules/media-cutter/routes/MediaCutterRouter"));
const JsonToolkitRouter = lazy(() => import("../modules/json-toolkit/routes/JsonToolkitRouter"));

function MediaCutterRoute() {
    return (
        <Suspense fallback={<div className="auth-loading">Đang mở Media Cutter...</div>}>
            <MediaCutterRouter />
        </Suspense>
    );
}

function JsonToolkitRoute() {
    return (
        <Suspense fallback={<div className="auth-loading">Đang mở JSON Toolkit...</div>}>
            <JsonToolkitRouter />
        </Suspense>
    );
}

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
            <Route
                path="/expenses/*"
                element={(
                    <Suspense fallback={<div className="auth-loading">Đang mở Expenses...</div>}>
                        <ExpenseModuleRoute onLogout={logout} />
                    </Suspense>
                )}
            />
            <Route
                path="/quotes/*"
                element={(
                    <Suspense fallback={<div className="auth-loading">Đang mở Quotes...</div>}>
                        <QuotesRouter />
                    </Suspense>
                )}
            />
            <Route path="/tools/media-cutter/*" element={<MediaCutterRoute />} />
            <Route path="/tools/json/*" element={<JsonToolkitRoute />} />
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
                    <Route path="/tools/media-cutter/*" element={<MediaCutterRoute />} />
                    <Route path="/tools/json/*" element={<JsonToolkitRoute />} />
                    <Route path="*" element={<Navigate replace to="/auth" />} />
                </Routes>
            )}
        </BrowserRouter>
    );
}
