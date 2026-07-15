import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, LockKeyhole, Scissors, Sparkles } from "lucide-react";
import { NavLink } from "react-router";
import MediaEmptyState from "../components/MediaEmptyState";
import MediaExportOptions from "../components/MediaExportOptions";
import MediaPreview from "../components/MediaPreview";
import MediaProcessingProgress from "../components/MediaProcessingProgress";
import MediaResultCard from "../components/MediaResultCard";
import MediaTimeline from "../components/MediaTimeline";
import MediaUploader from "../components/MediaUploader";
import {
    FFMPEG_STATUSES,
    MEDIA_OPERATIONS,
} from "../constants/mediaCutterConstants";
import useFfmpeg from "../hooks/useFfmpeg";
import useMediaMetadata from "../hooks/useMediaMetadata";
import { MediaProcessingError, processMedia } from "../services/mediaProcessor";
import { useMediaCutterStore } from "../store/useMediaCutterStore";
import { getMediaSourceType } from "../utils/mediaFile";
import { formatMediaTime } from "../utils/mediaTime";
import {
    clampEndTime,
    clampStartTime,
    parseMediaTime,
} from "../utils/mediaTime";
import {
    isMobileMediaEnvironment,
    validateMediaFile,
    validateProcessingOptions,
} from "../utils/mediaValidation";
import "../styles/media-cutter.scss";

function getProcessButtonLabel(operation) {
    if (operation === MEDIA_OPERATIONS.EXTRACT_AUDIO) return "Tách toàn bộ âm thanh";
    if (operation === MEDIA_OPERATIONS.TRIM_VIDEO) return "Cắt và xuất video";
    return "Cắt và xuất âm thanh";
}

function getUnexpectedProcessingError(error) {
    const errorText = `${error?.name ?? ""} ${error?.message ?? ""}`.toLowerCase();

    if (errorText.includes("memory") || error instanceof RangeError) {
        return "Trình duyệt không đủ bộ nhớ để xử lý file này.";
    }

    return "Không thể xử lý media. Vui lòng thử lại với một file khác.";
}

