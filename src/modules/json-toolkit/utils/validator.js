function getLineAndColumn(source, position) {
    const safePosition = Math.max(0, Math.min(position, source.length));
    const beforeError = source.slice(0, safePosition);
    const lines = beforeError.split("\n");

    return {
        column: (lines.at(-1)?.length ?? 0) + 1,
        line: lines.length,
    };
}

function getParseFailure(source, error) {
    const fallbackMessage = "JSON không hợp lệ.";
    const rawMessage = error instanceof Error ? error.message : fallbackMessage;
    const positionMatch = rawMessage.match(/position\s+(\d+)/i);
    const lineColumnMatch = rawMessage.match(/line\s+(\d+)\s+column\s+(\d+)/i);

    if (positionMatch) {
        const location = getLineAndColumn(source, Number(positionMatch[1]));

        return { isValid: false, message: "Không thể phân tích JSON tại vị trí này.", ...location };
    }

    if (lineColumnMatch) {
        return {
            column: Number(lineColumnMatch[2]),
            isValid: false,
            line: Number(lineColumnMatch[1]),
            message: "Không thể phân tích JSON tại vị trí này.",
        };
    }

    return {
        isValid: false,
        message: rawMessage === fallbackMessage
            ? fallbackMessage
            : "Không thể phân tích JSON. Hãy kiểm tra lại cú pháp.",
    };
}

export function validateJson(source) {
    if (!source.trim()) {
        return { isValid: false, message: "Hãy nhập JSON để tiếp tục." };
    }

    try {
        return { isValid: true, value: JSON.parse(source) };
    } catch (error) {
        return getParseFailure(source, error);
    }
}
