import { useState } from "react";
import { expenseThemeOptions } from "../../constants/expenseMetadata";
import MobilePageHeader from "./MobilePageHeader";
import SectionCard from "../shared/SectionCard";
import SettingsContent from "../shared/SettingsContent";
import ExpenseIcon from "../../icon/ExpenseIcon";
import UserProfileCard from "../shared/UserProfileCard";

function SettingsSwitch({ checked, description, label, onChange }) {
    return (
        <div className="mobile-settings-surface__preference">
            <span>
                <strong>{label}</strong>
                <small>{description}</small>
            </span>
            <button
                aria-checked={checked}
                aria-label={label}
                className={`mobile-settings-surface__switch${checked ? " is-active" : ""}`}
                onClick={() => onChange(!checked)}
                role="switch"
                type="button"
            >
                <span />
            </button>
        </div>
    );
}

export default function MobileSettingsSurface({
    categories,
    hideBalance,
    isWorking,
    message,
    notificationsEnabled,
    onBackToHub,
    onExport,
    onLogout,
    onManageBudget,
    onManageCategories,
    onManageSavings,
    onManageWallet,
    onMoveCategory,
    onMoveWallet,
    onSetDefaultCategory,
    onSetDefaultWallet,
    onSettingChange,
    onThemeChange,
    onToggleCategory,
    onToggleWallet,
    onUpdateDisplayName,
    settings,
    theme,
    wallets = [],
}) {
    const [logoutError, setLogoutError] = useState("");
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        <main className="mobile-settings-surface">
            <MobilePageHeader className="mobile-settings-surface__header" title="Cài đặt" titleTag="h1" />

            <UserProfileCard onUpdateDisplayName={onUpdateDisplayName} />

            <section className="mobile-settings-surface__section">
                <div className="mobile-settings-surface__section-heading">
                    <span className="mobile-settings-surface__section-icon">
                        <ExpenseIcon bare icon="theme" label="Giao diện" size={18} />
                    </span>
                    <span>
                        <h2>Giao diện</h2>
                        <p>Chọn màu sắc phù hợp với bạn</p>
                    </span>
                </div>

                <SectionCard actionLabel={null} as="div" className="mobile-settings-surface__themes">
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
                            <span className="mobile-settings-surface__theme-swatch" />
                            <span>{themeOption.label}</span>
                        </button>
                    ))}
                </SectionCard>
            </section>

            <section className="mobile-settings-surface__section">
                <div className="mobile-settings-surface__section-heading">
                    <span className="mobile-settings-surface__section-icon">
                        <ExpenseIcon bare icon="settings" label="Tùy chọn" size={18} />
                    </span>
                    <span>
                        <h2>Tùy chọn</h2>
                        <p>Cá nhân hóa trải nghiệm sử dụng</p>
                    </span>
                </div>

                <SectionCard actionLabel={null} as="div" className="mobile-settings-surface__preferences">
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
                </SectionCard>
            </section>

            <section className="mobile-settings-surface__section">
                <div className="mobile-settings-surface__section-heading">
                    <span className="mobile-settings-surface__section-icon">
                        <ExpenseIcon bare icon="category" label="Quản lý nhanh" size={18} />
                    </span>
                    <span>
                        <h2>Quản lý nhanh</h2>
                        <p>Các màn hình không có trong thanh điều hướng</p>
                    </span>
                </div>

                <SectionCard actionLabel={null} as="div" className="mobile-settings-surface__management">
                    <button onClick={onBackToHub} type="button">
                        <ExpenseIcon icon="app" label="Personal Hub" />
                        <span className="mobile-settings-surface__management-copy">
                            <strong>Personal Hub</strong>
                            <small>Chuyển sang Expenses, Quotes và các module khác</small>
                        </span>
                        <span aria-hidden="true">&gt;</span>
                    </button>
                    <button onClick={onManageBudget} type="button">
                        <ExpenseIcon icon="income" label="Ngân sách" />
                        <span className="mobile-settings-surface__management-copy">
                            <strong>Ngân sách tháng</strong>
                            <small>Thiết lập hạn mức theo danh mục</small>
                        </span>
                        <span aria-hidden="true">&gt;</span>
                    </button>
                    <button onClick={onManageSavings} type="button">
                        <ExpenseIcon icon="saving" label="Tiết kiệm" />
                        <span className="mobile-settings-surface__management-copy">
                            <strong>Tiết kiệm</strong>
                            <small>Chuyển khoản dư ngân sách tháng trước</small>
                        </span>
                        <span aria-hidden="true">&gt;</span>
                    </button>
                    <button onClick={onManageWallet} type="button">
                        <ExpenseIcon icon="wallet" label="Ví tiền" />
                        <span className="mobile-settings-surface__management-copy">
                            <strong>Ví của tôi</strong>
                            <small>{wallets.length} ví đang hoạt động</small>
                        </span>
                        <span aria-hidden="true">&gt;</span>
                    </button>
                    <button onClick={onManageCategories} type="button">
                        <ExpenseIcon icon="category" label="Danh mục" />
                        <span className="mobile-settings-surface__management-copy">
                            <strong>Danh mục chi tiêu</strong>
                            <small>Xem phân tích và ngân sách danh mục</small>
                        </span>
                        <span aria-hidden="true">&gt;</span>
                    </button>
                </SectionCard>
            </section>

            <SettingsContent
                categories={categories}
                isWorking={isWorking}
                message={message}
                onExport={onExport}
                onMoveCategory={onMoveCategory}
                onMoveWallet={onMoveWallet}
                onSetDefaultCategory={onSetDefaultCategory}
                onSetDefaultWallet={onSetDefaultWallet}
                onSettingChange={onSettingChange}
                onToggleCategory={onToggleCategory}
                onToggleWallet={onToggleWallet}
                settings={settings}
                wallets={wallets}
            />

            <section className="mobile-settings-surface__section">
                <div className="mobile-settings-surface__section-heading">
                    <span className="mobile-settings-surface__section-icon">
                        <ExpenseIcon bare icon="app" label="Ứng dụng" size={18} />
                    </span>
                    <span>
                        <h2>Ứng dụng</h2>
                        <p>MoneyCare</p>
                    </span>
                </div>
                <SectionCard actionLabel={null} as="div" className="mobile-settings-surface__about">
                    <span>Phiên bản</span>
                    <strong>1.0.0</strong>
                </SectionCard>
            </section>

            <button
                className="mobile-settings-surface__logout"
                onClick={() => {
                    setLogoutError("");
                    setShowLogoutConfirm(true);
                }}
                type="button"
            >
                <ExpenseIcon appearance="base" bare icon="logout" size={19} />
                <span>
                    <strong>Đăng xuất</strong>
                    <small>Thoát khỏi tài khoản hiện tại</small>
                </span>
            </button>

            {showLogoutConfirm ? (
                <div
                    className="mobile-settings-surface__dialog-backdrop"
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
                        className="mobile-settings-surface__dialog"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                    >
                        <span className="mobile-settings-surface__dialog-icon">
                            <ExpenseIcon appearance="base" bare icon="logout" size={22} />
                        </span>
                        <h2 id="logout-dialog-title">Đăng xuất tài khoản?</h2>
                        <p>Bạn cần đăng nhập lại để tiếp tục quản lý chi tiêu.</p>
                        {logoutError ? (
                            <p className="mobile-settings-surface__dialog-error" role="alert">
                                {logoutError}
                            </p>
                        ) : null}
                        <div className="mobile-settings-surface__dialog-actions">
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
