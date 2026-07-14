import { useState } from "react";
import { selectAuthUser, useAuthSessionStore } from "../../../../stores/authSessionStore";
import ExpenseIcon from "../../icon/ExpenseIcon";
import SectionCard from "./SectionCard";

export default function UserProfileCard({ onUpdateDisplayName }) {
    const user = useAuthSessionStore(selectAuthUser);
    const [displayName, setDisplayName] = useState(user?.displayName ?? "");
    const [failedPhotoUrl, setFailedPhotoUrl] = useState("");
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const profileName = user?.displayName || user?.email || "Tài khoản";
    const profilePhotoUrl = user?.photoURL || "";
    const shouldShowPhoto = profilePhotoUrl && failedPhotoUrl !== profilePhotoUrl;
    const avatarLabel = profileName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "TK";

    const cancelEditing = () => {
        setDisplayName(user?.displayName ?? "");
        setError("");
        setIsEditing(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const normalizedName = displayName.trim().replace(/\s+/g, " ");

        if (normalizedName.length < 2 || normalizedName.length > 60) {
            setError("Tên hiển thị cần có từ 2 đến 60 ký tự.");
            return;
        }

        setError("");
        setIsSaving(true);
        try {
            await onUpdateDisplayName(normalizedName);
            setIsEditing(false);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Không thể cập nhật tên hiển thị.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SectionCard actionLabel={null} className="settings-profile-card">
            <span className="settings-profile-card__avatar" aria-hidden="true">
                {shouldShowPhoto ? (
                    <img alt="" onError={() => setFailedPhotoUrl(profilePhotoUrl)} src={profilePhotoUrl} />
                ) : avatarLabel}
            </span>

            {isEditing ? (
                <form className="settings-profile-card__form" onSubmit={handleSubmit}>
                    <label htmlFor="settings-display-name">Tên hiển thị</label>
                    <div>
                        <input
                            autoFocus
                            disabled={isSaving}
                            id="settings-display-name"
                            maxLength={60}
                            onChange={(event) => setDisplayName(event.target.value)}
                            placeholder="Nhập tên hiển thị"
                            value={displayName}
                        />
                        <button aria-label="Hủy chỉnh sửa" disabled={isSaving} onClick={cancelEditing} title="Hủy" type="button">
                            <ExpenseIcon bare icon="close" size={17} />
                        </button>
                        <button disabled={isSaving} type="submit">{isSaving ? "Đang lưu" : "Lưu"}</button>
                    </div>
                    {error ? <small className="settings-profile-card__error" role="alert">{error}</small> : null}
                </form>
            ) : (
                <>
                    <span className="settings-profile-card__copy">
                        <strong>{profileName}</strong>
                        <small>{user?.email || "Quản lý tài chính cá nhân"}</small>
                    </span>
                    <button
                        className="settings-profile-card__edit"
                        onClick={() => {
                            setDisplayName(user?.displayName ?? "");
                            setError("");
                            setIsEditing(true);
                        }}
                        title="Đổi tên hiển thị"
                        type="button"
                    >
                        <ExpenseIcon bare icon="edit" size={17} />
                        <span className="settings-profile-card__edit-label">Chỉnh sửa</span>
                    </button>
                </>
            )}
        </SectionCard>
    );
}
