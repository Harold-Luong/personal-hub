import { describe, expect, it, vi } from "vitest";
import {
    buildTrimAudioArgs,
    parseEncoderCapabilities,
    processMedia,
} from "./mediaProcessor";
import {
    MEDIA_OPERATIONS,
    VIDEO_CUT_MODES,
} from "../constants/mediaCutterConstants";

const allCapabilities = {
    aac: true,
    libmp3lame: true,
    libx264: true,
    mpeg4: true,
};

describe("mediaProcessor", () => {
    it("builds trim-audio arguments with a 60-second relative duration", () => {
        expect(buildTrimAudioArgs({
            bitrate: 192,
            endTime: 80,
            input: "input.mp4",
            output: "output.mp3",
            startTime: 20,
        })).toEqual([
            "-ss",
            "00:00:20.000",
            "-i",
            "input.mp4",
            "-t",
            "00:01:00.000",
            "-map",
            "0:a:0",
            "-vn",
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "192k",
            "output.mp3",
        ]);
    });

    it("detects the encoders reported by the loaded FFmpeg build", () => {
        const capabilities = parseEncoderCapabilities("A..... aac\nA..... libmp3lame\nV..... libx264\nV..... mpeg4");
        expect(capabilities).toEqual(allCapabilities);
    });

    it("processes media through a mocked FFmpeg filesystem without loading WASM", async () => {
        const ffmpeg = {
            deleteFile: vi.fn().mockResolvedValue(true),
            ffprobe: vi.fn().mockResolvedValue(0),
            off: vi.fn(),
            on: vi.fn(),
            readFile: vi.fn((filename, encoding) => Promise.resolve(
                encoding === "utf8" ? "aac" : new Uint8Array([1, 2, 3]),
            )),
            writeFile: vi.fn().mockResolvedValue(true),
        };
        const execute = vi.fn().mockResolvedValue({ exitCode: 0, logs: "" });

        const result = await processMedia({
            bitrate: 192,
            capabilities: allCapabilities,
            endTime: 80,
            execute,
            fetchFileImpl: vi.fn().mockResolvedValue(new Uint8Array([7, 8, 9])),
            ffmpeg,
            file: { name: "music.mp3", size: 3, type: "audio/mpeg" },
            operation: MEDIA_OPERATIONS.TRIM_AUDIO,
            outputBasename: "music-cut",
            startTime: 20,
            videoCutMode: VIDEO_CUT_MODES.FAST,
        });

        expect(ffmpeg.writeFile).toHaveBeenCalledOnce();
        expect(ffmpeg.ffprobe).not.toHaveBeenCalled();
        expect(execute).toHaveBeenCalledOnce();
        expect(execute).toHaveBeenCalledWith(expect.arrayContaining(["-map", "0:a:0"]));
        expect(ffmpeg.writeFile.mock.calls[0][0]).toMatch(/^media-input-.*\.mp3$/);
        expect(result.filename).toBe("music-cut.mp3");
        expect(result.duration).toBe(60);
        expect(result.blob.type).toBe("audio/mpeg");
        expect(result.sourceExtension).toBe(".mp3");
        expect(ffmpeg.deleteFile).toHaveBeenCalledTimes(3);
    });

    it("falls back to ffmpeg stream inspection when ffprobe fails", async () => {
        let logHandler;
        const ffmpeg = {
            deleteFile: vi.fn().mockResolvedValue(true),
            exec: vi.fn(async () => {
                logHandler?.({ message: "Input #0, mov, from 'media-input.mp4':" });
                logHandler?.({ message: "  Stream #0:0: Video: h264" });
                logHandler?.({ message: "  Stream #0:1: Audio: aac" });
                return 1;
            }),
            ffprobe: vi.fn().mockResolvedValue(1),
            off: vi.fn((event, handler) => {
                if (event === "log" && logHandler === handler) logHandler = undefined;
            }),
            on: vi.fn((event, handler) => {
                if (event === "log") logHandler = handler;
            }),
            readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
            writeFile: vi.fn().mockResolvedValue(true),
        };
        const execute = vi.fn().mockResolvedValue({ exitCode: 0, logs: "" });

        const result = await processMedia({
            bitrate: 192,
            capabilities: allCapabilities,
            endTime: 10,
            execute,
            fetchFileImpl: vi.fn().mockResolvedValue(new Uint8Array([7, 8, 9])),
            ffmpeg,
            file: { name: "sample.mp4", size: 3, type: "video/mp4" },
            operation: MEDIA_OPERATIONS.TRIM_VIDEO,
            outputBasename: "sample-cut",
            startTime: 0,
            videoCutMode: VIDEO_CUT_MODES.ACCURATE,
        });

        expect(ffmpeg.ffprobe).toHaveBeenCalledOnce();
        expect(ffmpeg.exec).toHaveBeenCalledWith(expect.arrayContaining(["-i"]));
        expect(execute).toHaveBeenCalledOnce();
        expect(result.filename).toBe("sample-cut.mp4");
    });

    it("keeps probe logs when neither probe method can read the media", async () => {
        let logHandler;
        const ffmpeg = {
            deleteFile: vi.fn().mockResolvedValue(true),
            exec: vi.fn(async () => {
                logHandler?.({ message: "Invalid data found when processing input" });
                return 1;
            }),
            ffprobe: vi.fn(async () => {
                logHandler?.({ message: "moov atom not found" });
                return 1;
            }),
            off: vi.fn((event, handler) => {
                if (event === "log" && logHandler === handler) logHandler = undefined;
            }),
            on: vi.fn((event, handler) => {
                if (event === "log") logHandler = handler;
            }),
            writeFile: vi.fn().mockResolvedValue(true),
        };

        await expect(processMedia({
            bitrate: 192,
            capabilities: allCapabilities,
            endTime: 10,
            execute: vi.fn(),
            fetchFileImpl: vi.fn().mockResolvedValue(new Uint8Array([7, 8, 9])),
            ffmpeg,
            file: { name: "broken.mp4", size: 3, type: "video/mp4" },
            operation: MEDIA_OPERATIONS.TRIM_VIDEO,
            outputBasename: "broken-cut",
            startTime: 0,
            videoCutMode: VIDEO_CUT_MODES.ACCURATE,
        })).rejects.toMatchObject({
            code: "invalid-media",
            details: expect.stringContaining("moov atom not found"),
        });
    });
});
