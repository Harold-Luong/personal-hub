function swap(items, firstIndex, secondIndex) {
    [items[firstIndex], items[secondIndex]] = [items[secondIndex], items[firstIndex]];
}

export function createShuffledQuoteIds(availableQuotes, excludedFirstId = null, random = Math.random) {
    const shuffledQuoteIds = availableQuotes.map((quote) => quote.id);

    for (let index = shuffledQuoteIds.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        swap(shuffledQuoteIds, index, swapIndex);
    }

    if (shuffledQuoteIds.length > 1 && shuffledQuoteIds[0] === excludedFirstId) {
        const swapIndex = 1 + Math.floor(random() * (shuffledQuoteIds.length - 1));
        swap(shuffledQuoteIds, 0, swapIndex);
    }

    return shuffledQuoteIds;
}

export function createQuoteNavigationState(availableQuotes, random = Math.random) {
    const shuffledQuoteIds = createShuffledQuoteIds(availableQuotes, null, random);
    const initialQuoteId = shuffledQuoteIds[0] ?? null;

    return {
        history: initialQuoteId ? [initialQuoteId] : [],
        historyPosition: 0,
        remainingQuoteIds: shuffledQuoteIds.slice(1),
    };
}

export function getNextQuoteNavigationState(currentState, availableQuotes, random = Math.random) {
    if (currentState.historyPosition < currentState.history.length - 1) {
        return {
            ...currentState,
            historyPosition: currentState.historyPosition + 1,
        };
    }

    let remainingQuoteIds = currentState.remainingQuoteIds;

    if (remainingQuoteIds.length === 0) {
        const currentQuoteId = currentState.history[currentState.historyPosition] ?? null;
        remainingQuoteIds = createShuffledQuoteIds(availableQuotes, currentQuoteId, random);
    }

    const [nextQuoteId, ...nextRemainingQuoteIds] = remainingQuoteIds;

    if (!nextQuoteId) {
        return currentState;
    }

    return {
        history: [...currentState.history, nextQuoteId],
        historyPosition: currentState.historyPosition + 1,
        remainingQuoteIds: nextRemainingQuoteIds,
    };
}
