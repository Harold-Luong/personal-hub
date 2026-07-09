import {
    doc,
    getDocFromServer,
    runTransaction,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firestore";
import {
    expenseCurrencyLabels,
    expenseDefaultCurrency,
    expenseDefaultTheme,
    expenseDefaultTimezone,
    expenseDefaultWalletId,
    expenseDefaultWalletTypeId,
    expenseDefaultWalletTypeMeta,
    expenseThemeIds,
} from "../constant/expensesMetaData";

const defaultWalletId = expenseDefaultWalletId;
const defaultExpenseCategories = [
    {
        id: "food",
        name: "Ăn uống",
        type: "expense",
        icon: "utensils",
        color: "#f4a340",
    },
    {
        id: "home",
        name: "Nhà cửa",
        type: "expense",
        icon: "home",
        color: "#4f93d7",
    },
    {
        id: "transport",
        name: "Di chuyển",
        type: "expense",
        icon: "bus",
        color: "#56b879",
    },
    {
        id: "shopping",
        name: "Mua sắm",
        type: "expense",
        icon: "bag",
        color: "#ef6f7e",
    },
    {
        id: "health",
        name: "Sức khỏe",
        type: "expense",
        icon: "health",
        color: "#d08c7a",
    },
    {
        id: "education",
        name: "Giáo dục",
        type: "expense",
        icon: "education",
        color: "#8797b2",
    },
    {
        id: "fun",
        name: "Giải trí",
        type: "expense",
        icon: "game",
        color: "#9b7bd8",
    },
    {
        id: "family",
        name: "Gia đình",
        type: "expense",
        icon: "family",
        color: "#e0b88a",
    },
    {
        id: "finance",
        name: "Tài chính",
        type: "expense",
        icon: "finance",
        color: "#6b8f71",
    },
    {
        id: "work",
        name: "Công việc",
        type: "expense",
        icon: "work",
        color: "#8fa6ac",
    },
    {
        id: "travel",
        name: "Du lịch",
        type: "expense",
        icon: "travel",
        color: "#d9a441",
    },
    {
        id: "bills",
        name: "Hóa đơn",
        type: "expense",
        icon: "bill",
        color: "#7aa6c2",
    },
    {
        id: "personal-care",
        name: "Cá nhân",
        type: "expense",
        icon: "user",
        color: "#c58bb5",
    },
    {
        id: "pets",
        name: "Thú cưng",
        type: "expense",
        icon: "pet",
        color: "#c49a6c",
    },
    {
        id: "gifts",
        name: "Quà tặng",
        type: "expense",
        icon: "gift",
        color: "#e28c8c",
    },
    {
        id: "charity",
        name: "Từ thiện",
        type: "expense",
        icon: "heart",
        color: "#de8fb0",
    },
    {
        id: "subscription",
        name: "Đăng ký",
        type: "expense",
        icon: "subscription",
        color: "#8f8bd8",
    },
    {
        id: "tax",
        name: "Thuế & phí",
        type: "expense",
        icon: "receipt",
        color: "#9aa0a6",
    },
    {
        id: "expense-other",
        name: "Chi tiêu khác",
        type: "expense",
        icon: "more",
        color: "#b8bec8",
    },
];

const defaultIncomeCategories = [
    {
        id: "salary",
        name: "Lương",
        type: "income",
        icon: "wallet",
        color: "#56b879",
    },
    {
        id: "bonus",
        name: "Thưởng",
        type: "income",
        icon: "income",
        color: "#d9a441",
    },
    {
        id: "freelance",
        name: "Làm thêm",
        type: "income",
        icon: "work",
        color: "#4f93d7",
    },
    {
        id: "investment-income",
        name: "Đầu tư",
        type: "income",
        icon: "finance",
        color: "#6b8f71",
    },
    {
        id: "interest",
        name: "Lãi tiết kiệm",
        type: "income",
        icon: "saving",
        color: "#9b7bd8",
    },
    {
        id: "business",
        name: "Kinh doanh",
        type: "income",
        icon: "shop",
        color: "#4f93d7",
    },
    {
        id: "gift-income",
        name: "Được cho/tặng",
        type: "income",
        icon: "gift",
        color: "#e0b88a",
    },
    {
        id: "refund",
        name: "Hoàn tiền",
        type: "income",
        icon: "refund",
        color: "#56b879",
    },
    {
        id: "rental-income",
        name: "Cho thuê",
        type: "income",
        icon: "home",
        color: "#8797b2",
    }, {
        id: "income-other",
        name: "Thu nhập khác",
        type: "income",
        icon: "income",
        color: "#b8bec8",
    },
];

const defaultCategories = [
    ...defaultExpenseCategories,
    ...defaultIncomeCategories,
];

const defaultExpenseSettings = {
    theme: expenseDefaultTheme,
    currency: expenseDefaultCurrency,
    timezone: expenseDefaultTimezone,
    hideBalance: false,
    notificationsEnabled: true,
    defaultWalletId,
};

const userDataInitializationRequests = new Map();

function isAlreadyExistsError(error) {
    return (
        error?.code === "already-exists" ||
        error?.message?.includes("already-exists")
    );
}

function validateExpenseSetting(key, value) {
    if (key === "theme" && !expenseThemeIds.includes(value)) {
        throw new Error(`Unsupported expense theme: ${value}.`);
    }

    if (key === "currency" && !expenseCurrencyLabels.includes(value)) {
        throw new Error(`Unsupported expense currency: ${value}.`);
    }

    if (
        (key === "hideBalance" || key === "notificationsEnabled") &&
        typeof value !== "boolean"
    ) {
        throw new Error(`${key} must be a boolean.`);
    }

    if (
        key === "timezone" &&
        (typeof value !== "string" || value.trim().length === 0)
    ) {
        throw new Error("timezone must be a non-empty string.");
    }

    if (
        key === "defaultWalletId" &&
        value !== null &&
        (typeof value !== "string" || value.trim().length === 0)
    ) {
        throw new Error("defaultWalletId must be a non-empty string or null.");
    }
}

function validateExpenseSettings(settings, { allowEmpty = false } = {}) {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
        throw new Error("Expense settings must be an object.");
    }

    const entries = Object.entries(settings);

    if (!allowEmpty && entries.length === 0) {
        throw new Error("At least one expense setting is required.");
    }

    for (const [key, value] of entries) {
        if (!Object.hasOwn(defaultExpenseSettings, key)) {
            throw new Error(`Unsupported expense setting: ${key}.`);
        }

        validateExpenseSetting(key, value);
    }

    return Object.fromEntries(entries);
}

