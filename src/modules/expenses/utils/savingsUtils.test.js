import { describe, expect, it } from "vitest";
import { savingsTransferKinds } from "../constants/expenseMetadata";
import {
    getSavingsSummary,
    getSavingsTransferKind,
    getSavingsTransferValidationError,
    getSavingWallets,
    getSpendableWallets,
} from "./savingsUtils";

const wallets = [
    { id: "cash", type: "cash", balance: 3_000_000, currency: "VND" },
    { id: "bank", type: "bank", balance: 7_000_000, currency: "VND" },
    { id: "saving", type: "saving", balance: 5_000_000, currency: "VND" },
    { id: "card", type: "credit-card", balance: 0, currency: "VND" },
];

describe("savingsUtils", () => {
    it("separates protected savings from spendable balances", () => {
        expect(getSavingWallets(wallets).map((wallet) => wallet.id)).toEqual(["saving"]);
        expect(getSpendableWallets(wallets).map((wallet) => wallet.id)).toEqual(["cash", "bank"]);
        expect(getSavingsSummary(wallets)).toEqual({
            savingBalance: 5_000_000,
            savingWalletCount: 1,
            spendableBalance: 10_000_000,
        });
    });

    it("recognizes explicit and legacy budget saving transfers", () => {
        expect(getSavingsTransferKind({ savingsTransferKind: "withdrawal" }, wallets)).toBe("withdrawal");
        expect(getSavingsTransferKind({ budgetSavingsMonthKey: "2026-07" }, wallets)).toBe("deposit");
        expect(getSavingsTransferKind({ toWalletId: "saving" }, wallets)).toBe("deposit");
    });

    it("allows only the dedicated deposit and withdrawal directions", () => {
        expect(getSavingsTransferValidationError({
            fromWallet: wallets[0],
            kind: savingsTransferKinds.DEPOSIT,
            toWallet: wallets[2],
        })).toBe("");
        expect(getSavingsTransferValidationError({
            fromWallet: wallets[2],
            kind: savingsTransferKinds.WITHDRAWAL,
            toWallet: wallets[1],
        })).toBe("");
        expect(getSavingsTransferValidationError({
            fromWallet: wallets[2],
            kind: null,
            toWallet: wallets[1],
        })).toContain("Nạp hoặc Rút");
        expect(getSavingsTransferValidationError({
            fromWallet: wallets[0],
            kind: savingsTransferKinds.WITHDRAWAL,
            toWallet: wallets[2],
        })).toContain("rút từ ví Tiết kiệm");
    });
});
