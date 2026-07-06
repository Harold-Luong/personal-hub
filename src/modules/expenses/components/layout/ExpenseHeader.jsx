import { useState } from "react";
import { LogoutIcon, PlusIcon, ThemeIcon } from "../../icon/ExpenseIcons";

export default function ExpenseHeader({
    className = "",
    // eyebrow,
    onAddTransactionClick,
    onLogout,
    onToggleTheme,
    pageActions,
    subtitle,
    theme = "sage",
    title,
    user,
}) {
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
    const accountName = user?.displayName || user?.email || "Tai khoan";
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

    const headerClassName = ["expense-header", className].filter(Boolean).join(" ");

    return (
        <header className={headerClassName}>
            {title ? (
                <div className="expense-header__title">
                    {/* {eyebrow ? <span>{eyebrow}</span> : null} */}
                    <h1>{title}</h1>
                    {subtitle ? <p>{subtitle}</p> : null}
                </div>
            ) : null}
            {pageActions ? <div className="expense-header__page-actions">{pageActions}</div> : null}
            <div className="expense-header__actions">
                <button
                    aria-label="Thêm giao dịch"
                    className="expense-header__add"
                    onClick={onAddTransactionClick}
                    type="button"
                >
                    <PlusIcon size={17} />
                    <span>Thêm giao dịch</span>
                </button>
                <button
                    aria-label="Doi giao dien"
                    className="expense-theme-toggle"
                    onClick={onToggleTheme}
                    type="button"
                >
                    <ThemeIcon size={18} />
                    <span>{theme}</span>
                </button>
                <span className="expense-header__avatar" title={user?.email || accountName}>
                    {shouldShowAccountPhoto ? (
                        <img alt="" onError={() => setFailedAvatarUrl(accountPhotoUrl)} src={accountPhotoUrl} />
                    ) : (
                        avatarLabel
                    )}
                </span>
                <button
                    aria-label="Đăng xuất"
                    className="expense-header__logout"
                    disabled={isSigningOut}
                    onClick={handleLogout}
                    title="Đăng xuất"
                    type="button"
                >
                    <LogoutIcon size={17} />
                </button>
            </div>
        </header>
    );
}
