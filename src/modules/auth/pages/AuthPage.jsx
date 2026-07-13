import { useState } from "react";
import MoneyCareLogo from "../../../components/brand/MoneyCareLogo";
import { loginWithEmail, loginWithGoogle, registerWithEmail } from "../api/authRepository";
import { authPageMessages, getAuthErrorMessage } from "../messages/authMessages";
import "../styles/auth.scss";

export default function AuthPage() {
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isRegisterMode = mode === "register";
    const modeMessages = authPageMessages.modes[mode];

    const handleEmailSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            if (isRegisterMode) {
                await registerWithEmail(email.trim(), password);
            } else {
                await loginWithEmail(email.trim(), password);
            }
        } catch (authError) {
            setError(getAuthErrorMessage(authError));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setIsSubmitting(true);

        try {
            await loginWithGoogle();
        } catch (authError) {
            setError(getAuthErrorMessage(authError));
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchMode = () => {
        setMode(isRegisterMode ? "login" : "register");
        setError("");
    };

    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="auth-title">
                <div className="auth-card__brand">
                    <MoneyCareLogo label={null} size={44} />
                    <span>{authPageMessages.brand}</span>
                </div>
                <h1 id="auth-title">{modeMessages.title}</h1>
                <p className="auth-card__intro">{modeMessages.intro}</p>

                <form className="auth-form" onSubmit={handleEmailSubmit}>
                    <label htmlFor="auth-email">{authPageMessages.emailLabel}</label>
                    <input
                        autoComplete="email"
                        id="auth-email"
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={authPageMessages.emailPlaceholder}
                        required
                        type="email"
                        value={email}
                    />

                    <label htmlFor="auth-password">{authPageMessages.passwordLabel}</label>
                    <input
                        autoComplete={isRegisterMode ? "new-password" : "current-password"}
                        id="auth-password"
                        minLength={6}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={authPageMessages.passwordPlaceholder}
                        required
                        type="password"
                        value={password}
                    />

                    {error && (
                        <p className="auth-form__error" role="alert">
                            {error}
                        </p>
                    )}

                    <button className="auth-button auth-button--primary" disabled={isSubmitting} type="submit">
                        {isSubmitting ? authPageMessages.submittingButton : modeMessages.submitButton}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>{authPageMessages.divider}</span>
                </div>

                <button
                    className="auth-button auth-button--google"
                    disabled={isSubmitting}
                    onClick={handleGoogleLogin}
                    type="button"
                >
                    {authPageMessages.googleButton}
                </button>

                <p className="auth-card__switch">
                    {modeMessages.alternateModeLabel}
                    <button onClick={switchMode} type="button">
                        {modeMessages.switchButton}
                    </button>
                </p>
            </section>
        </main>
    );
}
