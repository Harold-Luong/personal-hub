import { useState } from "react";
import { useNavigate } from "react-router";
import MoneyCareLogo from "../../../components/brand/MoneyCareLogo";
import HubModuleIcon from "../components/HubModuleIcon";
import { hubModules } from "../constants/hubModules";
import "../styles/hub.scss";

function getGreetingName(user) {
    const displayName = user?.displayName?.trim();

    if (displayName) {
        return displayName.split(/\s+/)[0];
    }

    return user?.email?.split("@")[0] || "bạn";
}

export default function HubHomePage({ onLogout, user }) {
    const navigate = useNavigate();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const accountName = user?.displayName || user?.email || "Tài khoản";
    const avatarLabel = accountName.trim().charAt(0).toUpperCase() || "T";

    const handleLogout = async () => {
        setIsSigningOut(true);

        try {
            await onLogout?.();
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <main className="hub-home">
            <header className="hub-home__header">
                <div className="hub-home__brand">
                    <MoneyCareLogo label={null} size={42} />
                    <span>
                        <strong>Personal Hub</strong>
                        <small>Không gian của riêng bạn</small>
                    </span>
                </div>
                <div className="hub-home__account">
                    <span className="hub-home__avatar" aria-hidden="true">
                        {user?.photoURL ? <img alt="" src={user.photoURL} /> : avatarLabel}
                    </span>
                    <span className="hub-home__account-copy">
                        <strong>{accountName}</strong>
                        <small>{user?.email}</small>
                    </span>
                    <button disabled={isSigningOut} onClick={handleLogout} type="button">
                        {isSigningOut ? "Đang thoát..." : "Đăng xuất"}
                    </button>
                </div>
            </header>

            <section className="hub-home__intro">
                <span className="hub-home__eyebrow">Hôm nay của bạn</span>
                <h1>Chào {getGreetingName(user)}, bạn muốn bắt đầu từ đâu?</h1>
                <p>Mỗi module là một không gian độc lập. Dữ liệu chỉ được chuẩn bị khi bạn mở module đó.</p>
            </section>

            <section className="hub-home__modules" aria-labelledby="hub-modules-title">
                <div className="hub-home__section-heading">
                    <div>
                        <span>Ứng dụng</span>
                        <h2 id="hub-modules-title">Hub của bạn</h2>
                    </div>
                    <small>{hubModules.length} module</small>
                </div>

                <div className="hub-home__module-grid">
                    {hubModules.map((module) => (
                        <button
                            className="hub-module-card"
                            key={module.id}
                            onClick={() => navigate(module.path)}
                            style={{ "--hub-module-accent": module.accent }}
                            type="button"
                        >
                            <span className="hub-module-card__icon">
                                <HubModuleIcon icon={module.icon} />
                            </span>
                            <span className="hub-module-card__copy">
                                <small>{module.eyebrow}</small>
                                <strong>{module.title}</strong>
                                <span>{module.description}</span>
                            </span>
                            <span className="hub-module-card__action" aria-hidden="true">
                                Mở <span>→</span>
                            </span>
                        </button>
                    ))}
                </div>
            </section>
        </main>
    );
}
