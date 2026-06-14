import MobileSettingsView from '../components/mobile/MobileSettingsView'

export default function SettingsPage({
    currency,
    hideBalance,
    notificationsEnabled,
    onLogout,
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
            onSettingChange={onSettingChange}
            onThemeChange={onThemeChange}
            settingsError={settingsError}
            theme={theme}
            user={user}
            wallets={wallets}
        />
    )
}
