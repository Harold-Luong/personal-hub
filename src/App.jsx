import { logout } from './modules/auth/api/authRepository'
import useAuthSession from './modules/auth/hooks/useAuthSession'
import AuthPage from './modules/auth/pages/AuthPage'
import useEnsureExpenseSettings from './modules/expenses/hooks/useEnsureExpenseSettings'
import DashboardPage from './modules/expenses/pages/DashboardPage'

function AuthenticatedExpenses({ user }) {
    const expenseSettings = useEnsureExpenseSettings(user)
    const settingsUpdatedAt = expenseSettings.settings?.updatedAt
    const dashboardKey =
        `${user.uid}:${settingsUpdatedAt?.seconds ?? 0}:${settingsUpdatedAt?.nanoseconds ?? 0}`

    if (expenseSettings.isLoading) {
        return <div className="auth-loading">Đang khởi tạo dữ liệu...</div>
    }

    if (expenseSettings.error) {
        return (
            <main className="bootstrap-error">
                <section>
                    <h1>Không thể khởi tạo dữ liệu</h1>
                    <p>
                        Kiểm tra Firestore Rules và kết nối mạng, sau đó thử lại.
                    </p>
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
        )
    }

    return (
        <DashboardPage
            initialSettings={expenseSettings.settings}
            key={dashboardKey}
            onLogout={logout}
            user={user}
        />
    )
}

function App() {
    const { user, isLoading } = useAuthSession()

    if (isLoading) {
        return <div className="auth-loading">Đang khởi tạo dữ liệu...</div>
    }

    if (!user) {
        return <AuthPage />
    }

    return <AuthenticatedExpenses user={user} />
}

export default App
