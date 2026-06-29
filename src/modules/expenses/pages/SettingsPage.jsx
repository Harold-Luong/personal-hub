import MobileSettingsView from "../components/mobile/MobileSettingsView";

export default function SettingsPage({
    currency,
    hideBalance,
    notificationsEnabled,
    onLogout,
    onManageBudget,
    onManageWallet,
    onSettingChange,
    onThemeChange,
    settingsError,
    theme,
    user,
    wallets,
}) {
    return (
        <MobileSettingsView
            currency={currency}
            hideBalance={hideBalance}
            notificationsEnabled={notificationsEnabled}
            onLogout={onLogout}
            onManageBudget={onManageBudget}
            onManageWallet={onManageWallet}
            onSettingChange={onSettingChange}
            onThemeChange={onThemeChange}
            settingsError={settingsError}
            theme={theme}
            user={user}
            wallets={wallets}
        />
    );
}
