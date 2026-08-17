import { describe, expect, it } from "vitest";
import {
    buildSavingsSeedBudgets,
    savingsSeedMonthKeys,
    savingsSeedTransactions,
} from "./seedSavingsTestData";

describe("savings test data", () => {
    it("uses unique transaction ids across July and August 2026", () => {
        const ids = savingsSeedTransactions.map((transaction) => transaction.id);

        expect(new Set(ids).size).toBe(ids.length);
        expect(savingsSeedTransactions.some((transaction) => transaction.date.startsWith("2026-07"))).toBe(true);
        expect(savingsSeedTransactions.some((transaction) => transaction.date.startsWith("2026-08"))).toBe(true);
    });

    it("builds July budgets with saving, exhausted, and exceeded scenarios", () => {
        const budgets = buildSavingsSeedBudgets(savingsSeedMonthKeys.july, {
            food: 2_050_000,
            fun: 900_000,
            home: 4_200_000,
            shopping: 2_400_000,
            transport: 650_000,
        });
        const budgetsByCategory = Object.fromEntries(
            budgets.map((budget) => [budget.categoryId, budget.limitMinor]),
        );

        expect(budgetsByCategory).toEqual({
            food: 3_550_000,
            fun: 900_000,
            home: 5_000_000,
            shopping: 2_100_000,
            transport: 1_850_000,
        });
    });
});
