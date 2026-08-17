import { describe, expect, it } from "vitest";
import { calculateMonthlyBudgetTotals, getBudgetSavingsCandidates } from "./expenseCalculations";

describe("calculateMonthlyBudgetTotals", () => {
    it("calculates positive savings against the combined budget plan", () => {
        expect(
            calculateMonthlyBudgetTotals([
                { amount: 2_000_000, limit: 3_000_000 },
                { amount: 1_500_000, limit: 2_000_000 },
            ]),
        ).toEqual({
            spent: 3_500_000,
            limit: 5_000_000,
            percentage: 70,
            savingsVsPlan: 1_500_000,
        });
    });

    it("returns a negative value when budgeted categories exceed the plan", () => {
        expect(
            calculateMonthlyBudgetTotals([
                { amount: 3_500_000, limit: 3_000_000 },
                { amount: 1_000_000, limit: 2_000_000 },
            ]).savingsVsPlan,
        ).toBe(500_000);

        expect(
            calculateMonthlyBudgetTotals([
                { amount: 4_500_000, limit: 3_000_000 },
                { amount: 1_000_000, limit: 1_000_000 },
            ]).savingsVsPlan,
        ).toBe(-1_500_000);
    });

    it("normalizes invalid and negative inputs before calculating", () => {
        expect(
            calculateMonthlyBudgetTotals([
                { amount: Number.NaN, limit: -100 },
                { amount: "250000", limit: "1000000" },
            ]),
        ).toEqual({
            spent: 250_000,
            limit: 1_000_000,
            percentage: 25,
            savingsVsPlan: 750_000,
        });
    });
});

describe("getBudgetSavingsCandidates", () => {
    it("keeps only categories with money left and sorts the largest amount first", () => {
        expect(
            getBudgetSavingsCandidates([
                { category: "Ăn uống", amount: 2_500_000, limit: 3_000_000 },
                { category: "Di chuyển", amount: 800_000, limit: 2_000_000 },
                { category: "Mua sắm", amount: 2_500_000, limit: 2_000_000 },
                { category: "Nhà cửa", amount: 1_000_000, limit: 1_000_000 },
            ]).map(({ category, savingsAmount }) => ({ category, savingsAmount })),
        ).toEqual([
            { category: "Di chuyển", savingsAmount: 1_200_000 },
            { category: "Ăn uống", savingsAmount: 500_000 },
        ]);
    });

    it("normalizes invalid values without inventing a savings candidate", () => {
        expect(
            getBudgetSavingsCandidates([
                { category: "Không hợp lệ", amount: Number.NaN, limit: -1 },
                { category: "Còn dư", amount: "250000", limit: "1000000" },
            ]).map(({ category, savingsAmount }) => ({ category, savingsAmount })),
        ).toEqual([{ category: "Còn dư", savingsAmount: 750_000 }]);
    });
});
