import { useCallback, useEffect, useRef, useState } from "react";
import { parseEncoderCapabilities } from "../services/mediaProcessor";

const EMPTY_CAPABILITIES = {
    aac: false,
    libmp3lame: false,
    libx264: false,
    mpeg4: false,
};

function toUserLoadError(error) {
    if (error instanceof WebAssembly.CompileError || error instanceof WebAssembly.LinkError) {
        return "Trình duyệt này không thể khởi tạo WebAssembly cho FFmpeg.";
    }

    return "Không thể tải bộ xử lý media. Vui lòng kiểm tra kết nối và thử lại.";
}

async function inspectEncoderCapabilities(ffmpeg) {
    const messages = [];
    const logHandler = ({ message }) => messages.push(message);
    ffmpeg.on("log", logHandler);

    try {
        await ffmpeg.exec(["-hide_banner", "-encoders"]);
        return parseEncoderCapabilities(messages.join("\n"));
    } finally {
        ffmpeg.off("log", logHandler);
    }
}

export default function useFfmpeg() {
    const ffmpegRef = useRef(null);
    const loadPromiseRef = useRef(null);
    const isMountedRef = useRef(true);
    const [capabilities, setCapabilities] = useState(EMPTY_CAPABILITIES);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [processProgress, setProcessProgress] = useState(null);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            ffmpegRef.current?.terminate();
            ffmpegRef.current = null;
            loadPromiseRef.current = null;
        };
    }, []);

    const load = useCallback(async () => {
        if (ffmpegRef.current?.loaded) {
            return ffmpegRef.current;
        }

        if (loadPromiseRef.current) {
            return loadPromiseRef.current;
        }

        if (typeof WebAssembly === "undefined") {
            const browserError = "Trình duyệt này không hỗ trợ WebAssembly.";
            setError(browserError);
            throw new Error(browserError);
        }

        setError("");
        setIsLoading(true);
        loadPromiseRef.current = (async () => {
            try {
                const [{ FFmpeg }, coreModule, wasmModule] = await Promise.all([
                    import("@ffmpeg/ffmpeg"),
                    import("@ffmpeg/core?url"),
                    import("@ffmpeg/core/wasm?url"),
                ]);
                const ffmpeg = new FFmpeg();
                ffmpegRef.current = ffmpeg;
                await ffmpeg.load({
                    coreURL: coreModule.default,
                    wasmURL: wasmModule.default,
                });
                const encoderCapabilities = await inspectEncoderCapabilities(ffmpeg);

                if (isMountedRef.current) {
                    setCapabilities(encoderCapabilities);
                    setIsReady(true);
                }

                return ffmpeg;
            } catch (loadError) {
                ffmpegRef.current?.terminate();
                ffmpegRef.current = null;
                const message = toUserLoadError(loadError);

                if (isMountedRef.current) {
                    setError(message);
                    setIsReady(false);
                }

                throw loadError;
            } finally {
                loadPromiseRef.current = null;

                if (isMountedRef.current) {
                    setIsLoading(false);
                }
            }
        })();

        return loadPromiseRef.current;
    }, []);

    const execute = useCallback(async (args) => {
        const ffmpeg = ffmpegRef.current;

        if (!ffmpeg?.loaded) {
            throw new Error("ffmpeg-not-ready");
        }

        const logMessages = [];
        const logHandler = ({ message }) => logMessages.push(message);
        const progressHandler = ({ progress }) => {
            if (!Number.isFinite(progress)) {
                return;
            }

            const normalizedProgress = Math.min(1, Math.max(0, progress));
            setProcessProgress((currentProgress) => Math.max(currentProgress ?? 0, normalizedProgress));
        };

        setProcessProgress(0);
        ffmpeg.on("log", logHandler);
        ffmpeg.on("progress", progressHandler);

        try {
            const exitCode = await ffmpeg.exec(args);
            return { exitCode, logs: logMessages.join("\n") };
        } finally {
            ffmpeg.off("log", logHandler);
            ffmpeg.off("progress", progressHandler);
        }
    }, []);

    const cancel = useCallback(() => {
        if (!ffmpegRef.current) {
            return false;
        }

        ffmpegRef.current.terminate();
        ffmpegRef.current = null;
        loadPromiseRef.current = null;
        setIsReady(false);
        setIsLoading(false);
        setProcessProgress(null);
        return true;
    }, []);

    const reset = useCallback(() => {
        ffmpegRef.current?.terminate();
        ffmpegRef.current = null;
        loadPromiseRef.current = null;
        setCapabilities(EMPTY_CAPABILITIES);
        setError("");
        setIsLoading(false);
        setIsReady(false);
        setProcessProgress(null);
    }, []);

    const getFfmpeg = useCallback(() => ffmpegRef.current, []);

    return {
        cancel,
        capabilities,
        error,
        execute,
        getFfmpeg,
        isLoading,
        isReady,
        load,
        loadProgress: null,
        processProgress,
        reset,
    };
}
