import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
    expenseAmountFormatIds,
    expenseCurrencyLabels,
    expenseDateFormatIds,
    expenseDefaultAmountFormat,
    expenseDefaultCurrency,
    expenseDefaultDateFormat,
    expenseDefaultTheme,
    expenseThemeIds,
} from "../modules/expenses/constants/expenseMetadata";
import {
    expenseDefaultIconSet,
    expenseIconSetIdValues,
} from "../modules/expenses/icon/iconSets";

const defaultExpensePreferences = {
    amountFormat: expenseDefaultAmountFormat,
    currency: expenseDefaultCurrency,
    dateFormat: expenseDefaultDateFormat,
    defaultCategoryId: null,
    defaultWalletId: null,
    hideBalance: false,
    hiddenCategoryIds: [],
    hiddenWalletIds: [],
    iconSet: expenseDefaultIconSet,
    notificationsEnabled: true,
    theme: expenseDefaultTheme,
};

const settingRevisions = {};
let settingsWriteQueue = Promise.resolve();

/**
 * Chuẩn hóa các cài đặt chi tiêu để đảm bảo chúng có giá trị hợp lệ.
 * Nếu một cài đặt không hợp lệ, nó sẽ được thay thế bằng giá trị mặc định. 
 * @param {*} preferences 
 * @returns {{ currency: string, hideBalance: boolean, notificationsEnabled: boolean, theme: string }}
 */
function normalizeExpensePreferences(preferences = {}) {
    const normalizeIds = (value) => Array.isArray(value)
        ? [...new Set(value.filter((id) => typeof id === "string" && id.trim()))]
        : [];

    return {
        amountFormat: expenseAmountFormatIds.includes(preferences.amountFormat)
            ? preferences.amountFormat
            : defaultExpensePreferences.amountFormat,
        currency: expenseCurrencyLabels.includes(preferences.currency)
            ? preferences.currency
            : defaultExpensePreferences.currency,
        dateFormat: expenseDateFormatIds.includes(preferences.dateFormat)
            ? preferences.dateFormat
            : defaultExpensePreferences.dateFormat,
        defaultCategoryId:
            typeof preferences.defaultCategoryId === "string" && preferences.defaultCategoryId.trim()
                ? preferences.defaultCategoryId
                : null,
        defaultWalletId:
            typeof preferences.defaultWalletId === "string" && preferences.defaultWalletId.trim()
                ? preferences.defaultWalletId
                : null,
        hideBalance:
            typeof preferences.hideBalance === "boolean"
                ? preferences.hideBalance
                : defaultExpensePreferences.hideBalance,
        notificationsEnabled:
            typeof preferences.notificationsEnabled === "boolean"
                ? preferences.notificationsEnabled
                : defaultExpensePreferences.notificationsEnabled,
        hiddenCategoryIds: normalizeIds(preferences.hiddenCategoryIds),
        hiddenWalletIds: normalizeIds(preferences.hiddenWalletIds),
        iconSet: expenseIconSetIdValues.includes(preferences.iconSet)
            ? preferences.iconSet
            : defaultExpensePreferences.iconSet,
        theme: expenseThemeIds.includes(preferences.theme)
            ? preferences.theme
            : defaultExpensePreferences.theme,
    };
}

/**
 * Store để quản lý các cài đặt chi tiêu của người dùng.
 * @typedef {Object} ExpensePreferencesStore
 * @property {{ currency: string, hideBalance: boolean, notificationsEnabled: boolean, theme: string }} confirmedExpensePreferences - Các cài đặt chi tiêu đã được xác nhận.
 * @property {{ currency: string, hideBalance: boolean, notificationsEnabled: boolean, theme: string }} expensePreferences - Các cài đặt chi tiêu hiện tại.
 * @property {string} settingsError - Thông báo lỗi khi lưu cài đặt chi tiêu.
 * @property {Function} initializeExpensePreferences - Hàm để khởi tạo các cài đặt chi tiêu.
 * @property {Function} resetExpensePreferences - Hàm để đặt lại các cài đặt chi tiêu về mặc định.
 * @property {Function} setExpensePreferences - Hàm để thiết lập các cài đặt chi tiêu.
 * @property {Function} updateExpensePreference - Hàm để cập nhật một cài đặt chi tiêu cụ thể.
 * @property {Function} saveExpensePreference - Hàm để lưu một cài đặt chi tiêu cụ thể vào cơ sở dữ liệu.
 * @property {Function} waitForExpensePreferenceWrites - Hàm để chờ tất cả các ghi cài đặt chi tiêu hoàn tất.
 */
