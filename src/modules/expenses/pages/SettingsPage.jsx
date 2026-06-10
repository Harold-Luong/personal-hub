import MobileSettingsView from '../components/mobile/MobileSettingsView'

export default function SettingsPage({
    onThemeChange,
    theme,
    wallets,
}) {
    return (
        <MobileSettingsView
            onThemeChange={onThemeChange}
            theme={theme}
            wallets={wallets}
        />
    )
}