export default function MediaCutterPage() {
    const store = useMediaCutterStore();
    const {
        capabilities,
        cancel: cancelFfmpeg,
        error: ffmpegError,
        execute,
        getFfmpeg,
        isLoading: isFfmpegLoading,
        isReady: isFfmpegReady,
        load: loadFfmpeg,
        processProgress,
    } = useFfmpeg();
    const { cancel: cancelMetadata, readMetadata } = useMediaMetadata();
    const [fieldErrors, setFieldErrors] = useState({});
    const [isMobile] = useState(isMobileMediaEnvironment);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const cancellationRequestedRef = useRef(false);
    const metadataRequestIdRef = useRef(0);
    const previewCleanupRef = useRef(() => {});
    const resultUrlRef = useRef("");
    const sourceUrlRef = useRef("");
    const mediaRef = useRef(null);

    const isBusy = [FFMPEG_STATUSES.PREPARING, FFMPEG_STATUSES.PROCESSING].includes(store.ffmpegStatus);
    const currentValidationErrors = useMemo(() => validateProcessingOptions({
        bitrate: store.bitrate,
        duration: store.sourceMetadata?.duration ?? 0,
        endTime: store.endTime,
        file: store.sourceFile,
        isFfmpegReady,
        isMobile,
        operation: store.operation,
        outputBasename: store.outputBasename,
        outputFormat: store.outputFormat,
        startTime: store.startTime,
        videoCutMode: store.videoCutMode,
    }), [
        isFfmpegReady,
        isMobile,
        store.bitrate,
        store.endTime,
        store.operation,
        store.outputBasename,
        store.outputFormat,
        store.sourceFile,
        store.sourceMetadata?.duration,
        store.startTime,
        store.videoCutMode,
    ]);
    const hasRequiredCodec = store.operation === MEDIA_OPERATIONS.TRIM_VIDEO || capabilities.libmp3lame;
    const canProcess = Object.keys(currentValidationErrors).length === 0 && hasRequiredCodec && !isBusy;

    useEffect(() => () => {
        metadataRequestIdRef.current += 1;
        cancelMetadata();
        previewCleanupRef.current();
        if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    }, [cancelMetadata]);

    function revokeSourceUrl() {
        if (sourceUrlRef.current) {
            URL.revokeObjectURL(sourceUrlRef.current);
            sourceUrlRef.current = "";
        }
    }

    function revokeResultUrl() {
        if (resultUrlRef.current) {
            URL.revokeObjectURL(resultUrlRef.current);
            resultUrlRef.current = "";
        }
    }

    function stopSegmentPreview() {
        previewCleanupRef.current();
        previewCleanupRef.current = () => {};
        mediaRef.current?.pause();
        setIsPreviewing(false);
    }

    async function handleSelectFile(file) {
        if (isBusy) return;

        const fileError = validateMediaFile(file, { isMobile });

        if (fileError) {
            setFieldErrors({ file: fileError });
            return;
        }

        const sourceType = getMediaSourceType(file);

        let sourceUrl;

        try {
            sourceUrl = URL.createObjectURL(file);
        } catch {
            setFieldErrors({ file: "Không thể tạo bản xem trước cho file này." });
            return;
        }

        metadataRequestIdRef.current += 1;
        const requestId = metadataRequestIdRef.current;
        stopSegmentPreview();
        revokeSourceUrl();
        revokeResultUrl();
        sourceUrlRef.current = sourceUrl;
        setFieldErrors({});
        store.setSource({ file, sourceType, url: sourceUrl });
        store.setFfmpegStatus(FFMPEG_STATUSES.LOADING);

        try {
            const [metadataResult, ffmpegResult] = await Promise.allSettled([
                readMetadata(sourceUrl, sourceType),
                loadFfmpeg(),
            ]);

            if (requestId !== metadataRequestIdRef.current) return;

            if (metadataResult.status === "rejected") {
                throw metadataResult.reason;
            }

            const metadata = metadataResult.value;

            if (!Number.isFinite(metadata.duration) || metadata.duration <= 0) {
                throw new Error("invalid-duration");
            }

            store.setSourceMetadata(metadata);

            if (ffmpegResult.status === "rejected") {
                throw ffmpegResult.reason;
            }

            store.setFfmpegStatus(FFMPEG_STATUSES.READY);
        } catch (error) {
            if (requestId !== metadataRequestIdRef.current) return;

            const isMetadataError = ["metadata-error", "metadata-timeout", "invalid-duration"]
                .includes(error?.message);
            const message = isMetadataError
                ? "Không thể đọc thông tin media. Hãy thử một file khác."
                : "Không thể tải bộ xử lý media. Vui lòng kiểm tra kết nối và thử lại.";
            if (isMetadataError) {
                setFieldErrors((current) => ({ ...current, file: message }));
            }
            store.setError(message);
            store.setFfmpegStatus(FFMPEG_STATUSES.FAILED);
        }
    }

    function handleTimeInput(kind, value) {
        const isStart = kind === "start";
        const setInput = isStart ? store.setStartTimeInput : store.setEndTimeInput;
        setInput(value);
        const parsedValue = parseMediaTime(value);
        const duration = store.sourceMetadata?.duration ?? 0;

        if (parsedValue === null) {
            setFieldErrors((current) => ({ ...current, time: "Nhập thời gian theo định dạng MM:SS hoặc HH:MM:SS." }));
            return;
        }

        if ((isStart && parsedValue >= store.endTime) || (!isStart && parsedValue <= store.startTime) || parsedValue > duration) {
            setFieldErrors((current) => ({
                ...current,
                time: "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc và nằm trong file.",
            }));
            return;
        }

        if (isStart) store.setStartTime(parsedValue, false);
        else store.setEndTime(parsedValue, false);
        setFieldErrors((current) => ({ ...current, time: "" }));
    }

    function resetInvalidTimeInput(kind) {
        if (!fieldErrors.time) return;
        const forceHours = (store.sourceMetadata?.duration ?? 0) >= 3600;

        if (kind === "start") {
            store.setStartTimeInput(formatMediaTime(store.startTime, forceHours));
        } else {
            store.setEndTimeInput(formatMediaTime(store.endTime, forceHours));
        }
        setFieldErrors((current) => ({ ...current, time: "" }));
    }

    function handleStartSlider(value) {
        store.setStartTime(clampStartTime(value, store.endTime, store.sourceMetadata.duration));
        setFieldErrors((current) => ({ ...current, time: "" }));
    }

    function handleEndSlider(value) {
        store.setEndTime(clampEndTime(value, store.startTime, store.sourceMetadata.duration));
        setFieldErrors((current) => ({ ...current, time: "" }));
    }

    function setTimeFromPlayer(kind) {
        const currentTime = mediaRef.current?.currentTime;
        const duration = store.sourceMetadata?.duration ?? 0;

        if (!Number.isFinite(currentTime)) return;

        if (kind === "start") {
            store.setStartTime(clampStartTime(currentTime, store.endTime, duration));
        } else {
            store.setEndTime(clampEndTime(currentTime, store.startTime, duration));
        }
        setFieldErrors((current) => ({ ...current, time: "" }));
    }

    async function handlePreviewSelection() {
        const media = mediaRef.current;

        if (!media) return;
        if (isPreviewing) {
            stopSegmentPreview();
            return;
        }

        stopSegmentPreview();
        media.currentTime = store.startTime;
        let isCleaned = false;

        const cleanup = () => {
            if (isCleaned) return;
            isCleaned = true;
            media.removeEventListener("timeupdate", handleTimeUpdate);
            media.removeEventListener("ended", cleanup);
            media.removeEventListener("pause", cleanup);
            setIsPreviewing(false);
        };
        const handleTimeUpdate = () => {
            if (media.currentTime >= store.endTime) {
                media.pause();
                cleanup();
            }
        };

        previewCleanupRef.current = cleanup;
        media.addEventListener("timeupdate", handleTimeUpdate);
        media.addEventListener("ended", cleanup);
        media.addEventListener("pause", cleanup);
        setIsPreviewing(true);

        try {
            await media.play();
        } catch {
            cleanup();
            store.setError("Trình duyệt không thể phát đoạn media này.");
        }
    }

    async function handleProcess() {
        setFieldErrors(currentValidationErrors);

        const activeFfmpeg = getFfmpeg();

        if (!canProcess || !activeFfmpeg) return;

        cancellationRequestedRef.current = false;
        revokeResultUrl();
        store.setResult(null);
        store.setError("");
        store.setFfmpegStatus(FFMPEG_STATUSES.PREPARING);

        try {
            const processedResult = await processMedia({
                bitrate: store.bitrate,
                capabilities,
                endTime: store.endTime,
                execute: async (args) => {
                    store.setFfmpegStatus(FFMPEG_STATUSES.PROCESSING);
                    return execute(args);
                },
                ffmpeg: activeFfmpeg,
                file: store.sourceFile,
                operation: store.operation,
                outputBasename: store.outputBasename,
                startTime: store.startTime,
                videoCutMode: store.videoCutMode,
            });

            if (cancellationRequestedRef.current) return;

            const resultUrl = URL.createObjectURL(processedResult.blob);
            resultUrlRef.current = resultUrl;
            store.setResult({
                ...processedResult,
                duration: processedResult.duration ?? store.sourceMetadata.duration,
                size: processedResult.blob.size,
                url: resultUrl,
            });
            store.setFfmpegStatus(FFMPEG_STATUSES.COMPLETED);
        } catch (error) {
            if (cancellationRequestedRef.current) return;

            if (import.meta.env.DEV) {
                console.error("Media Cutter processing failed", {
                    code: error?.code,
                    details: error?.details,
                    error,
                    message: error?.message,
                });
            }
            const message = error instanceof MediaProcessingError
                ? error.message
                : getUnexpectedProcessingError(error);
            store.setError(message);
            store.setFfmpegStatus(FFMPEG_STATUSES.FAILED);
        }
    }

    function handleCancelProcessing() {
        cancellationRequestedRef.current = true;
        cancelFfmpeg();
        store.setError("");
        store.setFfmpegStatus(FFMPEG_STATUSES.CANCELLED);
    }

    async function handleRetryFfmpeg() {
        store.setError("");
        store.setFfmpegStatus(FFMPEG_STATUSES.LOADING);

        try {
            await loadFfmpeg();
            store.setFfmpegStatus(FFMPEG_STATUSES.READY);
        } catch {
            store.setError("Không thể tải bộ xử lý media. Vui lòng kiểm tra kết nối và thử lại.");
            store.setFfmpegStatus(FFMPEG_STATUSES.FAILED);
        }
    }

    function handleProcessAgain() {
        revokeResultUrl();
        store.resetResult();
        store.setFfmpegStatus(isFfmpegReady ? FFMPEG_STATUSES.READY : FFMPEG_STATUSES.IDLE);
    }

    function handleChooseAnother() {
        metadataRequestIdRef.current += 1;
        cancelMetadata();
        stopSegmentPreview();
        revokeSourceUrl();
        revokeResultUrl();
        setFieldErrors({});
        store.resetAll();
    }

    return (
        <main className="media-cutter-page">
            <header className="media-cutter-hero">
                <NavLink aria-label="Quay lại Personal Hub" className="media-cutter-hero__back" to="/hub">
                    <ArrowLeft aria-hidden="true" size={18} /> Hub
                </NavLink>
                <div className="media-cutter-hero__copy">
                    <span className="media-cutter-hero__eyebrow"><Sparkles aria-hidden="true" size={14} /> Media Cutter</span>
                    <h1>Tách và cắt âm thanh</h1>
                    <p>Cắt file MP3, cắt video hoặc tách âm thanh trực tiếp trên thiết bị của bạn.</p>
                </div>
                <div className="media-cutter-privacy">
                    <LockKeyhole aria-hidden="true" size={18} />
                    <span><strong>Riêng tư theo mặc định</strong>File được xử lý trực tiếp trên trình duyệt và không được tải lên máy chủ.</span>
                </div>
            </header>

            <div className="media-cutter-layout">
                <div className="media-cutter-layout__upload">
                    <MediaUploader disabled={isBusy} error={fieldErrors.file} onSelectFile={handleSelectFile} />
                    {!store.sourceFile ? <MediaEmptyState /> : null}
                </div>

                {store.sourceFile && !store.sourceMetadata ? (
                    <MediaProcessingProgress
                        canCancel={false}
                        error={store.error || ffmpegError}
                        isDeterminate={false}
                        onCancel={handleCancelProcessing}
                        onRetry={handleRetryFfmpeg}
                        progress={null}
                        status={isFfmpegLoading ? FFMPEG_STATUSES.LOADING : store.ffmpegStatus}
                    />
                ) : null}

                {store.sourceFile && store.sourceMetadata ? (
                    <div className="media-cutter-workspace">
                        {isMobile ? (
                            <p className="media-cutter-mobile-warning">
                                Xử lý file lớn trên điện thoại có thể chậm hoặc làm trình duyệt hết bộ nhớ.
                            </p>
                        ) : null}

                        <div className="media-cutter-workspace__columns">
                            <MediaPreview
                                file={store.sourceFile}
                                metadata={store.sourceMetadata}
                                ref={mediaRef}
                                sourceType={store.sourceType}
                                sourceUrl={store.sourceUrl}
                            />
                            <MediaTimeline
                                duration={store.sourceMetadata.duration}
                                endTime={store.endTime}
                                endTimeInput={store.endTimeInput}
                                error={fieldErrors.time}
                                isPreviewing={isPreviewing}
                                onEndBlur={() => resetInvalidTimeInput("end")}
                                onEndInput={(value) => handleTimeInput("end", value)}
                                onEndSlider={handleEndSlider}
                                onPreviewSelection={handlePreviewSelection}
                                onSetEndFromPlayer={() => setTimeFromPlayer("end")}
                                onSetStartFromPlayer={() => setTimeFromPlayer("start")}
                                onStartBlur={() => resetInvalidTimeInput("start")}
                                onStartInput={(value) => handleTimeInput("start", value)}
                                onStartSlider={handleStartSlider}
                                startTime={store.startTime}
                                startTimeInput={store.startTimeInput}
                            />
                        </div>

                        <MediaExportOptions
                            bitrate={store.bitrate}
                            capabilities={capabilities}
                            disabled={isBusy}
                            error={fieldErrors.output || fieldErrors.operation}
                            filenameError={fieldErrors.filename}
                            isFfmpegReady={isFfmpegReady}
                            onBitrateChange={store.setBitrate}
                            onOperationChange={store.setOperation}
                            onOutputBasenameChange={store.setOutputBasename}
                            onVideoCutModeChange={store.setVideoCutMode}
                            operation={store.operation}
                            outputBasename={store.outputBasename}
                            outputFormat={store.outputFormat}
                            sourceType={store.sourceType}
                            videoCutMode={store.videoCutMode}
                        />

                        <MediaProcessingProgress
                            canCancel={isBusy}
                            error={store.error || ffmpegError || fieldErrors.ffmpeg}
                            isDeterminate={store.operation === MEDIA_OPERATIONS.EXTRACT_AUDIO}
                            onCancel={handleCancelProcessing}
                            onRetry={handleRetryFfmpeg}
                            progress={processProgress}
                            status={isFfmpegLoading ? FFMPEG_STATUSES.LOADING : store.ffmpegStatus}
                        />

                        <button
                            className="media-cutter-process-button"
                            disabled={!canProcess}
                            onClick={handleProcess}
                            type="button"
                        >
                            <Scissors aria-hidden="true" size={18} />
                            {getProcessButtonLabel(store.operation)}
                        </button>

                        {store.result ? (
                            <MediaResultCard
                                onChooseAnother={handleChooseAnother}
                                onProcessAgain={handleProcessAgain}
                                result={store.result}
                            />
                        ) : null}
                    </div>
                ) : null}
            </div>
        </main>
    );
}
