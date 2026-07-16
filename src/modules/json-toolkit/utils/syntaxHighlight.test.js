import { describe, expect, it } from "vitest";
import { tokenizeJson } from "./syntaxHighlight";

describe("tokenizeJson", () => {
    it("identifies JSON keys and value types without changing the content", () => {
        const source = '{"name":"Hub","age":20,"active":true,"note":null}';
        const tokens = tokenizeJson(source);

        expect(tokens.map((token) => token.text).join("")).toBe(source);
        expect(tokens.filter((token) => token.type === "key")).toHaveLength(4);
        expect(tokens).toEqual(expect.arrayContaining([
            { text: '"Hub"', type: "string" },
            { text: "20", type: "number" },
            { text: "true", type: "boolean" },
            { text: "null", type: "null" },
        ]));
    });

    it("keeps incomplete JSON readable while editing", () => {
        const source = '{"valid": false, broken';

        expect(tokenizeJson(source).map((token) => token.text).join("")).toBe(source);
    });
});
