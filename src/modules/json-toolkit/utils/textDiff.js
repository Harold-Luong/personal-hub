function splitLines(value) {
    const normalizedValue = String(value ?? "").replace(/\r\n?/g, "\n");
    return normalizedValue === "" ? [] : normalizedValue.split("\n");
}

const MAX_CHARACTER_DIFF_CELLS = 250_000;
const MAX_CHARACTER_DIFF_LENGTH = 2_000;

function changedFlagsToRanges(characters, changedFlags, tone) {
    const offsets = [0];
    characters.forEach((character) => offsets.push(offsets[offsets.length - 1] + character.length));

    const ranges = [];
    let rangeStart = -1;

    for (let index = 0; index <= characters.length; index += 1) {
        if (changedFlags[index] && rangeStart < 0) {
            rangeStart = index;
        } else if (!changedFlags[index] && rangeStart >= 0) {
            ranges.push({ start: offsets[rangeStart], end: offsets[index], tone });
            rangeStart = -1;
        }
    }

    return ranges;
}

export function findCharacterChanges(beforeText, afterText) {
    const beforeCharacters = Array.from(beforeText);
    const afterCharacters = Array.from(afterText);
    const beforeChanged = new Uint8Array(beforeCharacters.length);
    const afterChanged = new Uint8Array(afterCharacters.length);
    let commonPrefixLength = 0;

    while (
        commonPrefixLength < beforeCharacters.length
        && commonPrefixLength < afterCharacters.length
        && beforeCharacters[commonPrefixLength] === afterCharacters[commonPrefixLength]
    ) {
        commonPrefixLength += 1;
    }

    let commonSuffixLength = 0;
    while (
        commonSuffixLength < beforeCharacters.length - commonPrefixLength
        && commonSuffixLength < afterCharacters.length - commonPrefixLength
        && beforeCharacters[beforeCharacters.length - commonSuffixLength - 1]
            === afterCharacters[afterCharacters.length - commonSuffixLength - 1]
    ) {
        commonSuffixLength += 1;
    }

    const beforeMiddleStart = commonPrefixLength;
    const beforeMiddleEnd = beforeCharacters.length - commonSuffixLength;
    const afterMiddleStart = commonPrefixLength;
    const afterMiddleEnd = afterCharacters.length - commonSuffixLength;
    const beforeMiddleLength = beforeMiddleEnd - beforeMiddleStart;
    const afterMiddleLength = afterMiddleEnd - afterMiddleStart;

    if (beforeMiddleLength === 0 || afterMiddleLength === 0) {
        beforeChanged.fill(1, beforeMiddleStart, beforeMiddleEnd);
        afterChanged.fill(1, afterMiddleStart, afterMiddleEnd);
    } else if (
        beforeMiddleLength <= MAX_CHARACTER_DIFF_LENGTH
        && afterMiddleLength <= MAX_CHARACTER_DIFF_LENGTH
        && beforeMiddleLength * afterMiddleLength <= MAX_CHARACTER_DIFF_CELLS
    ) {
        const longestCommonSubsequence = Array.from(
            { length: beforeMiddleLength + 1 },
            () => new Uint32Array(afterMiddleLength + 1),
        );

        for (let beforeIndex = beforeMiddleLength - 1; beforeIndex >= 0; beforeIndex -= 1) {
            for (let afterIndex = afterMiddleLength - 1; afterIndex >= 0; afterIndex -= 1) {
                if (beforeCharacters[beforeMiddleStart + beforeIndex] === afterCharacters[afterMiddleStart + afterIndex]) {
                    longestCommonSubsequence[beforeIndex][afterIndex]
                        = longestCommonSubsequence[beforeIndex + 1][afterIndex + 1] + 1;
                } else {
                    longestCommonSubsequence[beforeIndex][afterIndex] = Math.max(
                        longestCommonSubsequence[beforeIndex + 1][afterIndex],
                        longestCommonSubsequence[beforeIndex][afterIndex + 1],
                    );
                }
            }
        }

        let beforeIndex = 0;
        let afterIndex = 0;

        while (beforeIndex < beforeMiddleLength || afterIndex < afterMiddleLength) {
            if (
                beforeIndex < beforeMiddleLength
                && afterIndex < afterMiddleLength
                && beforeCharacters[beforeMiddleStart + beforeIndex] === afterCharacters[afterMiddleStart + afterIndex]
            ) {
                beforeIndex += 1;
                afterIndex += 1;
            } else if (
                afterIndex >= afterMiddleLength
                || (
                    beforeIndex < beforeMiddleLength
                    && longestCommonSubsequence[beforeIndex + 1][afterIndex]
                        >= longestCommonSubsequence[beforeIndex][afterIndex + 1]
                )
            ) {
                beforeChanged[beforeMiddleStart + beforeIndex] = 1;
                beforeIndex += 1;
            } else {
                afterChanged[afterMiddleStart + afterIndex] = 1;
                afterIndex += 1;
            }
        }
    } else {
        beforeChanged.fill(1, beforeMiddleStart, beforeMiddleEnd);
        afterChanged.fill(1, afterMiddleStart, afterMiddleEnd);
    }

    return {
        before: changedFlagsToRanges(beforeCharacters, beforeChanged, "removed"),
        after: changedFlagsToRanges(afterCharacters, afterChanged, "added"),
    };
}

