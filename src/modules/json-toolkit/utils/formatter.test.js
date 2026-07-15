import { describe, expect, it } from "vitest";
import { formatJson, minifyJson, sortJson } from "./formatter";
import { validateJson } from "./validator";

describe("JSON transformations", () => {
    it("formats and minifies valid JSON", () => {
        expect(formatJson('{"name":"Hub","items":[1,2]}')).toEqual({
            output: '{\n  "name": "Hub",\n  "items": [\n    1,\n    2\n  ]\n}',
            success: true,
        });
        expect(minifyJson('{ "active": true }')).toEqual({
            output: '{"active":true}',
            success: true,
        });
    });

    it("supports four-space indentation", () => {
        expect(formatJson('{"user":{"age":20}}', 4)).toEqual({
            output: '{\n    "user": {\n        "age": 20\n    }\n}',
            success: true,
        });
    });

    it("sorts object keys recursively while preserving array order", () => {
        expect(sortJson('{"z":1,"items":[{"b":2,"a":1},3],"a":{"d":4,"c":3}}')).toEqual({
            output: '{\n  "a": {\n    "c": 3,\n    "d": 4\n  },\n  "items": [\n    {\n      "a": 1,\n      "b": 2\n    },\n    3\n  ],\n  "z": 1\n}',
            success: true,
        });
    });

    it("returns a useful location without throwing for invalid JSON", () => {
        const result = validateJson('{\n  "name": "Hub",\n  broken\n}');

        expect(result.isValid).toBe(false);
        if (!result.isValid) {
            expect(result.message).toBeTruthy();
            expect(result.line).toBeGreaterThanOrEqual(2);
        }
    });
});
