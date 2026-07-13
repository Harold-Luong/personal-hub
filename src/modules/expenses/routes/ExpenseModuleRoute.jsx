import { useNavigate } from "react-router";
import { selectAuthUid, useAuthSessionStore } from "../../../stores/authSessionStore";
import useEnsureExpenseModule from "../hooks/useEnsureExpenseModule";
import DashboardPage from "../pages/DashboardPage";

export default function ExpenseModuleRoute({ onLogout }) {
    const navigate = useNavigate();
    const uid = useAuthSessionStore(selectAuthUid);
    const expenseModule = useEnsureExpenseModule();
    const settingsUpdatedAt = expenseModule.settings?.updatedAt;
    const dashboardKey = `${uid}:${settingsUpdatedAt?.seconds ?? 0}:${settingsUpdatedAt?.nanoseconds ?? 0}`;

    if (!uid) {
        return <div className="auth-loading">Đang kiểm tra phiên đăng nhập...</div>;
    }

    if (expenseModule.isLoading) {
        const loadingMessage =
            expenseModule.status === "initializing" ? "Đang khởi tạo Expenses..." : "Đang tải Expenses...";

        return <div className="auth-loading">{loadingMessage}</div>;
    }

    if (expenseModule.error) {
        return (
            <main className="bootstrap-error">
                <section>
                    <h1>Không thể khởi tạo Expenses</h1>
                    <p>Kiểm tra Firestore Rules và kết nối mạng, sau đó thử lại.</p>
                    <div>
                        <button onClick={expenseModule.retry} type="button">
                            Thử lại
                        </button>
                        <button onClick={() => navigate("/hub")} type="button">
                            Về Hub
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    return <DashboardPage initialSettings={expenseModule.settings} key={dashboardKey} onLogout={onLogout} />;
}
