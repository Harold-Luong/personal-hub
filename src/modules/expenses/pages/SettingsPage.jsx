import MobileSettingsView from '../components/mobile/MobileSettingsView'

export default function SettingsPage({
    onLogout,
    onThemeChange,
    theme,
    user,
    wallets,
}) {
    return (
        <MobileSettingsView
            onLogout={onLogout}
            onThemeChange={onThemeChange}
            theme={theme}
            user={user}
            wallets={wallets}
        />
    )
}
