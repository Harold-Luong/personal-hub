import { describe, expect, it } from "vitest";
import { formatByteSize, getUtf8ByteLength, MAX_JSON_INPUT_BYTES } from "./size";

describe("JSON input size helpers", () => {
    it("counts UTF-8 bytes instead of JavaScript code units", () => {
        expect(getUtf8ByteLength("abc")).toBe(3);
        expect(getUtf8ByteLength("Tiếng Việt")).toBe(14);
        expect(getUtf8ByteLength("😀")).toBe(4);
    });

    it("formats the configured input limit as 512 KB", () => {
        expect(MAX_JSON_INPUT_BYTES).toBe(524_288);
        expect(formatByteSize(MAX_JSON_INPUT_BYTES)).toBe("512 KB");
    });
});
