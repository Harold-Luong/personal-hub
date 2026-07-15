import { describe, expect, it } from "vitest";
import { compareJson, countDiffLeaves, prepareJsonDiffView } from "./diff";

describe("compareJson", () => {
    it("finds nested added, removed, and changed values", () => {
        const result = compareJson(
            { items: ["a", "b"], removed: true, user: { age: 18 } },
            { added: null, items: ["a", "c", "d"], user: { age: 20 } },
        );

        expect(countDiffLeaves(result)).toBe(5);
        expect(result.children).toEqual(expect.arrayContaining([
            expect.objectContaining({ path: "removed", type: "removed" }),
            expect.objectContaining({ path: "added", type: "added" }),
        ]));
        expect(result.children?.find((node) => node.path === "user")?.children).toContainEqual(
            expect.objectContaining({ after: 20, before: 18, path: "user.age", type: "changed" }),
        );
    });

    it("reports structurally equal documents", () => {
        const result = compareJson({ enabled: true }, { enabled: true });

        expect(result.type).toBe("equal");
        expect(countDiffLeaves(result)).toBe(0);
    });

    it("prepares aligned line highlights for both comparison editors", () => {
        const before = { removed: true, user: { age: 18 } };
        const after = { added: null, user: { age: 20 } };
        const diff = compareJson(before, after);
        const beforeView = prepareJsonDiffView(before, diff, "before", 2);
        const afterView = prepareJsonDiffView(after, diff, "after", 2);

        expect(JSON.parse(beforeView.output)).toEqual(before);
        expect(JSON.parse(afterView.output)).toEqual(after);
        expect(beforeView.lineHighlights).toEqual({ 2: "removed", 4: "changed" });
        expect(afterView.lineHighlights).toEqual({ 2: "added", 4: "changed" });
    });
});
