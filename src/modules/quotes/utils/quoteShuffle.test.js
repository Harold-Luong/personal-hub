import { describe, expect, it } from "vitest";
import {
    createQuoteNavigationState,
    createShuffledQuoteIds,
    getNextQuoteNavigationState,
} from "./quoteShuffle";

function createQuotes(count) {
    return Array.from({ length: count }, (_, index) => ({ id: `quote-${index}` }));
}

describe("quoteShuffle", () => {
    it("randomizes the initial quote without changing the source array", () => {
        const quotes = createQuotes(4);
        const originalIds = quotes.map((quote) => quote.id);
        const state = createQuoteNavigationState(quotes, () => 0);

        expect(state.history).toEqual(["quote-1"]);
        expect(state.remainingQuoteIds).toEqual(["quote-2", "quote-3", "quote-0"]);
        expect(quotes.map((quote) => quote.id)).toEqual(originalIds);
    });

    it("shows every quote once before creating a new shuffled bag", () => {
        const quotes = createQuotes(90);
        let state = createQuoteNavigationState(quotes, () => 0);
        const firstCycleIds = [state.history[0]];

        for (let index = 1; index < quotes.length; index += 1) {
            state = getNextQuoteNavigationState(state, quotes, () => 0);
            firstCycleIds.push(state.history[state.historyPosition]);
        }

        expect(new Set(firstCycleIds).size).toBe(90);
        expect(firstCycleIds).toEqual(expect.arrayContaining(quotes.map((quote) => quote.id)));
        expect(state.remainingQuoteIds).toEqual([]);

        const lastQuoteId = state.history[state.historyPosition];
        state = getNextQuoteNavigationState(state, quotes, () => 0);

        expect(state.history[state.historyPosition]).not.toBe(lastQuoteId);
        expect(state.remainingQuoteIds).toHaveLength(89);
    });

    it("keeps the current quote out of the first position of a new bag", () => {
        const quotes = createQuotes(3);
        const shuffledIds = createShuffledQuoteIds(quotes, "quote-1", () => 0);

        expect(shuffledIds[0]).not.toBe("quote-1");
        expect(new Set(shuffledIds)).toEqual(new Set(quotes.map((quote) => quote.id)));
    });

    it("replays forward history without consuming another quote from the bag", () => {
        const quotes = createQuotes(5);
        let state = createQuoteNavigationState(quotes, () => 0);
        state = getNextQuoteNavigationState(state, quotes, () => 0);
        state = getNextQuoteNavigationState(state, quotes, () => 0);

        const remainingQuoteIds = state.remainingQuoteIds;
        const history = state.history;
        state = { ...state, historyPosition: 0 };
        state = getNextQuoteNavigationState(state, quotes, () => 0);

        expect(state.historyPosition).toBe(1);
        expect(state.history).toBe(history);
        expect(state.remainingQuoteIds).toBe(remainingQuoteIds);
    });

    it("handles empty and single-quote collections", () => {
        const emptyState = createQuoteNavigationState([], () => 0);
        expect(emptyState).toEqual({ history: [], historyPosition: 0, remainingQuoteIds: [] });
        expect(getNextQuoteNavigationState(emptyState, [], () => 0)).toBe(emptyState);

        const quotes = createQuotes(1);
        let singleState = createQuoteNavigationState(quotes, () => 0);
        singleState = getNextQuoteNavigationState(singleState, quotes, () => 0);

        expect(singleState.history).toEqual(["quote-0", "quote-0"]);
        expect(singleState.remainingQuoteIds).toEqual([]);
    });
});
