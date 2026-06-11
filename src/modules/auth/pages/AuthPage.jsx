import { useState } from 'react'
import {
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
} from '../api/authRepository'
import '../styles/auth.scss'

const authErrorMessages = {
    'auth/email-already-in-use': 'Email này đã được đăng ký.',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/invalid-email': 'Địa chỉ email không hợp lệ.',
    'auth/network-request-failed': 'Không thể kết nối Firebase. Vui lòng kiểm tra mạng.',
    'auth/operation-not-allowed': 'Phương thức đăng nhập này chưa được bật trong Firebase Console.',
    'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập Google.',
    'auth/popup-closed-by-user': 'Cửa sổ đăng nhập Google đã bị đóng.',
    'auth/too-many-requests': 'Bạn thử quá nhiều lần. Vui lòng thử lại sau.',
    'auth/unauthorized-domain': 'Domain hiện tại chưa được thêm vào Authorized domains.',
    'auth/weak-password': 'Mật khẩu cần có ít nhất 6 ký tự.',
}

function getAuthErrorMessage(error) {
    return authErrorMessages[error.code]
        || 'Không thể xác thực. Vui lòng thử lại.'
}

export default function AuthPage() {
    const [mode, setMode] = useState('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isRegisterMode = mode === 'register'

    const handleEmailSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            if (isRegisterMode) {
                await registerWithEmail(email.trim(), password)
            } else {
                await loginWithEmail(email.trim(), password)
            }
        } catch (authError) {
            setError(getAuthErrorMessage(authError))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleGoogleLogin = async () => {
        setError('')
        setIsSubmitting(true)

        try {
            await loginWithGoogle()
        } catch (authError) {
            setError(getAuthErrorMessage(authError))
        } finally {
            setIsSubmitting(false)
        }
    }

    const switchMode = () => {
        setMode(isRegisterMode ? 'login' : 'register')
        setError('')
    }

    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="auth-title">
                <div className="auth-card__brand">Personal Hub</div>
                <h1 id="auth-title">
                    {isRegisterMode ? 'Tạo tài khoản' : 'Đăng nhập'}
                </h1>
                <p className="auth-card__intro">
                    {isRegisterMode
                        ? 'Đăng ký để lưu dữ liệu chi tiêu theo tài khoản của bạn.'
                        : 'Đăng nhập để tiếp tục quản lý chi tiêu.'}
                </p>

                <form className="auth-form" onSubmit={handleEmailSubmit}>
                    <label htmlFor="auth-email">Email</label>
                    <input
                        autoComplete="email"
                        id="auth-email"
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                        type="email"
                        value={email}
                    />

                    <label htmlFor="auth-password">Mật khẩu</label>
                    <input
                        autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                        id="auth-password"
                        minLength={6}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        required
                        type="password"
                        value={password}
                    />

                    {error && (
                        <p className="auth-form__error" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        className="auth-button auth-button--primary"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting
                            ? 'Đang xử lý...'
                            : isRegisterMode
                                ? 'Đăng ký'
                                : 'Đăng nhập'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>hoặc</span>
                </div>

                <button
                    className="auth-button auth-button--google"
                    disabled={isSubmitting}
                    onClick={handleGoogleLogin}
                    type="button"
                >
                    Tiếp tục với Google
                </button>

                <p className="auth-card__switch">
                    {isRegisterMode
                        ? 'Đã có tài khoản?'
                        : 'Chưa có tài khoản?'}
                    <button onClick={switchMode} type="button">
                        {isRegisterMode ? 'Đăng nhập' : 'Đăng ký'}
                    </button>
                </p>
            </section>
        </main>
    )
}
