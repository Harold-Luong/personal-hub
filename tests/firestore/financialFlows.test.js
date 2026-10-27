import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const projectId = "demo-personal-hub";
let environment, db, handleMutation;
const wallet = (type = "bank", balance = 10000, currency = "VND") => ({
    name: type, type, balance, initialBalance: balance, currency,
    icon: "wallet", color: "#ffffff", order: 10,
    isArchived: false, isBalanceInitialized: true,
});
const path = (kind, id, uid = "alice") => `users/${uid}/modules/expenses/${kind}/${id}`;
const read = async (kind, id) => (await db.doc(path(kind, id)).get()).data();
const create = (input, authUid = "alice") => handleMutation({ auth: { uid: authUid }, data: { action: "createExpenseTransaction", input } });
const transfer = (key, extra = {}) => ({
    idempotencyKey: key, type: "transfer", amount: 100,
    title: "Transfer", date: "2026-10-23", time: "10:00", timezone: "Asia/Ho_Chi_Minh",
    fromWalletId: "bank", toWalletId: "saving", savingsTransferKind: "deposit", ...extra,
});
const expense = (key, extra = {}) => ({
    idempotencyKey: key, type: "expense", amount: 200, title: "Lunch",
    date: "2026-10-23", time: "10:00", timezone: "Asia/Ho_Chi_Minh",
    walletId: "bank", categoryId: "food", ...extra,
});
const mutate = (action, payload) => handleMutation({ auth: { uid: "alice" }, data: { action, ...payload } });

