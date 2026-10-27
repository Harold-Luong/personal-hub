import { beforeEach, expect, it, vi } from "vitest";
import { useAuthSessionStore } from "../../../stores/authSessionStore";
import { runFinancialMutation } from "./financialRuntime";

const mock = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock("firebase/functions", () => ({ getFunctions: vi.fn(), httpsCallable: () => mock.call }));
vi.mock("../../../lib/firebase/app", () => ({ firebaseApp: {} }));
const login = (uid) => useAuthSessionStore.getState().setAuthUser(uid ? { uid } : null);
beforeEach(() => { vi.resetAllMocks(); login(null); login("alice"); });

it("does not return a successful response to a subsequent session of the same account", async () => {
    let resolve;
    mock.call.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const pending = runFinancialMutation("createExpenseTransaction", "alice", { input: {} });
    await vi.waitFor(() => expect(resolve).toBeTypeOf("function"));
    login(null); login("alice");
    resolve({ data: { transaction: { id: "old-session" } } });
    await expect(pending).rejects.toThrow("Phiên đăng nhập đã thay đổi");
});

it("sends the action and payload without accepting UID as authorization", async () => {
    mock.call.mockResolvedValue({ data: { transaction: { id: "saved" } } });
    const result = await runFinancialMutation("createExpenseTransaction", "alice", { input: { timezone: "Asia/Ho_Chi_Minh" } });
    expect(mock.call).toHaveBeenCalledWith({ action: "createExpenseTransaction", input: { timezone: "Asia/Ho_Chi_Minh" } });
    expect(result.transaction.id).toBe("saved");
});
