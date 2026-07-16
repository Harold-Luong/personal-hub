import { describe, expect, it } from "vitest";
import {
    QUOTE_BACKGROUND_MAX_SIZE_BYTES,
    validateQuoteBackgroundFile,
} from "./quoteImageUpload";

describe("validateQuoteBackgroundFile", () => {
    it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s images", (type) => {
        expect(validateQuoteBackgroundFile({ size: 1024, type })).toBe("");
    });

    it("rejects unsupported file types", () => {
        expect(validateQuoteBackgroundFile({ size: 1024, type: "image/gif" }))
            .toBe("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.");
    });

    it("rejects empty images", () => {
        expect(validateQuoteBackgroundFile({ size: 0, type: "image/png" }))
            .toBe("Ảnh đang trống hoặc không thể đọc được.");
    });

    it("rejects images larger than 10 MB", () => {
        expect(validateQuoteBackgroundFile({
            size: QUOTE_BACKGROUND_MAX_SIZE_BYTES + 1,
            type: "image/jpeg",
        })).toBe("Ảnh vượt quá giới hạn 10 MB.");
    });
});
