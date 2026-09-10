import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ documents: new Map(), source: [], failId: "", failSourceRead: false }));
vi.mock("../../../lib/firebase/firestore", () => ({ firestore: {} }));
vi.mock("./getReference", () => ({
    getCollectionReference: (uid, collection) => {
        if (!uid) throw new Error("Missing uid");
        return `${uid}/${collection}`;
    },
    getDocumentReference: (uid, collection, id) => ({ id, path: `${uid}/${collection}/${id}` }),
}));
vi.mock("firebase/firestore", () => ({
    deleteDoc: vi.fn(),
    query: (ref) => ref,
    where: vi.fn(),
    serverTimestamp: () => "server-time",
    getDocsFromServer: async () => {
        if (mock.failSourceRead) throw new Error("Source unavailable");
        return { docs: mock.source.map((data) => ({ id: `2026-08_${data.categoryId}`, data: () => data })) };
    },
    runTransaction: async (_, callback) => {
        const writes = [];
        const result = await callback({
            get: async (ref) => {
                if (ref.id === mock.failId) throw new Error("Network error");
                return { id: ref.id, exists: () => mock.documents.has(ref.path), data: () => mock.documents.get(ref.path) };
            },
            set: (ref, data) => writes.push([ref.path, data]),
        });
        writes.forEach(([path, data]) => mock.documents.set(path, data));
        return result;
    },
}));

import { copyExpenseBudgets } from "./budgetsRepository";
import { useExpenseDataStore } from "../../../stores/expenseDataStore";

beforeEach(() => {
    mock.documents.clear();
    mock.source = [{ monthKey: "2026-08", categoryId: "food", limitMinor: 3000000, alertThreshold: 75 }];
    mock.failId = "";
    mock.failSourceRead = false;
    mock.documents.set("user/categories/food", { type: "expense", isArchived: false });
});

describe("copy budgets", () => {
    it("copies only budget configuration and preserves existing targets on retry", async () => {
        const result = await copyExpenseBudgets("user", "2026-08", "2026-09");
        expect(result.copiedCount).toBe(1);
        expect(mock.documents.get("user/budgets/2026-09_food")).toEqual({
            monthKey: "2026-09", categoryId: "food", limitMinor: 3000000, alertThreshold: 75,
            createdAt: "server-time", updatedAt: "server-time",
        });
        mock.source[0].limitMinor = 5000000;
        expect(await copyExpenseBudgets("user", "2026-08", "2026-09")).toMatchObject({ copiedCount: 0, skippedCount: 1 });
        expect(mock.documents.get("user/budgets/2026-09_food").limitMinor).toBe(3000000);
    });

    it.each([{ type: "expense", isArchived: true }, { type: "income", isArchived: false }, null])("skips unavailable expense categories: %j", async (category) => {
        if (category) mock.documents.set("user/categories/food", category);
        else mock.documents.delete("user/categories/food");
        expect(await copyExpenseBudgets("user", "2026-08", "2026-09")).toMatchObject({ copiedCount: 0, skippedCount: 1 });
        expect(mock.documents.has("user/budgets/2026-09_food")).toBe(false);
    });

    it("reports partial failure and safely retries the remaining category", async () => {
        mock.source.push({ ...mock.source[0], categoryId: "home" });
        mock.documents.set("user/categories/home", { type: "expense", isArchived: false });
        mock.failId = "2026-09_home";
        expect(await copyExpenseBudgets("user", "2026-08", "2026-09")).toMatchObject({ copiedCount: 1, failedCount: 1 });
        mock.failId = "";
        expect(await copyExpenseBudgets("user", "2026-08", "2026-09")).toMatchObject({ copiedCount: 1, skippedCount: 1, failedCount: 0 });
    });

    it("handles an empty source and rejects invalid requests", async () => {
        mock.source = [];
        expect(await copyExpenseBudgets("user", "2026-08", "2026-09")).toMatchObject({ budgets: [], copiedCount: 0 });
        await expect(copyExpenseBudgets("user", "2026-09", "2026-09")).rejects.toThrow();
        await expect(copyExpenseBudgets("user", "2026-13", "2026-09")).rejects.toThrow();
        await expect(copyExpenseBudgets("", "2026-08", "2026-09")).rejects.toThrow();
    });

    it("updates the user's budget cache while preserving unrelated budgets", async () => {
        const existing = { id: "2026-09_other", categoryId: "other", monthKey: "2026-09", limit: 100 };
        useExpenseDataStore.setState({ walletsOwnerUid: "user", budgetLimitsByMonth: { "2026-09": [existing] } });
        await useExpenseDataStore.getState().copyExpenseBudgets("user", "2026-08", "2026-09");
        expect(useExpenseDataStore.getState().budgetLimitsByMonth["2026-09"]).toEqual(expect.arrayContaining([
            existing, expect.objectContaining({ categoryId: "food", limit: 3000000 }),
        ]));
    });

    it("does not write when the source cannot be loaded", async () => {
        mock.failSourceRead = true;
        await expect(copyExpenseBudgets("user", "2026-08", "2026-09")).rejects.toThrow("Source unavailable");
        expect(mock.documents.has("user/budgets/2026-09_food")).toBe(false);
    });

    it("reports invalid source configuration without creating a destination", async () => {
        mock.source[0].alertThreshold = 101;
        expect(await copyExpenseBudgets("user", "2026-08", "2026-09")).toMatchObject({ copiedCount: 0, failedCount: 1 });
        expect(mock.documents.has("user/budgets/2026-09_food")).toBe(false);
    });

    it("does not merge results into a different user's cache", async () => {
        const budgets = { "2026-09": [{ id: "other-budget", categoryId: "other" }] };
        useExpenseDataStore.setState({ walletsOwnerUid: "another-user", budgetLimitsByMonth: budgets });
        await useExpenseDataStore.getState().copyExpenseBudgets("user", "2026-08", "2026-09");
        expect(useExpenseDataStore.getState().budgetLimitsByMonth).toBe(budgets);
    });
});
