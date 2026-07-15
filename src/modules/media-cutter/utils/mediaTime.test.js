import { describe, expect, it } from "vitest";
import {
    clampEndTime,
    clampStartTime,
    formatFfmpegTime,
    formatMediaTime,
    parseMediaTime,
    validateTimeRange,
} from "./mediaTime";

describe("mediaTime", () => {
    it("formats short and long durations", () => {
        expect(formatMediaTime(85)).toBe("01:25");
        expect(formatMediaTime(3723)).toBe("01:02:03");
        expect(formatFfmpegTime(20.25)).toBe("00:00:20.250");
    });

    it("parses MM:SS and HH:MM:SS values", () => {
        expect(parseMediaTime("01:25")).toBe(85);
        expect(parseMediaTime("01:02:03")).toBe(3723);
        expect(parseMediaTime("01:75")).toBeNull();
        expect(parseMediaTime("bad-value")).toBeNull();
    });

    it("clamps start and end while preserving a positive selection", () => {
        expect(clampStartTime(99, 80, 100)).toBeCloseTo(79.9);
        expect(clampEndTime(2, 20, 100)).toBeCloseTo(20.1);
    });

    it("validates the selected range", () => {
        expect(validateTimeRange(20, 80, 100)).toBe("");
        expect(validateTimeRange(80, 20, 100)).toMatch(/bắt đầu/);
        expect(validateTimeRange(20, 120, 100)).toMatch(/trong file/);
    });
});
