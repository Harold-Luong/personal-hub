import { useState } from "react";
import MoneyCareLogo from "../../../../components/brand/MoneyCareLogo";
import { selectAuthUser, useAuthSessionStore } from "../../../../stores/authSessionStore";
import { expenseDefaultTheme } from "../../constants/expenseMetadata";
import { expenseUiText } from "../../constants/expenseUiMetadata";
import ExpenseIcon from "../../icon/ExpenseIcon";
import ExpenseButton from "../shared/ExpenseButton";

export default function ExpenseSidebar({
    activeId = "dashboard",
    items = [],
    onBackToHub,
    onLogout,
    onNavigate,
    onToggleTheme,
    theme = expenseDefaultTheme,
}) {
    const user = useAuthSessionStore(selectAuthUser);
    const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
    const [isSigningOut, setIsSigningOut] = useState(false);
    const accountName = user?.displayName || user?.email || "Tài khoản";
    const accountEmail = user?.email || "Tài khoản cá nhân";
    const accountPhotoUrl = user?.photoURL || "";
    const shouldShowAccountPhoto = accountPhotoUrl && failedAvatarUrl !== accountPhotoUrl;
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
        <aside className="expense-sidebar">
            <button className="expense-sidebar__brand" onClick={onBackToHub} type="button">
                <MoneyCareLogo className="expense-sidebar__logo" label={null} size={42} />
                <strong>MoneyCare</strong>
            </button>

            <nav>
                {items.map((item) => (
                    <button
                        className={item.id === activeId ? "is-active" : ""}
                        key={item.id}
                        onClick={() => onNavigate?.(item.id)}
                        type="button"
                    >
                        <ExpenseIcon icon={item.icon} label={item.label} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <section className="expense-sidebar__account">
                <div className="expense-sidebar__profile">
                    <span className="expense-sidebar__avatar" title={accountEmail}>
                        {shouldShowAccountPhoto ? (
                            <img alt="" onError={() => setFailedAvatarUrl(accountPhotoUrl)} src={accountPhotoUrl} />
                        ) : (
                            avatarLabel
                        )}
                    </span>
                    <span className="expense-sidebar__profile-copy">
                        <strong>{accountName}</strong>
                        <small>{accountEmail}</small>
                    </span>
                </div>
                <div className="expense-sidebar__account-actions">
                    <ExpenseButton
                        ariaLabel={expenseUiText.actions.TOGGLE_THEME}
                        className="expense-sidebar__theme"
                        icon="theme"
                        iconSize={17}
                        label={theme}
                        labelTag="span"
                        onClick={onToggleTheme}
                        title={expenseUiText.actions.TOGGLE_THEME}
                    />
                    <ExpenseButton
                        ariaLabel={expenseUiText.actions.LOGOUT}
                        className="expense-sidebar__logout"
                        disabled={isSigningOut}
                        icon="logout"
                        iconAppearance="base"
                        iconSize={17}
                        onClick={handleLogout}
                        title={expenseUiText.actions.LOGOUT}
                    />
                </div>
            </section>
        </aside>
    );
}
