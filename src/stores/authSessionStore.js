import { create } from "zustand";

/**
 * Tạo một snapshot của người dùng xác thực để lưu trữ trong store.
 * @param {*} user 
 * @returns { displayName: string | null, email: string | null, photoURL: string | null, uid: string } 
 */
function getAuthUserSnapshot(user) {
    if (!user) {
        return null;
    }

    return {
        displayName: user.displayName ?? null,
        email: user.email ?? null,
        photoURL: user.photoURL ?? null,
        uid: user.uid,
    };
}

/**
 * Store để quản lý phiên xác thực người dùng.
 * @typedef {Object} AuthSessionStore
 * @property {Object|null} authUser - Thông tin người dùng xác thực hiện tại.
 * @property {string|null} uid - UID của người dùng xác thực hiện tại.
 * @property {Function} clearAuthUser - Hàm để xóa thông tin người dùng xác thực.
 * @property {Function} setAuthUser - Hàm để thiết lập thông tin người dùng xác thực.
 */
export const useAuthSessionStore = create((set) => ({
    authUser: null,
    uid: null,
    clearAuthUser: () => {
        set({
            authUser: null,
            uid: null,
        });
    },
    setAuthUser: (user) => {
        const authUser = getAuthUserSnapshot(user);

        set({
            authUser: authUser,
            uid: authUser?.uid ?? null,
        });
    },
}));

export const selectAuthUid = (state) => state.uid;
export const selectAuthUser = (state) => state.authUser;
