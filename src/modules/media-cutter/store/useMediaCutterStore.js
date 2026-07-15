import { create } from "zustand";
import {
    DEFAULT_AUDIO_BITRATE,
    DEFAULT_OPERATION,
    DEFAULT_VIDEO_CUT_MODE,
    FFMPEG_STATUSES,
} from "../constants/mediaCutterConstants";
import {
    getDefaultOutputBasename,
    getOutputFormatForOperation,
} from "../utils/mediaFile";
import { formatMediaTime } from "../utils/mediaTime";

const initialMediaCutterState = {
    bitrate: DEFAULT_AUDIO_BITRATE,
    endTime: 0,
    endTimeInput: "00:00",
    error: "",
    ffmpegStatus: FFMPEG_STATUSES.IDLE,
    operation: DEFAULT_OPERATION,
    outputBasename: "media-output-audio",
    outputFormat: getOutputFormatForOperation(DEFAULT_OPERATION),
    progress: null,
    result: null,
    sourceFile: null,
    sourceMetadata: null,
    sourceType: null,
    sourceUrl: "",
    startTime: 0,
    startTimeInput: "00:00",
    videoCutMode: DEFAULT_VIDEO_CUT_MODE,
};

export const useMediaCutterStore = create((set) => ({
    ...initialMediaCutterState,
    resetAll: () => set(initialMediaCutterState),
    resetResult: () => set((state) => ({
        error: "",
        ffmpegStatus: state.ffmpegStatus === FFMPEG_STATUSES.CANCELLED
            ? FFMPEG_STATUSES.IDLE
            : state.ffmpegStatus,
        progress: null,
        result: null,
    })),
    setBitrate: (bitrate) => set({ bitrate: Number(bitrate), result: null }),
    setEndTime: (endTime, syncInput = true) => set((state) => ({
        endTime,
        ...(syncInput ? {
            endTimeInput: formatMediaTime(endTime, (state.sourceMetadata?.duration ?? 0) >= 3600),
        } : {}),
        result: null,
    })),
    setEndTimeInput: (endTimeInput) => set({ endTimeInput }),
    setError: (error) => set({ error }),
    setFfmpegStatus: (ffmpegStatus) => set({ ffmpegStatus }),
    setOperation: (operation) => set((state) => ({
        operation,
        outputBasename: getDefaultOutputBasename(
            state.sourceFile?.name ?? "media-output",
            operation,
            state.sourceType,
        ),
        outputFormat: getOutputFormatForOperation(operation),
        result: null,
    })),
    setOutputBasename: (outputBasename) => set({ outputBasename, result: null }),
    setProgress: (progress) => set({ progress }),
    setResult: (result) => set({ result }),
    setSource: ({ file, sourceType, url }) => set({
        endTime: 0,
        endTimeInput: "00:00",
        error: "",
        ffmpegStatus: FFMPEG_STATUSES.IDLE,
        operation: DEFAULT_OPERATION,
        outputBasename: getDefaultOutputBasename(file.name, DEFAULT_OPERATION, sourceType),
        outputFormat: getOutputFormatForOperation(DEFAULT_OPERATION),
        progress: null,
        result: null,
        sourceFile: file,
        sourceMetadata: null,
        sourceType,
        sourceUrl: url,
        startTime: 0,
        startTimeInput: "00:00",
    }),
    setSourceMetadata: (sourceMetadata) => {
        const duration = sourceMetadata?.duration ?? 0;
        set({
            endTime: duration,
            endTimeInput: formatMediaTime(duration, duration >= 3600),
            sourceMetadata,
            startTime: 0,
            startTimeInput: formatMediaTime(0, duration >= 3600),
        });
    },
    setStartTime: (startTime, syncInput = true) => set((state) => ({
        result: null,
        startTime,
        ...(syncInput ? {
            startTimeInput: formatMediaTime(startTime, (state.sourceMetadata?.duration ?? 0) >= 3600),
        } : {}),
    })),
    setStartTimeInput: (startTimeInput) => set({ startTimeInput }),
    setVideoCutMode: (videoCutMode) => set({ result: null, videoCutMode }),
}));

export const selectMediaCutterState = (state) => state;