function findLongestIncreasingAnchors(pairs) {
    if (pairs.length === 0) return [];

    const tails = [];
    const previous = new Array(pairs.length).fill(-1);

    pairs.forEach((pair, pairIndex) => {
        let low = 0;
        let high = tails.length;

        while (low < high) {
            const middle = Math.floor((low + high) / 2);
            if (pairs[tails[middle]].afterIndex < pair.afterIndex) low = middle + 1;
            else high = middle;
        }

        if (low > 0) previous[pairIndex] = tails[low - 1];
        tails[low] = pairIndex;
    });

    const anchors = [];
    let currentIndex = tails[tails.length - 1];

    while (currentIndex >= 0) {
        anchors.push(pairs[currentIndex]);
        currentIndex = previous[currentIndex];
    }

    return anchors.reverse();
}

function findUniqueAnchors(beforeLines, beforeStart, beforeEnd, afterLines, afterStart, afterEnd) {
    const beforeOccurrences = new Map();
    const afterOccurrences = new Map();

    for (let index = beforeStart; index < beforeEnd; index += 1) {
        const line = beforeLines[index];
        const occurrence = beforeOccurrences.get(line);
        beforeOccurrences.set(line, occurrence ? { count: occurrence.count + 1, index } : { count: 1, index });
    }

    for (let index = afterStart; index < afterEnd; index += 1) {
        const line = afterLines[index];
        const occurrence = afterOccurrences.get(line);
        afterOccurrences.set(line, occurrence ? { count: occurrence.count + 1, index } : { count: 1, index });
    }

    const pairs = [];
    beforeOccurrences.forEach((beforeOccurrence, line) => {
        const afterOccurrence = afterOccurrences.get(line);

        if (beforeOccurrence.count === 1 && afterOccurrence?.count === 1) {
            pairs.push({
                beforeIndex: beforeOccurrence.index,
                afterIndex: afterOccurrence.index,
            });
        }
    });

    pairs.sort((left, right) => left.beforeIndex - right.beforeIndex);
    return findLongestIncreasingAnchors(pairs);
}

