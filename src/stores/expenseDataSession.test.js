import { beforeEach, expect, it, vi } from "vitest";
import { useAuthSessionStore } from "./authSessionStore";
import { useExpenseDataStore } from "./expenseDataStore";
const mock = vi.hoisted(() => ({ stats: vi.fn(), create: vi.fn(), mutate: vi.fn() }));
vi.mock("../modules/expenses/api/monthlyStatsRepository", () => ({ getExpenseMonthlyStats: mock.stats }));
vi.mock("../modules/expenses/api/transactionsRepository", () => ({
    createExpenseTransaction: mock.create, updateExpenseTransaction: mock.mutate, voidExpenseTransaction: mock.mutate,
}));
vi.mock("../modules/expenses/api/budgetsRepository", () => ({
    upsertExpenseBudget: mock.mutate, copyExpenseBudgets: mock.mutate, deleteExpenseBudget: mock.mutate,
}));
vi.mock("../modules/expenses/api/walletsRepository", () => ({
    upsertExpenseWallet: mock.mutate, deleteExpenseWallet: mock.mutate, reorderExpenseWallets: mock.mutate,
}));
vi.mock("../modules/expenses/api/categoriesRepository", () => ({ reorderExpenseCategories: mock.mutate }));
const login = (uid) => useAuthSessionStore.getState().setAuthUser(uid ? { uid } : null);
beforeEach(() => { vi.resetAllMocks(); login(null); login("alice"); useExpenseDataStore.getState().resetExpenseData(); });
it("clears every user cache when switching or logging out", () => {
    useExpenseDataStore.setState({ monthlyStatsByMonth: { old: 123 }, budgetLimitsByMonth: { old: [] }, budgetLimitsErrorByMonth: { old: "error" }, recentTransactions: [{ id: "old" }] });
    login("bob");
    expect(useExpenseDataStore.getState()).toMatchObject({ monthlyStatsByMonth: {}, budgetLimitsByMonth: {}, budgetLimitsErrorByMonth: {}, recentTransactions: [] });
});
it("ignores a late read even after logging back into the same account", async () => {
    let resolve;
    mock.stats.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const pending = useExpenseDataStore.getState().loadExpenseMonthlyStats("alice", "2026-10");
    await vi.waitFor(() => expect(resolve).toBeTypeOf("function"));
    login(null); login("alice");
    resolve({ incomeMinor: 123 }); await pending;
    expect(useExpenseDataStore.getState().monthlyStatsByMonth).toEqual({});
});
it("ignores a late mutation from the previous session", async () => {
    let resolve;
    mock.create.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const pending = useExpenseDataStore.getState().createExpenseTransaction("alice", {});
    await vi.waitFor(() => expect(resolve).toBeTypeOf("function"));
    login("bob");
    resolve({ transaction: { id: "old", date: "2026-10-23" }, monthlyStats: { monthKey: "2026-10", incomeMinor: 123 }, walletBalanceUpdates: {} });
    await expect(pending).rejects.toThrow("Phiên đăng nhập đã thay đổi");
    expect(useExpenseDataStore.getState()).toMatchObject({ recentTransactions: [], monthlyStatsByMonth: {}, monthOptionsByYear: {} });
});
it.each([
    ["createExpenseTransaction", [{}]],
    ["updateExpenseTransaction", ["tx", {}]],
    ["voidExpenseTransaction", ["tx"]],
    ["upsertExpenseBudget", [{}, "2026-10"]],
    ["copyExpenseBudgets", ["2026-09", "2026-10"]],
    ["deleteExpenseBudget", [{}, "2026-10"]],
    ["upsertExpenseWallet", [{}]],
    ["deleteExpenseWallet", [{}]],
    ["reorderExpenseCategories", [[]]],
    ["reorderExpenseWallets", [[]]],
])("does not dispatch %s after logout/login while loading the repository", async (action, args) => {
    const pending = useExpenseDataStore.getState()[action]("alice", ...args);
    login(null); login("alice");
    await expect(pending).rejects.toThrow("Phiên đăng nhập đã thay đổi");
    expect(mock.create).not.toHaveBeenCalled();
    expect(mock.mutate).not.toHaveBeenCalled();
});
it("rejects a mutation invoked for a different account", async () => {
    await expect(useExpenseDataStore.getState().createExpenseTransaction("bob", {}))
        .rejects.toThrow("Phiên đăng nhập đã thay đổi");
    expect(mock.create).not.toHaveBeenCalled();
});
it("deduplicates a replayed transaction in the local list", async () => {
    mock.create.mockResolvedValue({ transaction: { id: "once", date: "2026-10-23" }, walletBalanceUpdates: {} });
    await useExpenseDataStore.getState().createExpenseTransaction("alice", {});
    await useExpenseDataStore.getState().createExpenseTransaction("alice", {});
    expect(useExpenseDataStore.getState().recentTransactions).toHaveLength(1);
});
