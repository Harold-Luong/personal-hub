const JSON_TOKEN_PATTERN = /"(?:\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})|[^"\\])*"\s*:|"(?:\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false)\b|\bnull\b/g;

function getTokenType(token) {
    if (token.startsWith('"')) {
        return token.trimEnd().endsWith(":") ? "key" : "string";
    }
    if (token === "true" || token === "false") return "boolean";
    if (token === "null") return "null";
    return "number";
}

export function tokenizeJson(source) {
    const tokens = [];
    let lastIndex = 0;

    for (const match of source.matchAll(JSON_TOKEN_PATTERN)) {
        const matchIndex = match.index ?? 0;

        if (matchIndex > lastIndex) {
            tokens.push({ text: source.slice(lastIndex, matchIndex), type: "plain" });
        }

        tokens.push({ text: match[0], type: getTokenType(match[0]) });
        lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < source.length) {
        tokens.push({ text: source.slice(lastIndex), type: "plain" });
    }

    return tokens;
}
