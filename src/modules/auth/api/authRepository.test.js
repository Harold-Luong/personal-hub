import { beforeEach, expect, it, vi } from "vitest";
import { useAuthSessionStore } from "../../../stores/authSessionStore";
import { updateAuthDisplayName } from "./authRepository";

const mock = vi.hoisted(() => ({ auth: { currentUser: null }, updateProfile: vi.fn(), updateDoc: vi.fn() }));
vi.mock("../../../lib/firebase/auth", () => ({ auth: mock.auth }));
vi.mock("../../../lib/firebase/firestore", () => ({ firestore: {} }));
vi.mock("firebase/auth", () => ({
    GoogleAuthProvider: class { setCustomParameters() {} },
    createUserWithEmailAndPassword: vi.fn(), signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(), signOut: vi.fn(), updateProfile: mock.updateProfile,
}));
vi.mock("firebase/firestore", () => ({
    doc: (_db, ...segments) => segments.join("/"), serverTimestamp: () => "server-time", updateDoc: mock.updateDoc,
}));
const login = (user) => {
    mock.auth.currentUser = user;
    useAuthSessionStore.getState().setAuthUser(user);
};
beforeEach(() => {
    vi.resetAllMocks();
    login(null); login({ uid: "alice", displayName: "Alice" });
    mock.updateProfile.mockResolvedValue(); mock.updateDoc.mockResolvedValue();
});

it("does not write or roll back the new account when Auth profile update completes late", async () => {
    let resolve;
    const alice = mock.auth.currentUser;
    mock.updateProfile.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const pending = updateAuthDisplayName("Alice New");
    login({ uid: "bob", displayName: "Bob" });
    resolve();
    await expect(pending).rejects.toThrow("Phiên đăng nhập đã thay đổi");
    expect(mock.updateDoc).not.toHaveBeenCalled();
    expect(mock.updateProfile).toHaveBeenCalledExactlyOnceWith(alice, { displayName: "Alice New" });
});

it("does not roll back a subsequent session when the Firestore write fails late", async () => {
    let reject;
    mock.updateDoc.mockImplementation(() => new Promise((_resolve, fail) => { reject = fail; }));
    const pending = updateAuthDisplayName("Alice New");
    await vi.waitFor(() => expect(reject).toBeTypeOf("function"));
    const alice = mock.auth.currentUser;
    login(null); login(alice);
    reject(new Error("network"));
    await expect(pending).rejects.toThrow("network");
    expect(mock.updateProfile).toHaveBeenCalledTimes(1);
});

it("rolls back the original profile when persistence fails in the same session", async () => {
    const alice = mock.auth.currentUser;
    mock.updateDoc.mockRejectedValue(new Error("denied"));
    await expect(updateAuthDisplayName("Alice New")).rejects.toThrow("denied");
    expect(mock.updateProfile).toHaveBeenLastCalledWith(alice, { displayName: "Alice" });
});

it("updates both profiles and returns the captured user on success", async () => {
    const alice = mock.auth.currentUser;
    await expect(updateAuthDisplayName("  Alice   New  ")).resolves.toBe(alice);
    expect(mock.updateDoc).toHaveBeenCalledWith("users/alice", { displayName: "Alice New", updatedAt: "server-time" });
});
