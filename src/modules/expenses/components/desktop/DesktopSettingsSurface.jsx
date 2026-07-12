import SettingsContent from "../shared/SettingsContent";
import UserProfileCard from "../shared/UserProfileCard";

export default function DesktopSettingsSurface({ onUpdateDisplayName, ...settingsContentProps }) {
    return (
        <main className="desktop-settings-surface__content">
            <UserProfileCard onUpdateDisplayName={onUpdateDisplayName} />
            <SettingsContent {...settingsContentProps} />
        </main>
    );
}
