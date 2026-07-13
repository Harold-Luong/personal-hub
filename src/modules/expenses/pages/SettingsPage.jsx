import { useState } from "react";
import { selectAuthUid, useAuthSessionStore } from "../../../stores/authSessionStore";
import {
    selectExpensePreferences,
    selectExpenseSettingsError,
    useExpensePreferencesStore,
} from "../../../stores/expensePreferencesStore";
import { useExpenseDataStore } from "../../../stores/expenseDataStore";
import { updateAuthDisplayName } from "../../auth/api/authRepository";
import MobileSettingsSurface from "../components/mobile/MobileSettingsSurface";
import DesktopSettingsSurface from "../components/desktop/DesktopSettingsSurface";
import { createExpenseCsv, downloadExpenseCsv } from "../utils/expenseCsvUtils";

function moveItem(items, itemId, direction, groupKey) {
    const item = items.find((currentItem) => currentItem.id === itemId);
    const groupedItems = groupKey ? items.filter((currentItem) => currentItem[groupKey] === item?.[groupKey]) : items;
    const groupedIndex = groupedItems.findIndex((currentItem) => currentItem.id === itemId);
    const target = groupedItems[groupedIndex + direction];

    if (!item || !target) {
        return items;
    }

    const nextItems = [...items];
    const itemIndex = nextItems.findIndex((currentItem) => currentItem.id === item.id);
    const targetIndex = nextItems.findIndex((currentItem) => currentItem.id === target.id);
    [nextItems[itemIndex], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[itemIndex]];
    return nextItems;
}

function toggleId(ids = [], id) {
    return ids.includes(id) ? ids.filter((currentId) => currentId !== id) : [...ids, id];
}

export default function SettingsPage({
    categories = [],
    mode = "mobile",
    onBackToHub,
    onLogout,
    onManageBudget,
    onManageCategories,
    onManageWallet,
    wallets = [],
}) {
    const uid = useAuthSessionStore(selectAuthUid);
    const setAuthUser = useAuthSessionStore((state) => state.setAuthUser);
    const settings = useExpensePreferencesStore(selectExpensePreferences);
    const settingsError = useExpensePreferencesStore(selectExpenseSettingsError);
    const saveExpensePreference = useExpensePreferencesStore((state) => state.saveExpensePreference);
    const reorderCategories = useExpenseDataStore((state) => state.reorderExpenseCategories);
    const reorderWallets = useExpenseDataStore((state) => state.reorderExpenseWallets);
    const [isWorking, setIsWorking] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSettingChange = async (key, value) => {
        setMessage(null);
        try {
            await saveExpensePreference(uid, key, value);
        } catch {
            setMessage({ text: "Không thể lưu cài đặt. Vui lòng thử lại.", tone: "error" });
        }
    };

    const runTask = async (task, successText) => {
        setIsWorking(true);
        setMessage(null);
        try {
            await task();
            setMessage({ text: successText, tone: "success" });
        } catch (error) {
            setMessage({
                text: error instanceof Error ? error.message : "Không thể hoàn tất thao tác.",
                tone: "error",
            });
        } finally {
            setIsWorking(false);
        }
    };

    const handleMoveCategory = (categoryId, direction) => {
        const nextCategories = moveItem(categories, categoryId, direction, "type");
        return runTask(
            () => reorderCategories(uid, nextCategories.map((category) => category.id)),
            "Đã cập nhật thứ tự danh mục.",
        );
    };

    const handleMoveWallet = (walletId, direction) => {
        const nextWallets = moveItem(wallets, walletId, direction);
        return runTask(
            () => reorderWallets(uid, nextWallets.map((wallet) => wallet.id)),
            "Đã cập nhật thứ tự ví.",
        );
    };

    const handleSetDefaultWallet = (walletId) => runTask(
        () => saveExpensePreference(uid, "defaultWalletId", walletId),
        "Đã chọn ví mặc định.",
    );

    const handleExport = () => runTask(async () => {
        const { getAllExpenseTransactions } = await import("../api/transactionsRepository");
        const transactions = await getAllExpenseTransactions(uid);
        const date = new Date().toISOString().slice(0, 10);
        downloadExpenseCsv(createExpenseCsv(transactions), `expense-transactions-${date}.csv`);
    }, "Đã xuất dữ liệu CSV.");

    const contentProps = {
        categories,
        isWorking,
        message: message ?? (settingsError ? { text: settingsError, tone: "error" } : null),
        onExport: handleExport,
        onMoveCategory: handleMoveCategory,
        onMoveWallet: handleMoveWallet,
        onSetDefaultCategory: (categoryId) => handleSettingChange("defaultCategoryId", categoryId),
        onSetDefaultWallet: handleSetDefaultWallet,
        onSettingChange: handleSettingChange,
        onToggleCategory: (categoryId) => handleSettingChange(
            "hiddenCategoryIds",
            toggleId(settings.hiddenCategoryIds, categoryId),
        ),
        onToggleWallet: (walletId) => handleSettingChange(
            "hiddenWalletIds",
            toggleId(settings.hiddenWalletIds, walletId),
        ),
        settings,
        wallets,
    };

    const handleUpdateDisplayName = async (displayName) => {
        const updatedUser = await updateAuthDisplayName(displayName);
        setAuthUser(updatedUser);
    };

    if (mode === "desktop") {
        return <DesktopSettingsSurface {...contentProps} onUpdateDisplayName={handleUpdateDisplayName} />;
    }

    return (
        <MobileSettingsSurface
            {...contentProps}
            hideBalance={settings.hideBalance}
            notificationsEnabled={settings.notificationsEnabled}
            onBackToHub={onBackToHub}
            onLogout={onLogout}
            onManageBudget={onManageBudget}
            onManageCategories={onManageCategories}
            onManageWallet={onManageWallet}
            onThemeChange={(theme) => handleSettingChange("theme", theme)}
            onUpdateDisplayName={handleUpdateDisplayName}
            theme={settings.theme}
        />
    );
}