function getExpenseSettingsRef(uid) {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    return doc(
        firestore,
        "users",
        uid,
        "modules",
        "expenses",
        "settings",
        "main",
    );
}

function getUserProfileRef(uid) {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    return doc(firestore, "users", uid);
}

function getExpenseModuleRef(uid) {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    return doc(firestore, "users", uid, "modules", "expenses");
}

function getDefaultWalletRef(uid) {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    return doc(
        firestore,
        "users",
        uid,
        "modules",
        "expenses",
        "wallets",
        defaultWalletId,
    );
}

function getDefaultCategoryRef(uid, categoryId) {
    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    return doc(
        firestore,
        "users",
        uid,
        "modules",
        "expenses",
        "categories",
        categoryId,
    );
}

function getUserProfile(user) {
    return {
        displayName: user?.displayName ?? null,
        email: user?.email ?? null,
        photoURL: user?.photoURL ?? null,
    };
}

export async function getExpenseSettings(uid) {
    const snapshot = await getDocFromServer(getExpenseSettingsRef(uid));

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
    };
}

async function initializeUserData(user, settings = {}) {
    const uid = typeof user === "string" ? user : user?.uid;

    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    const userRef = getUserProfileRef(uid);
    const expenseModuleRef = getExpenseModuleRef(uid);
    const settingsRef = getExpenseSettingsRef(uid);
    const walletRef = getDefaultWalletRef(uid);
    const categoryRefs = defaultCategories.map((category) => ({
        category,
        ref: getDefaultCategoryRef(uid, category.id),
    }));
    const profile = getUserProfile(user);
    const validatedSettings = validateExpenseSettings(settings, {
        allowEmpty: true,
    });

    try {
        await runTransaction(firestore, async (transaction) => {
            const userSnapshot = await transaction.get(userRef);
            const expenseModuleSnapshot =
                await transaction.get(expenseModuleRef);
            const settingsSnapshot = await transaction.get(settingsRef);
            const walletSnapshot = await transaction.get(walletRef);
            const categorySnapshots = await Promise.all(
                categoryRefs.map(({ ref }) => transaction.get(ref)),
            );
            const timestamp = serverTimestamp();

            if (!userSnapshot.exists()) {
                transaction.set(userRef, {
                    ...profile,
                    createdAt: timestamp,
                    initializedAt: timestamp,
                    updatedAt: timestamp,
                });
            }

            if (!expenseModuleSnapshot.exists()) {
                transaction.set(expenseModuleRef, {
                    enabled: true,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                });
            }

            if (!settingsSnapshot.exists()) {
                transaction.set(settingsRef, {
                    ...defaultExpenseSettings,
                    ...validatedSettings,
                    updatedAt: timestamp,
                });
            }

            if (!walletSnapshot.exists()) {
                transaction.set(walletRef, {
                    name: "Ví tiền mặt",
                    type: expenseDefaultWalletTypeId,
                    icon: expenseDefaultWalletTypeMeta.icon,
                    color: expenseDefaultWalletTypeMeta.color,
                    balance: 0,
                    initialBalance: 0,
                    currency: expenseDefaultCurrency,
                    order: 10,
                    isDefault: true,
                    isBalanceInitialized: false,
                    isArchived: false,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                });
            }

            categorySnapshots.forEach((categorySnapshot, index) => {
                if (categorySnapshot.exists()) {
                    return;
                }

                const { category, ref } = categoryRefs[index];

                transaction.set(ref, {
                    name: category.name,
                    type: category.type,
                    icon: category.icon,
                    color: category.color,
                    sortOrder: (index + 1) * 10,
                    isArchived: false,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                });
            });
        });
    } catch (error) {
        if (isAlreadyExistsError(error)) {
            const settingsAfterRace = await getExpenseSettings(uid);

            if (settingsAfterRace) {
                return settingsAfterRace;
            }
        }

        throw error;
    }

    return getExpenseSettings(uid);
}

