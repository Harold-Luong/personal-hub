import { describe, expect, it } from "vitest";
import { quoteBackgrounds, quoteCategories, quotes } from "./quoteData";

const expectedCategoryOrder = [
    "life",
    "healing",
    "ancient",
    "peace",
    "family",
    "work",
    "motivation",
    "lonely",
];

describe("quoteData", () => {
    it("keeps every quote on the normalized schema and naming convention", () => {
        const quoteIds = quotes.map((quote) => quote.id);

        expect(quotes).toHaveLength(93);
        expect(new Set(quoteIds).size).toBe(quoteIds.length);

        quotes.forEach((quote) => {
            expect(Object.keys(quote)).toEqual([
                "id",
                "categoryId",
                "backgroundId",
                "author",
                "text",
                "background",
            ]);
            expect(quote.id).toMatch(new RegExp(`^${quote.categoryId}-[a-z0-9]+(?:-[a-z0-9]+)*$`));
            expect(quote.backgroundId).toBe(quote.categoryId);
            expect(quote.background).toBe(quoteBackgrounds[quote.backgroundId]);
            expect(quote.author.trim()).not.toBe("");
            expect(quote.text.trim()).not.toBe("");
        });
    });

    it("groups quotes in category order and keeps derived counts accurate", () => {
        expect([...new Set(quotes.map((quote) => quote.categoryId))]).toEqual(expectedCategoryOrder);
        expect(quoteCategories.map((category) => category.id)).toEqual(expectedCategoryOrder);

        quoteCategories.forEach((category) => {
            expect(category.count).toBe(quotes.filter((quote) => quote.categoryId === category.id).length);
        });
    });
});
