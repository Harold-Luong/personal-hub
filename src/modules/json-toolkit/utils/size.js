export const MAX_JSON_INPUT_BYTES = 512 * 1024;

const utf8Encoder = new TextEncoder();

export function getUtf8ByteLength(value) {
    return utf8Encoder.encode(String(value ?? "")).length;
}

export function formatByteSize(sizeInBytes) {
    const size = Math.max(0, Number(sizeInBytes) || 0);

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
