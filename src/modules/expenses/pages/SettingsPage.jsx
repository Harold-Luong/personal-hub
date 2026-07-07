import { selectAuthUid, useAuthSessionStore } from "../../../stores/authSessionStore";
import {
    selectExpensePreferences,
    selectExpenseSettingsError,
    useExpensePreferencesStore,
} from "../../../stores/expensePreferencesStore";
import MobileSettingsView from "../components/mobile/MobileSettingsView";

export default function SettingsPage({
    onLogout,
    onManageBudget,
    onManageWallet,
    wallets,
}) {
    const uid = useAuthSessionStore(selectAuthUid);
    const settings = useExpensePreferencesStore(selectExpensePreferences);
    const settingsError = useExpensePreferencesStore(selectExpenseSettingsError);
    const saveExpensePreference = useExpensePreferencesStore((state) => state.saveExpensePreference);
    const handleSettingChange = (key, value) => {
        saveExpensePreference(uid, key, value);
    };

    return (
        <MobileSettingsView
            currency={settings.currency}
            hideBalance={settings.hideBalance}
            notificationsEnabled={settings.notificationsEnabled}
            onLogout={onLogout}
            onManageBudget={onManageBudget}
            onManageWallet={onManageWallet}
            onSettingChange={handleSettingChange}
            onThemeChange={(theme) => handleSettingChange("theme", theme)}
            settingsError={settingsError}
            theme={settings.theme}
            wallets={wallets}
        />
    );
}
