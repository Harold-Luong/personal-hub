import useAuthSession from "./modules/auth/hooks/useAuthSession";
import AppRoutes from "./routes/AppRoutes";

function App() {
    const { user, isLoading } = useAuthSession();

    if (isLoading) {
        return <div className="auth-loading">Đang kiểm tra phiên đăng nhập...</div>;
    }

    return <AppRoutes user={user} />;
}

export default App;
