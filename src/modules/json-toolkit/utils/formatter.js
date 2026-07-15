import { validateJson } from "./validator";

function sortJsonValue(value) {
    if (Array.isArray(value)) {
        return value.map(sortJsonValue);
    }

    if (typeof value === "object" && value !== null) {
        return Object.keys(value)
            .sort((firstKey, secondKey) => firstKey.localeCompare(secondKey, "en", {
                numeric: true,
                sensitivity: "base",
            }))
            .reduce((sortedObject, key) => {
                sortedObject[key] = sortJsonValue(value[key]);
                return sortedObject;
            }, {});
    }

    return value;
}

function transformJson(source, spacing, transform = (value) => value) {
    const validation = validateJson(source);

    if (!validation.isValid) {
        return { error: validation, success: false };
    }

    return {
        output: JSON.stringify(transform(validation.value), null, spacing),
        success: true,
    };
}

export function formatJson(source, indentSize = 2) {
    return transformJson(source, indentSize);
}

export function minifyJson(source) {
    return transformJson(source);
}

export function sortJson(source, indentSize = 2) {
    return transformJson(source, indentSize, sortJsonValue);
}
