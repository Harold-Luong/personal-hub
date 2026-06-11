import { logout } from './modules/auth/api/authRepository'
import useAuthSession from './modules/auth/hooks/useAuthSession'
import AuthPage from './modules/auth/pages/AuthPage'
import DashboardPage from './modules/expenses/pages/DashboardPage'

function App() {
    const { user, isLoading } = useAuthSession()

    if (isLoading) {
        return <div className="auth-loading">Đang kiểm tra đăng nhập...</div>
    }

    if (!user) {
        return <AuthPage />
    }

    return <DashboardPage onLogout={logout} user={user} />
}

export default App