function collectChanges(beforeLines, initialBeforeStart, initialBeforeEnd, afterLines, initialAfterStart, initialAfterEnd, changes) {
    let beforeStart = initialBeforeStart;
    let beforeEnd = initialBeforeEnd;
    let afterStart = initialAfterStart;
    let afterEnd = initialAfterEnd;

    while (beforeStart < beforeEnd && afterStart < afterEnd && beforeLines[beforeStart] === afterLines[afterStart]) {
        beforeStart += 1;
        afterStart += 1;
    }

    while (beforeStart < beforeEnd && afterStart < afterEnd && beforeLines[beforeEnd - 1] === afterLines[afterEnd - 1]) {
        beforeEnd -= 1;
        afterEnd -= 1;
    }

    if (beforeStart === beforeEnd) {
        for (let index = afterStart; index < afterEnd; index += 1) {
            changes.push({
                type: "added",
                afterLine: index + 1,
                afterText: afterLines[index],
            });
        }
        return;
    }

    if (afterStart === afterEnd) {
        for (let index = beforeStart; index < beforeEnd; index += 1) {
            changes.push({
                type: "removed",
                beforeLine: index + 1,
                beforeText: beforeLines[index],
            });
        }
        return;
    }

    const anchors = findUniqueAnchors(beforeLines, beforeStart, beforeEnd, afterLines, afterStart, afterEnd);

    if (anchors.length > 0) {
        let nextBeforeStart = beforeStart;
        let nextAfterStart = afterStart;

        anchors.forEach((anchor) => {
            collectChanges(
                beforeLines,
                nextBeforeStart,
                anchor.beforeIndex,
                afterLines,
                nextAfterStart,
                anchor.afterIndex,
                changes,
            );
            nextBeforeStart = anchor.beforeIndex + 1;
            nextAfterStart = anchor.afterIndex + 1;
        });

        collectChanges(beforeLines, nextBeforeStart, beforeEnd, afterLines, nextAfterStart, afterEnd, changes);
        return;
    }

    const pairedLineCount = Math.min(beforeEnd - beforeStart, afterEnd - afterStart);

    for (let offset = 0; offset < pairedLineCount; offset += 1) {
        const beforeIndex = beforeStart + offset;
        const afterIndex = afterStart + offset;

        if (beforeLines[beforeIndex] !== afterLines[afterIndex]) {
            changes.push({
                type: "changed",
                beforeLine: beforeIndex + 1,
                afterLine: afterIndex + 1,
                beforeText: beforeLines[beforeIndex],
                afterText: afterLines[afterIndex],
            });
        }
    }

    for (let index = beforeStart + pairedLineCount; index < beforeEnd; index += 1) {
        changes.push({ type: "removed", beforeLine: index + 1, beforeText: beforeLines[index] });
    }

    for (let index = afterStart + pairedLineCount; index < afterEnd; index += 1) {
        changes.push({ type: "added", afterLine: index + 1, afterText: afterLines[index] });
    }
}

export function compareText(beforeValue, afterValue) {
    const beforeLines = splitLines(beforeValue);
    const afterLines = splitLines(afterValue);
    const changes = [];

    collectChanges(beforeLines, 0, beforeLines.length, afterLines, 0, afterLines.length, changes);

    const beforeHighlights = {};
    const afterHighlights = {};
    const beforeCharacterHighlights = {};
    const afterCharacterHighlights = {};
    const summary = { added: 0, removed: 0, changed: 0 };

    changes.forEach((change) => {
        summary[change.type] += 1;

        if (change.beforeLine) beforeHighlights[change.beforeLine] = change.type;
        if (change.afterLine) afterHighlights[change.afterLine] = change.type;

        if (change.type === "changed") {
            const characterChanges = findCharacterChanges(change.beforeText, change.afterText);
            if (characterChanges.before.length > 0) beforeCharacterHighlights[change.beforeLine] = characterChanges.before;
            if (characterChanges.after.length > 0) afterCharacterHighlights[change.afterLine] = characterChanges.after;
        } else if (change.type === "removed" && change.beforeText.length > 0) {
            beforeCharacterHighlights[change.beforeLine] = [{ start: 0, end: change.beforeText.length, tone: "removed" }];
        } else if (change.type === "added" && change.afterText.length > 0) {
            afterCharacterHighlights[change.afterLine] = [{ start: 0, end: change.afterText.length, tone: "added" }];
        }
    });

    return {
        isEqual: changes.length === 0,
        changes,
        summary,
        beforeHighlights,
        afterHighlights,
        beforeCharacterHighlights,
        afterCharacterHighlights,
    };
}
