import { useState } from "react";
import { selectAuthUser, useAuthSessionStore } from "../../../../stores/authSessionStore";
import { BellIcon, LogoutIcon, SettingsIcon, ThemeIcon, WalletIcon } from "../../icon/ExpenseIcons";
import { expenseCurrencyLabels, expenseThemeOptions } from "../../constant/expensesMetaData";
import MobilePageHeader from "./MobilePageHeader";
import SectionCard from "../shared/SectionCard";

function SettingsSwitch({ checked, description, label, onChange }) {
    return (
        <div className="mobile-settings-view__preference">
            <span>
                <strong>{label}</strong>
                <small>{description}</small>
            </span>
            <button
                aria-checked={checked}
                aria-label={label}
                className={`mobile-settings-view__switch${checked ? " is-active" : ""}`}
                onClick={() => onChange(!checked)}
                role="switch"
                type="button"
            >
                <span />
            </button>
        </div>
    );
}

export default function MobileSettingsView({
    currency,
    hideBalance,
    notificationsEnabled,
    onLogout,
    onManageBudget,
    onManageCategories,
    onManageWallet,
    onSettingChange,
    onThemeChange,
    settingsError,
    theme,
    wallets = [],
}) {
    const user = useAuthSessionStore(selectAuthUser);
    const [logoutError, setLogoutError] = useState("");
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [failedProfilePhotoUrl, setFailedProfilePhotoUrl] = useState("");
    const profileName = user?.displayName || user?.email || "Tài khoản";
    const profilePhotoUrl = user?.photoURL || "";
    const shouldShowProfilePhoto = profilePhotoUrl && failedProfilePhotoUrl !== profilePhotoUrl;
    const avatarLabel = profileName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    const handleLogout = async () => {
        setLogoutError("");
        setIsSigningOut(true);

        try {
            await onLogout?.();
        } catch {
            setLogoutError("Không thể đăng xuất. Vui lòng thử lại.");
            setIsSigningOut(false);
        }
    };

    return (
        <main className="mobile-settings-view">
            <MobilePageHeader className="mobile-settings-view__header" title="Cài đặt" titleTag="h1" />

            <SectionCard actionLabel={null} className="mobile-settings-view__profile">
                <span className="mobile-settings-view__avatar" aria-hidden="true">
                    {shouldShowProfilePhoto ? (
                        <img alt="" onError={() => setFailedProfilePhotoUrl(profilePhotoUrl)} src={profilePhotoUrl} />
                    ) : (
                        avatarLabel || "TK"
                    )}
                </span>
                <span className="mobile-settings-view__profile-copy">
                    <strong>{profileName}</strong>
                    <small>{user?.email || "Quản lý tài chính cá nhân"}</small>
                </span>
                <span className="mobile-settings-view__status">Cá nhân</span>
            </SectionCard>

            {settingsError ? (
                <p className="mobile-settings-view__settings-error" role="alert">
                    {settingsError}
                </p>
            ) : null}

            <section className="mobile-settings-view__section">
                <div className="mobile-settings-view__section-heading">
                    <span className="mobile-settings-view__section-icon">
                        <ThemeIcon size={18} />
                    </span>
                    <span>
                        <h2>Giao diện</h2>
                        <p>Chọn màu sắc phù hợp với bạn</p>
                    </span>
                </div>

                <SectionCard actionLabel={null} as="div" className="mobile-settings-view__themes">
                    {expenseThemeOptions.map((themeOption) => (
                        <button
                            aria-pressed={theme === themeOption.id}
                            className={theme === themeOption.id ? "is-active" : ""}
                            key={themeOption.id}
                            onClick={() => onThemeChange?.(themeOption.id)}
                            style={{
                                "--settings-theme-accent": themeOption.accent,
                                "--settings-theme-color": themeOption.color,
                            }}
                            type="button"
                        >
                            <span className="mobile-settings-view__theme-swatch" />
                            <span>{themeOption.label}</span>
                        </button>
                    ))}
                </SectionCard>
            </section>

            <section className="mobile-settings-view__section">
                <div className="mobile-settings-view__section-heading">
                    <span className="mobile-settings-view__section-icon">
                        <SettingsIcon size={18} />
                    </span>
                    <span>
                        <h2>Tùy chọn</h2>
                        <p>Cá nhân hóa trải nghiệm sử dụng</p>
                    </span>
                </div>

                <SectionCard actionLabel={null} as="div" className="mobile-settings-view__preferences">
                    <SettingsSwitch
                        checked={notificationsEnabled}
                        description="Nhắc nhở ngân sách và giao dịch"
                        label="Thông báo"
                        onChange={(value) => onSettingChange?.("notificationsEnabled", value)}
                    />
                    <SettingsSwitch
                        checked={hideBalance}
                        description="Ẩn số dư khi mở ứng dụng"
                        label="Ẩn số dư"
                        onChange={(value) => onSettingChange?.("hideBalance", value)}
                    />
                    <label className="mobile-settings-view__preference">
                        <span>
                            <strong>Đơn vị tiền tệ</strong>
                            <small>Dùng để hiển thị các khoản tiền</small>
                        </span>
                        <select
                            aria-label="Đơn vị tiền tệ"
                            onChange={(event) => onSettingChange?.("currency", event.target.value)}
                            value={currency}
                        >
                            {expenseCurrencyLabels.map((currencyLabel) => (
                                <option key={currencyLabel} value={currencyLabel}>
                                    {currencyLabel}
                                </option>
                            ))}
                        </select>
                    </label>
                </SectionCard>
            </section>

            <section className="mobile-settings-view__section">
                <div className="mobile-settings-view__section-heading">
                    <span className="mobile-settings-view__section-icon">
                        <WalletIcon size={18} />
                    </span>
                    <span>
                        <h2>Quản lý</h2>
                        <p>Dữ liệu tài chính của bạn</p>
                    </span>
                </div>

                <SectionCard actionLabel={null} as="div" className="mobile-settings-view__management">
                    <button onClick={onManageBudget} type="button">
                        <span>
                            <strong>Ngân sách tháng</strong>
                            <small>Thiết lập hạn mức theo danh mục</small>
                        </span>
                        <span aria-hidden="true">&gt;</span>
                    </button>
                    <button onClick={onManageWallet} type="button">
                        <span>
                            <strong>Ví của tôi</strong>
                            <small>{wallets.length} ví đang hoạt động</small>
                        </span>
                        <span aria-hidden="true">&gt;</span>
                    </button>
                    <button onClick={onManageCategories} type="button">
                        <span>
                            <strong>Danh mục</strong>
                            <small>Tùy chỉnh danh mục thu chi</small>
                        </span>
                        <span aria-hidden="true">&gt;</span>
                    </button>
                    <div>
                        <span>
                            <strong>Sao lưu dữ liệu</strong>
                            <small>Xuất và khôi phục dữ liệu</small>
                        </span>
                        <span aria-hidden="true">&gt;</span>
                    </div>
                </SectionCard>
            </section>

            <section className="mobile-settings-view__section">
                <div className="mobile-settings-view__section-heading">
                    <span className="mobile-settings-view__section-icon">
                        <BellIcon size={18} />
                    </span>
                    <span>
                        <h2>Ứng dụng</h2>
                        <p>Personal Hub Expenses</p>
                    </span>
                </div>
                <SectionCard actionLabel={null} as="div" className="mobile-settings-view__about">
                    <span>Phiên bản</span>
                    <strong>1.0.0</strong>
                </SectionCard>
            </section>

            <button
                className="mobile-settings-view__logout"
                onClick={() => {
                    setLogoutError("");
                    setShowLogoutConfirm(true);
                }}
                type="button"
            >
                <LogoutIcon size={19} />
                <span>
                    <strong>Đăng xuất</strong>
                    <small>Thoát khỏi tài khoản hiện tại</small>
                </span>
            </button>

            {showLogoutConfirm ? (
                <div
                    className="mobile-settings-view__dialog-backdrop"
                    onClick={() => {
                        if (!isSigningOut) {
                            setShowLogoutConfirm(false);
                        }
                    }}
                    role="presentation"
                >
                    <div
                        aria-labelledby="logout-dialog-title"
                        aria-modal="true"
                        className="mobile-settings-view__dialog"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                    >
                        <span className="mobile-settings-view__dialog-icon">
                            <LogoutIcon size={22} />
                        </span>
                        <h2 id="logout-dialog-title">Đăng xuất tài khoản?</h2>
                        <p>Bạn cần đăng nhập lại để tiếp tục quản lý chi tiêu.</p>
                        {logoutError ? (
                            <p className="mobile-settings-view__dialog-error" role="alert">
                                {logoutError}
                            </p>
                        ) : null}
                        <div className="mobile-settings-view__dialog-actions">
                            <button disabled={isSigningOut} onClick={() => setShowLogoutConfirm(false)} type="button">
                                Hủy
                            </button>
                            <button disabled={isSigningOut} onClick={handleLogout} type="button">
                                {isSigningOut ? "Đang thoát..." : "Đăng xuất"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}
