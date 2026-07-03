import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { logout } from "../modules/auth/api/authRepository";
import AuthPage from "../modules/auth/pages/AuthPage";
import useEnsureExpenseSettings from "../modules/expenses/hooks/useEnsureExpenseSettings";
import DashboardPage from "../modules/expenses/pages/DashboardPage";

function AuthenticatedExpenses({ user }) {
    const expenseSettings = useEnsureExpenseSettings(user);
    const settingsUpdatedAt = expenseSettings.settings?.updatedAt;
    const dashboardKey = `${user.uid}:${settingsUpdatedAt?.seconds ?? 0}:${settingsUpdatedAt?.nanoseconds ?? 0}`;

    if (expenseSettings.isLoading) {
        const loadingMessage =
            expenseSettings.status === "initializing" ? "Đang khởi tạo dữ liệu..." : "Đang tải dữ liệu...";

        return <div className="auth-loading">{loadingMessage}</div>;
    }

    if (expenseSettings.error) {
        return (
            <main className="bootstrap-error">
                <section>
                    <h1>Không thể khởi tạo dữ liệu</h1>
                    <p>Kiểm tra Firestore Rules và kết nối mạng, sau đó thử lại.</p>
                    <div>
                        <button onClick={expenseSettings.retry} type="button">
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
        <DashboardPage initialSettings={expenseSettings.settings} key={dashboardKey} onLogout={logout} user={user} />
    );
}

export default function AppRoutes({ user }) {
    if (!user) {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="*" element={<Navigate replace to="/auth" />} />
                </Routes>
            </BrowserRouter>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate replace to="/expenses/dashboard" />} />
                <Route path="/auth" element={<Navigate replace to="/expenses/dashboard" />} />
                <Route path="/expenses" element={<Navigate replace to="/expenses/dashboard" />} />
                <Route path="/expenses/category-spending" element={<AuthenticatedExpenses user={user} />} />
                <Route path="/expenses/*" element={<AuthenticatedExpenses user={user} />} />
                <Route path="*" element={<Navigate replace to="/expenses/dashboard" />} />
            </Routes>
        </BrowserRouter>
    );
}
