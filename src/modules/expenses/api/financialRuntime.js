import { useAuthSessionStore } from "../../../stores/authSessionStore";

export async function runFinancialMutation(action, uid, payload) {
    const session = useAuthSessionStore.getState();
    if (!uid || session.uid !== uid) {
        throw new Error("Phiên đăng nhập đã thay đổi. Vui lòng thử lại.");
    }
    const [{ getFunctions, httpsCallable }, { firebaseApp }] = await Promise.all([
        import("firebase/functions"), import("../../../lib/firebase/app"),
    ]);
    if (useAuthSessionStore.getState().uid !== uid || useAuthSessionStore.getState().sessionRevision !== session.sessionRevision) throw new Error("Phiên đăng nhập đã thay đổi.");
    const call = httpsCallable(getFunctions(firebaseApp, "asia-southeast1"), "mutateExpenses");
    const { data } = await call({
        action,
        ...payload,
        ...(payload.input ? { input: {
            ...payload.input,
            timezone: payload.input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        } } : {}),
    });
    if (useAuthSessionStore.getState().uid !== uid || useAuthSessionStore.getState().sessionRevision !== session.sessionRevision) {
        throw new Error("Phiên đăng nhập đã thay đổi.");
    }
    return data;
}
