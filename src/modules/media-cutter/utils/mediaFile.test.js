import { describe, expect, it } from "vitest";
import {
    MEDIA_OPERATIONS,
    MEDIA_SOURCE_TYPES,
    OUTPUT_FORMATS,
    VIDEO_CUT_MODES,
} from "../constants/mediaCutterConstants";
import {
    buildOutputFilename,
    getDefaultOutputBasename,
    getMediaSourceType,
    sanitizeOutputBasename,
} from "./mediaFile";
import { validateMediaFile, validateProcessingOptions } from "./mediaValidation";

function createFile(overrides = {}) {
    return {
        name: "sample.mp4",
        size: 1024,
        type: "video/mp4",
        ...overrides,
    };
}

describe("media file utilities", () => {
    it("sanitizes unsafe output names and normalizes the extension", () => {
        const basename = sanitizeOutputBasename("../folder\\bad\u0000name.mp4");

        expect(basename).not.toContain("..");
        expect(basename).not.toContain("/");
        expect(basename).not.toContain("\\");
        expect(buildOutputFilename({ basename: "holiday.mov", format: "mp3" })).toBe("holiday.mp3");
    });

    it("generates operation-specific default names", () => {
        expect(getDefaultOutputBasename("video-du-lich.mp4", MEDIA_OPERATIONS.TRIM_AUDIO))
            .toBe("video-du-lich-audio");
        expect(getDefaultOutputBasename("video-du-lich.mp4", MEDIA_OPERATIONS.TRIM_VIDEO))
            .toBe("video-du-lich-cut");
        expect(getDefaultOutputBasename("bai-hat.mp3", MEDIA_OPERATIONS.TRIM_AUDIO, MEDIA_SOURCE_TYPES.AUDIO))
            .toBe("bai-hat-cut");
    });

    it("validates extension, MIME type, and the active size limit", () => {
        expect(validateMediaFile(createFile())).toBe("");
        expect(validateMediaFile(createFile({ name: "music.mp3", type: "audio/mpeg" }))).toBe("");
        expect(validateMediaFile(createFile({ name: "sample.exe", type: "video/mp4" }))).toMatch(/định dạng/i);
        expect(validateMediaFile(createFile({ type: "application/octet-stream" }))).toMatch(/định dạng/i);
        expect(validateMediaFile(createFile({ name: "music.mp3", type: "video/mp4" }))).toMatch(/định dạng/i);
        expect(validateMediaFile(createFile({ size: (51 * 1024 * 1024) }), { isMobile: true }))
            .toContain("50 MB");
    });

    it("detects audio and video sources from matching extension and MIME type", () => {
        expect(getMediaSourceType(createFile())).toBe(MEDIA_SOURCE_TYPES.VIDEO);
        expect(getMediaSourceType(createFile({ name: "music.mp3", type: "audio/mpeg" })))
            .toBe(MEDIA_SOURCE_TYPES.AUDIO);
        expect(getMediaSourceType(createFile({ name: "music.mp3", type: "video/mp4" }))).toBeNull();
    });

    it("only allows trim-audio for an MP3 source", () => {
        const errors = validateProcessingOptions({
            bitrate: 192,
            duration: 30,
            endTime: 20,
            file: createFile({ name: "music.mp3", type: "audio/mpeg" }),
            isFfmpegReady: true,
            isMobile: false,
            operation: MEDIA_OPERATIONS.TRIM_VIDEO,
            outputBasename: "music-cut",
            outputFormat: OUTPUT_FORMATS.MP4,
            startTime: 5,
            videoCutMode: VIDEO_CUT_MODES.FAST,
        });

        expect(errors.operation).toMatch(/MP3/i);
    });
});