export const useExpensePreferencesStore = create(
    // Persist middleware để lưu trữ các cài đặt chi tiêu vào localStorage
    persist(
        (set) => ({
            confirmedExpensePreferences: defaultExpensePreferences,
            expensePreferences: defaultExpensePreferences,
            settingsError: "",

            // Khởi tạo các cài đặt chi tiêu từ dữ liệu đã lưu hoặc mặc định
            initializeExpensePreferences: (preferences) => {
                const expensePreferences = normalizeExpensePreferences(preferences);

                set({
                    confirmedExpensePreferences: expensePreferences,
                    expensePreferences: expensePreferences,
                    settingsError: "",
                });
            },

            // Đặt lại các cài đặt chi tiêu về mặc định
            resetExpensePreferences: () => {
                set({
                    confirmedExpensePreferences: defaultExpensePreferences,
                    expensePreferences: defaultExpensePreferences,
                    settingsError: "",
                });
            },

            // Thiết lập các cài đặt chi tiêu
            setExpensePreferences: (preferences) => {
                const expensePreferences = normalizeExpensePreferences(preferences);

                set({
                    confirmedExpensePreferences: expensePreferences,
                    expensePreferences: expensePreferences,
                });
            },

            // Cập nhật một cài đặt chi tiêu cụ thể
            updateExpensePreference: (key, value) => {
                set((state) => ({
                    expensePreferences: normalizeExpensePreferences({
                        ...state.expensePreferences,
                        [key]: value,
                    }),
                }));
            },

            // Lưu một cài đặt chi tiêu cụ thể vào cơ sở dữ liệu
            saveExpensePreference: (uid, key, value) => {
                const currentPreference = useExpensePreferencesStore.getState().expensePreferences[key];

                if (!uid || value === currentPreference) {
                    return settingsWriteQueue;
                }

                const revision = (settingRevisions[key] ?? 0) + 1;
                settingRevisions[key] = revision;

                set((state) => ({
                    expensePreferences: normalizeExpensePreferences({
                        ...state.expensePreferences,
                        [key]: value,
                    }),
                    settingsError: "",
                }));

                const writePromise = settingsWriteQueue
                    .catch(() => { })
                    .then(async () => {
                        const { updateExpenseSettings } = await import("../modules/expenses/api/expenseSettingsRepository");

                        await updateExpenseSettings(uid, {
                            [key]: value,
                        });

                        set((state) => ({
                            confirmedExpensePreferences: normalizeExpensePreferences({
                                ...state.confirmedExpensePreferences,
                                [key]: value,
                            }),
                        }));
                    });

                settingsWriteQueue = writePromise;

                writePromise.catch(() => {
                    if (settingRevisions[key] !== revision) {
                        return;
                    }

                    const confirmedValue = useExpensePreferencesStore.getState().confirmedExpensePreferences[key];

                    set((state) => ({
                        expensePreferences: normalizeExpensePreferences({
                            ...state.expensePreferences,
                            [key]: confirmedValue,
                        }),
                        settingsError: "Không thể lưu cài đặt. Vui lòng kiểm tra kết nối và thử lại.",
                    }));
                });

                return writePromise;
            },

            // Chờ tất cả các ghi cài đặt chi tiêu hoàn tất
            waitForExpensePreferenceWrites: () => settingsWriteQueue.catch(() => { }),
        }),
        // Cấu hình persist để lưu trữ các cài đặt chi tiêu vào localStorage
        {
            name: "personal-hub:expense-preferences",
            partialize: (state) => ({
                expensePreferences: state.expensePreferences,
            }),
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

export const selectExpensePreferences = (state) => state.expensePreferences;
export const selectExpenseIconSet = (state) => state.expensePreferences.iconSet;
export const selectExpenseSettingsError = (state) => state.settingsError;
