import { beforeEach, describe, expect, it } from "vitest";
import {
    MEDIA_OPERATIONS,
    MEDIA_SOURCE_TYPES,
    OUTPUT_FORMATS,
} from "../constants/mediaCutterConstants";
import { useMediaCutterStore } from "./useMediaCutterStore";

describe("useMediaCutterStore source handling", () => {
    beforeEach(() => {
        useMediaCutterStore.getState().resetAll();
    });

    it("configures an MP3 source for audio trimming", () => {
        useMediaCutterStore.getState().setSource({
            file: { name: "my-song.mp3", size: 1024, type: "audio/mpeg" },
            sourceType: MEDIA_SOURCE_TYPES.AUDIO,
            url: "blob:music",
        });

        const state = useMediaCutterStore.getState();
        expect(state.sourceType).toBe(MEDIA_SOURCE_TYPES.AUDIO);
        expect(state.operation).toBe(MEDIA_OPERATIONS.TRIM_AUDIO);
        expect(state.outputFormat).toBe(OUTPUT_FORMATS.MP3);
        expect(state.outputBasename).toBe("my-song-cut");
    });

    it("keeps the existing trim-audio default for a video source", () => {
        useMediaCutterStore.getState().setSource({
            file: { name: "holiday.mp4", size: 1024, type: "video/mp4" },
            sourceType: MEDIA_SOURCE_TYPES.VIDEO,
            url: "blob:video",
        });

        const state = useMediaCutterStore.getState();
        expect(state.sourceType).toBe(MEDIA_SOURCE_TYPES.VIDEO);
        expect(state.operation).toBe(MEDIA_OPERATIONS.TRIM_AUDIO);
        expect(state.outputBasename).toBe("holiday-audio");
    });
});
