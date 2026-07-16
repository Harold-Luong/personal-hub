import { describe, expect, it } from "vitest";
import { compareText, findCharacterChanges } from "./textDiff";

describe("findCharacterChanges", () => {
    it("đánh dấu riêng nhiều cụm ký tự thay đổi trên cùng một dòng", () => {
        expect(findCharacterChanges("foo cat bar dog", "foo cut bar dig")).toEqual({
            before: [
                { start: 5, end: 6, tone: "removed" },
                { start: 13, end: 14, tone: "removed" },
            ],
            after: [
                { start: 5, end: 6, tone: "added" },
                { start: 13, end: 14, tone: "added" },
            ],
        });
    });

    it("đánh dấu đúng ký tự Unicode dù emoji dùng hai UTF-16 code units", () => {
        expect(findCharacterChanges("a😀b", "a😃b")).toEqual({
            before: [{ start: 1, end: 3, tone: "removed" }],
            after: [{ start: 1, end: 3, tone: "added" }],
        });
    });

    it("chỉ đánh dấu phần được chèn trong dòng", () => {
        expect(findCharacterChanges("Hello world", "Hello brave world")).toEqual({
            before: [],
            after: [{ start: 6, end: 12, tone: "added" }],
        });
    });

    it("không cấp phát ma trận lớn cho dòng rất dài", () => {
        const beforeText = `start-${"a".repeat(2_100)}-end`;
        const afterText = `start-${"b".repeat(2_100)}-end`;

        expect(findCharacterChanges(beforeText, afterText)).toEqual({
            before: [{ start: 6, end: 2_106, tone: "removed" }],
            after: [{ start: 6, end: 2_106, tone: "added" }],
        });
    });
});

describe("compareText", () => {
    it("nhận biết hai văn bản giống nhau", () => {
        const result = compareText("dòng một\ndòng hai", "dòng một\ndòng hai");

        expect(result.isEqual).toBe(true);
        expect(result.changes).toEqual([]);
    });

    it("đánh dấu dòng bị thay đổi ở cả hai phía", () => {
        const result = compareText("alpha\nbeta", "alpha\ngamma");

        expect(result.changes).toEqual([{
            type: "changed",
            beforeLine: 2,
            afterLine: 2,
            beforeText: "beta",
            afterText: "gamma",
        }]);
        expect(result.beforeHighlights).toEqual({ 2: "changed" });
        expect(result.afterHighlights).toEqual({ 2: "changed" });
        expect(result.beforeCharacterHighlights).toEqual({
            2: [{ start: 0, end: 3, tone: "removed" }],
        });
        expect(result.afterCharacterHighlights).toEqual({
            2: [{ start: 0, end: 4, tone: "added" }],
        });
    });

    it("không làm lệch các dòng sau một dòng được chèn", () => {
        const result = compareText("alpha\nbeta\ngamma", "alpha\nnew\nbeta\ngamma");

        expect(result.changes).toEqual([{
            type: "added",
            afterLine: 2,
            afterText: "new",
        }]);
        expect(result.summary).toEqual({ added: 1, removed: 0, changed: 0 });
        expect(result.afterCharacterHighlights).toEqual({
            2: [{ start: 0, end: 3, tone: "added" }],
        });
    });

    it("nhận biết dòng bị xóa", () => {
        const result = compareText("alpha\nold\nbeta", "alpha\nbeta");

        expect(result.changes).toEqual([{
            type: "removed",
            beforeLine: 2,
            beforeText: "old",
        }]);
    });

    it("coi CRLF và LF là cùng một kiểu xuống dòng", () => {
        expect(compareText("alpha\r\nbeta", "alpha\nbeta").isEqual).toBe(true);
    });

    it("so sánh được văn bản trống", () => {
        expect(compareText("", "").isEqual).toBe(true);
        expect(compareText("", "alpha").changes).toEqual([{
            type: "added",
            afterLine: 1,
            afterText: "alpha",
        }]);
    });
});