export async function ensureUserDataInitialized(user, settings = {}) {
    const uid = typeof user === "string" ? user : user?.uid;

    if (!uid) {
        throw new Error("A Firebase Authentication uid is required.");
    }

    const existingRequest = userDataInitializationRequests.get(uid);

    if (existingRequest) {
        return existingRequest;
    }

    const request = initializeUserData(user, settings).finally(() => {
        if (userDataInitializationRequests.get(uid) === request) {
            userDataInitializationRequests.delete(uid);
        }
    });

    userDataInitializationRequests.set(uid, request);

    return request;
}

export async function createExpenseSettings(uid, settings = {}) {
    const settingsRef = getExpenseSettingsRef(uid);
    const validatedSettings = validateExpenseSettings(settings, {
        allowEmpty: true,
    });

    await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(settingsRef);

        if (snapshot.exists()) {
            throw new Error(`Expense settings already exist for user ${uid}.`);
        }

        transaction.set(settingsRef, {
            ...defaultExpenseSettings,
            ...validatedSettings,
            updatedAt: serverTimestamp(),
        });
    });

    return getExpenseSettings(uid);
}

export async function ensureExpenseSettings(uid, settings = {}) {
    const settingsRef = getExpenseSettingsRef(uid);
    const validatedSettings = validateExpenseSettings(settings, {
        allowEmpty: true,
    });

    await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(settingsRef);

        if (snapshot.exists()) {
            return;
        }

        transaction.set(settingsRef, {
            ...defaultExpenseSettings,
            ...validatedSettings,
            updatedAt: serverTimestamp(),
        });
    });

    return getExpenseSettings(uid);
}

export async function updateExpenseSettings(uid, settings) {
    const validatedSettings = validateExpenseSettings(settings);

    await updateDoc(getExpenseSettingsRef(uid), {
        ...validatedSettings,
        updatedAt: serverTimestamp(),
    });
}

export async function updateExpenseTheme(uid, theme) {
    return updateExpenseSettings(uid, { theme });
}
