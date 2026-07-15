import { useCallback, useEffect, useRef } from "react";
import { MEDIA_SOURCE_TYPES } from "../constants/mediaCutterConstants";

const METADATA_TIMEOUT_MS = 15000;

export default function useMediaMetadata() {
    const cancelActiveRequestRef = useRef(() => {});

    const cancel = useCallback(() => {
        cancelActiveRequestRef.current();
        cancelActiveRequestRef.current = () => {};
    }, []);

    const readMetadata = useCallback((sourceUrl, sourceType = MEDIA_SOURCE_TYPES.VIDEO) => new Promise((resolve, reject) => {
        cancel();

        const media = document.createElement(
            sourceType === MEDIA_SOURCE_TYPES.AUDIO ? "audio" : "video",
        );
        let isSettled = false;
        let timeoutId;

        function cleanup() {
            window.clearTimeout(timeoutId);
            media.onloadedmetadata = null;
            media.onerror = null;
            media.removeAttribute("src");
            media.load();
            cancelActiveRequestRef.current = () => {};
        }

        function fail(error) {
            if (isSettled) return;
            isSettled = true;
            cleanup();
            reject(error);
        }

        media.preload = "metadata";
        media.onloadedmetadata = () => {
            if (isSettled) return;
            isSettled = true;
            const metadata = {
                duration: media.duration,
                height: sourceType === MEDIA_SOURCE_TYPES.VIDEO ? media.videoHeight || null : null,
                width: sourceType === MEDIA_SOURCE_TYPES.VIDEO ? media.videoWidth || null : null,
            };
            cleanup();
            resolve(metadata);
        };
        media.onerror = () => fail(new Error("metadata-error"));
        cancelActiveRequestRef.current = () => fail(new Error("metadata-cancelled"));
        timeoutId = window.setTimeout(() => fail(new Error("metadata-timeout")), METADATA_TIMEOUT_MS);
        media.src = sourceUrl;
        media.load();
    }), [cancel]);

    useEffect(() => cancel, [cancel]);

    return { cancel, readMetadata };
}
