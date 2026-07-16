function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function appendPath(parentPath, key, isArrayItem = false) {
    if (isArrayItem) return `${parentPath}[${key}]`;
    return parentPath ? `${parentPath}.${key}` : key;
}

function compareValues(before, after, path) {
    if (Object.is(before, after)) {
        return { after, before, path, type: "equal" };
    }

    if (Array.isArray(before) && Array.isArray(after)) {
        const children = [];
        const itemCount = Math.max(before.length, after.length);

        for (let index = 0; index < itemCount; index += 1) {
            const itemPath = appendPath(path, String(index), true);

            if (index >= before.length) {
                children.push({ after: after[index], path: itemPath, type: "added" });
            } else if (index >= after.length) {
                children.push({ before: before[index], path: itemPath, type: "removed" });
            } else {
                children.push(compareValues(before[index], after[index], itemPath));
            }
        }

        const differences = children.filter((child) => child.type !== "equal");
        return differences.length
            ? { children: differences, path, type: "changed" }
            : { path, type: "equal" };
    }

    if (isRecord(before) && isRecord(after)) {
        const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
        const children = [];

        for (const key of keys) {
            const childPath = appendPath(path, key);
            const hasBefore = Object.prototype.hasOwnProperty.call(before, key);
            const hasAfter = Object.prototype.hasOwnProperty.call(after, key);

            if (!hasBefore) {
                children.push({ after: after[key], path: childPath, type: "added" });
            } else if (!hasAfter) {
                children.push({ before: before[key], path: childPath, type: "removed" });
            } else {
                children.push(compareValues(before[key], after[key], childPath));
            }
        }

        const differences = children.filter((child) => child.type !== "equal");
        return differences.length
            ? { children: differences, path, type: "changed" }
            : { path, type: "equal" };
    }

    return { after, before, path: path || "$", type: "changed" };
}

export function compareJson(before, after) {
    return compareValues(before, after, "");
}

export function countDiffLeaves(node) {
    if (node.children?.length) {
        return node.children.reduce((total, child) => total + countDiffLeaves(child), 0);
    }

    return node.type === "equal" ? 0 : 1;
}

function serializeJsonWithLineRanges(value, indentSize) {
    const lines = [];
    const ranges = new Map();

    function serialize(currentValue, path, depth, prefix = "") {
        const startLine = lines.length + 1;
        const indentation = " ".repeat(depth * indentSize);

        if (Array.isArray(currentValue)) {
            if (currentValue.length === 0) {
                lines.push(`${indentation}${prefix}[]`);
            } else {
                lines.push(`${indentation}${prefix}[`);
                currentValue.forEach((item, index) => {
                    serialize(item, appendPath(path, String(index), true), depth + 1);
                    if (index < currentValue.length - 1) {
                        lines[lines.length - 1] += ",";
                    }
                });
                lines.push(`${indentation}]`);
            }
        } else if (isRecord(currentValue)) {
            const keys = Object.keys(currentValue);

            if (keys.length === 0) {
                lines.push(`${indentation}${prefix}{}`);
            } else {
                lines.push(`${indentation}${prefix}{`);
                keys.forEach((key, index) => {
                    serialize(
                        currentValue[key],
                        appendPath(path, key),
                        depth + 1,
                        `${JSON.stringify(key)}: `,
                    );
                    if (index < keys.length - 1) {
                        lines[lines.length - 1] += ",";
                    }
                });
                lines.push(`${indentation}}`);
            }
        } else {
            lines.push(`${indentation}${prefix}${JSON.stringify(currentValue)}`);
        }

        ranges.set(path || "$", { end: lines.length, start: startLine });
    }

    serialize(value, "", 0);
    return { output: lines.join("\n"), ranges };
}

function getHighlightType(nodeType, side) {
    if (nodeType === "changed") return "changed";
    if (nodeType === "removed" && side === "before") return "removed";
    if (nodeType === "added" && side === "after") return "added";
    return null;
}

export function prepareJsonDiffView(value, diff, side, indentSize = 2) {
    const { output, ranges } = serializeJsonWithLineRanges(value, indentSize);
    const lineHighlights = {};

    function addNodeHighlights(node) {
        if (node.children?.length) {
            node.children.forEach(addNodeHighlights);
            return;
        }

        const highlightType = getHighlightType(node.type, side);
        const range = ranges.get(node.path || "$");

        if (!highlightType || !range) return;
        for (let line = range.start; line <= range.end; line += 1) {
            lineHighlights[line] = highlightType;
        }
    }

    addNodeHighlights(diff);
    return { lineHighlights, output };
}
