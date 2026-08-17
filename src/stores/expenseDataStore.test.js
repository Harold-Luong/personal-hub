import { describe, expect, it } from "vitest";
import { mergeExpenseMonthOption } from "./expenseDataStore";

describe("expense month option synchronization", () => {
    it("adds a historical transaction month to the matching user/year cache", () => {
        expect(
            mergeExpenseMonthOption(
                { "user-1:2026": ["2026-08", "2026-07"] },
                "user-1",
                "2026-06",
            ),
        ).toEqual({
            "user-1:2026": ["2026-08", "2026-07", "2026-06"],
        });
    });

    it("creates a separate sorted cache entry for another year", () => {
        expect(
            mergeExpenseMonthOption(
                { "user-1:2026": ["2026-08"] },
                "user-1",
                "2025-12",
            ),
        ).toEqual({
            "user-1:2025": ["2025-12"],
            "user-1:2026": ["2026-08"],
        });
    });

    it("ignores invalid month values", () => {
        const currentOptions = { "user-1:2026": ["2026-08"] };

        expect(mergeExpenseMonthOption(currentOptions, "user-1", "2026-13")).toBe(currentOptions);
    });
});