describe.skipIf(!enabled)("financial callable and Firestore Rules", () => {
    beforeAll(async () => {
        process.env.GCLOUD_PROJECT = projectId;
        const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
        environment = await initializeTestEnvironment({ projectId,
            firestore: { host, port: Number(port), rules: readFileSync("firestore.rules", "utf8") } });
        const require = createRequire(import.meta.url);
        ({ firestore: db } = require("../../functions/src/firestore.cjs"));
        ({ handleMutation } = require("../../functions/src/handler.cjs"));
    }, 30000);
    afterAll(async () => { await environment?.cleanup(); await db?.terminate(); });
    beforeEach(async () => {
        await environment.clearFirestore();
        const timestamp = new Date();
        for (const [id, data] of Object.entries({
            bank: wallet(), saving: wallet("saving", 0), usd: { ...wallet("bank", 0, "USD"), name: "USD bank" },
            card: { ...wallet("credit-card", 0), creditLimit: 1000, outstandingDebt: 0, availableCredit: 1000 },
        })) await db.doc(path("wallets", id)).set({ ...data, createdAt: timestamp, updatedAt: timestamp });
        await db.doc(path("categories", "food")).set({ name: "Food", icon: "food", color: "#ffffff", type: "expense", isArchived: false });
        await db.doc(path("budgets", "2026-09_food")).set({ monthKey: "2026-09", categoryId: "food", limitMinor: 100, alertThreshold: 80, createdAt: timestamp, updatedAt: timestamp });
        await db.doc(path("settings", "main")).set({ defaultWalletId: "bank" });
    });

    it("rejects anonymous and unknown actions", async () => {
        await expect(handleMutation({ data: { action: "createExpenseTransaction" } })).rejects.toMatchObject({ code: "unauthenticated" });
        await expect(mutate("toString", {})).rejects.toMatchObject({ code: "invalid-argument" });
    });
    it("rejects an opening balance that cannot reconcile with a new wallet", async () => {
        await expect(mutate("createExpenseWallet", { input: {
            name: "Inconsistent wallet", type: "bank", balance: 100, initialBalance: 200,
        } })).rejects.toThrow("Số dư ví mới");
        expect((await db.collection("users/alice/modules/expenses/wallets").get()).size).toBe(4);
    });
    it("commits concurrent retries exactly once and rejects key reuse with another payload", async () => {
        const results = await Promise.all([create(expense("once")), create(expense("once"))]);
        expect(results.map((r) => r.transaction.id)).toEqual(["once", "once"]);
        for (const result of results) {
            expect(result.transaction).toMatchObject({ date: "2026-10-23", time: "10:00", timezone: "Asia/Ho_Chi_Minh" });
        }
        expect(await read("wallets", "bank")).toMatchObject({ balance: 9800 });
        expect(await read("monthlyStats", "2026-10")).toMatchObject({ expenseMinor: 200, transactionCount: 1 });
        await expect(create(expense("once", { amount: 201 }))).rejects.toThrow("nội dung khác");
        expect((await read("transactions", "once")).occurredAt.toDate().toISOString()).toBe("2026-10-23T03:00:00.000Z");
    });
    it("allows only one simultaneous surplus claim, and releases it on void", async () => {
        const metadata = { budgetSavingsMonthKey: "2026-09", budgetSavingsCategoryId: "food" };
        const results = await Promise.allSettled([create(transfer("first", metadata)), create(transfer("second", metadata))]);
        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        expect(await read("wallets", "saving")).toMatchObject({ balance: 100 });
        const id = results.find((r) => r.status === "fulfilled").value.transaction.id;
        await mutate("voidExpenseTransaction", { transactionId: id });
        expect(await read("savingsClaims", "2026-09_food")).toMatchObject({ transactionId: null });
        await create(transfer("third", metadata));
        expect(await read("wallets", "saving")).toMatchObject({ balance: 100 });
        await expect(create(transfer(id, metadata))).rejects.toThrow("đã được hủy");
    });
    it("respects legacy surplus transfers without a claim", async () => {
        const input = transfer("legacy", { budgetSavingsMonthKey: "2026-09", budgetSavingsCategoryId: "food" });
        await create(input);
        await db.doc(path("savingsClaims", "2026-09_food")).delete();
        await expect(create({ ...input, idempotencyKey: "new" })).rejects.toThrow("đã được đưa");
        await mutate("voidExpenseTransaction", { transactionId: "legacy" });
        await create({ ...input, idempotencyKey: "new" });
        expect(await read("wallets", "saving")).toMatchObject({ balance: 100 });
    });
    it("keeps concurrent card spending when metadata is edited", async () => {
        await Promise.all([
            create(expense("card-spending", { walletId: "card" })),
            mutate("updateExpenseWallet", { input: { id: "card", name: "New card name" } }),
        ]);
        expect(await read("wallets", "card")).toMatchObject({ name: "New card name", outstandingDebt: 200, availableCredit: 800 });
        await expect(mutate("updateExpenseWallet", { input: { id: "card", creditLimit: 100 } })).rejects.toThrow();
    });
    it("rejects cross-currency transfers and payments without partial writes", async () => {
        const plain = transfer("mixed", { toWalletId: "usd" });
        delete plain.savingsTransferKind;
        await expect(create(plain)).rejects.toThrow("tiền tệ");
        await db.doc(path("wallets", "card")).update({ currency: "USD", outstandingDebt: 200, availableCredit: 800 });
        await expect(create({ ...plain, idempotencyKey: "payment", type: "creditPayment", toWalletId: "card" })).rejects.toThrow("tiền tệ");
        expect(await read("wallets", "bank")).toMatchObject({ balance: 10000 });
        expect(await read("monthlyStats", "2026-10")).toBeUndefined();
    });
    it("moves statistics when editing month and reverses the final effect on void", async () => {
        await create(expense("edit"));
        await mutate("updateExpenseTransaction", { transactionId: "edit", input: expense("edit", { date: "2026-09-15", amount: 300 }) });
        expect(await read("monthlyStats", "2026-10")).toMatchObject({ expenseMinor: 0, transactionCount: 0 });
        expect(await read("monthlyStats", "2026-09")).toMatchObject({ expenseMinor: 300, transactionCount: 1 });
        await mutate("voidExpenseTransaction", { transactionId: "edit" });
        expect(await read("wallets", "bank")).toMatchObject({ balance: 10000 });
    });
    it("adjusts a wallet with history through an adjustment transaction", async () => {
        await create(expense("before-adjustment"));
        const result = await mutate("updateExpenseWallet", { input: { id: "bank", balance: 9000 } });
        expect(result.adjustmentTransaction).toMatchObject({ type: "adjustment", amountMinor: 800 });
        expect(await read("monthlyStats", "2026-10")).toMatchObject({ expenseMinor: 200, transactionCount: 1 });
        await mutate("voidExpenseTransaction", { transactionId: result.adjustmentTransaction.id });
        expect(await read("wallets", "bank")).toMatchObject({ balance: 9800 });
    });
    it("ignores supplied uid and only mutates authenticated ownership", async () => {
        await handleMutation({ auth: { uid: "alice" }, data: { uid: "bob", action: "createExpenseTransaction", input: expense("ownership") } });
        expect((await db.doc(path("transactions", "ownership", "bob")).get()).exists).toBe(false);
    });
    it("denies browser financial writes even to the owner's records", async () => {
        const client = environment.authenticatedContext("alice").firestore();
        await assertFails(updateDoc(doc(client, path("wallets", "bank")), { balance: 1, updatedAt: serverTimestamp() }));
        await assertFails(setDoc(doc(client, path("monthlyStats", "2026-10")), { monthKey: "2026-10", incomeMinor: 0, expenseMinor: 0, netMinor: 0, transactionCount: 0, categoryExpenseMinor: {}, categoryIncomeMinor: {}, updatedAt: serverTimestamp() }));
        await create(expense("forbidden"));
        await assertFails(updateDoc(doc(client, path("transactions", "forbidden")), { status: "voided", updatedAt: serverTimestamp(), voidedAt: serverTimestamp() }));
        await assertFails(setDoc(doc(client, path("savingsClaims", "2026-09_food")), { transactionId: null }));
        await assertFails(getDoc(doc(environment.authenticatedContext("bob").firestore(), path("wallets", "bank"))));
        await assertSucceeds(updateDoc(doc(client, path("wallets", "bank")), { order: 30, updatedAt: serverTimestamp() }));
        await assertSucceeds(updateDoc(doc(client, path("budgets", "2026-09_food")), { limitMinor: 120, updatedAt: serverTimestamp() }));
    });
    it("retains zero-balance bootstrap but denies browser opening balances", async () => {
        const client = environment.authenticatedContext("alice").firestore();
        const data = { ...wallet("cash", 0), isBalanceInitialized: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        await assertSucceeds(setDoc(doc(client, path("wallets", "default-wallet-cash")), data));
        await assertFails(setDoc(doc(client, path("wallets", "other-wallet")), { ...data, balance: 123 }));
        const result = await mutate("updateExpenseWallet", { input: { id: "default-wallet-cash", initialBalance: 500 } });
        expect(result.wallet).toMatchObject({ initialBalance: 500, balance: 500, isBalanceInitialized: true });
    });
});
