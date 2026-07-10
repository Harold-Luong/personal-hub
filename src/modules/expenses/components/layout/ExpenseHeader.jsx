import { useState } from "react";
import { selectAuthUser, useAuthSessionStore } from "../../../../stores/authSessionStore";
import { expenseDefaultTheme } from "../../constant/expensesMetaData";
import { expenseUiText } from "../../constant/expensesUiMetaData";
import { LogoutIcon, PlusIcon, ThemeIcon } from "../../icon/ExpenseIcons";
import ExpenseButton from "../shared/ExpenseButton";

export default function ExpenseHeader({
    className = "",
    // eyebrow,
    onAddTransactionClick,
    onLogout,
    onToggleTheme,
    pageActions,
    subtitle,
    theme = expenseDefaultTheme,
    title,
}) {
    const user = useAuthSessionStore(selectAuthUser);
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
                <ExpenseButton
                    ariaLabel={expenseUiText.actions.ADD_TRANSACTION}
                    className="expense-header__add"
                    icon={PlusIcon}
                    iconSize={17}
                    label={expenseUiText.actions.ADD_TRANSACTION}
                    labelTag="span"
                    onClick={onAddTransactionClick}
                />
                <ExpenseButton
                    ariaLabel={expenseUiText.actions.TOGGLE_THEME}
                    className="expense-theme-toggle"
                    icon={ThemeIcon}
                    label={theme}
                    labelTag="span"
                    onClick={onToggleTheme}
                />
                <span className="expense-header__avatar" title={user?.email || accountName}>
                    {shouldShowAccountPhoto ? (
                        <img alt="" onError={() => setFailedAvatarUrl(accountPhotoUrl)} src={accountPhotoUrl} />
                    ) : (
                        avatarLabel
                    )}
                </span>
                <ExpenseButton
                    ariaLabel={expenseUiText.actions.LOGOUT}
                    className="expense-header__logout"
                    disabled={isSigningOut}
                    icon={LogoutIcon}
                    iconSize={17}
                    onClick={handleLogout}
                    title={expenseUiText.actions.LOGOUT}
                />
            </div>
        </header>
    );
}
