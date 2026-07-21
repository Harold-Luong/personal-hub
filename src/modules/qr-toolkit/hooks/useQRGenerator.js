import { useCallback, useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { buildStylingOptions } from "../lib/qrOptions";
export default function useQRGenerator(payload, style, logo) {
    const containerRef = useRef(null);
    const qrRef = useRef(null);
    const [isRendering, setIsRendering] = useState(true);
    const [testStatus, setTestStatus] = useState("idle");
    useEffect(() => {
        if (!containerRef.current)
            return;
        const container = containerRef.current;
        const instance = new QRCodeStyling(buildStylingOptions(payload, style, logo));
        qrRef.current = instance;
        instance.append(container);
        setIsRendering(false);
        return () => {
            qrRef.current = null;
            container.replaceChildren();
        };
        // The instance is created exactly once; later changes use update().
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        const renderingTimeoutId = window.setTimeout(() => {
            setIsRendering(true);
            setTestStatus("idle");
        }, 0);
        const updateTimeoutId = window.setTimeout(() => {
            qrRef.current?.update(buildStylingOptions(payload, style, logo));
            setIsRendering(false);
        }, 120);
        return () => {
            window.clearTimeout(renderingTimeoutId);
            window.clearTimeout(updateTimeoutId);
        };
    }, [logo, payload, style]);
    const testScannability = useCallback(async () => {
        if (!qrRef.current || !payload)
            return false;
        setTestStatus("testing");
        let objectUrl = "";
        try {
            const blob = await qrRef.current.getRawData("png");
            if (!(blob instanceof Blob))
                throw new Error("render-failed");
            objectUrl = URL.createObjectURL(blob);
            const { BrowserQRCodeReader } = await import("@zxing/browser");
            const result = await new BrowserQRCodeReader().decodeFromImageUrl(objectUrl);
            const success = result.getText() === payload;
            setTestStatus(success ? "success" : "error");
            return success;
        }
        catch {
            setTestStatus("error");
            return false;
        }
        finally {
            if (objectUrl)
                URL.revokeObjectURL(objectUrl);
        }
    }, [payload]);
    return { containerRef, isRendering, qrRef, testScannability, testStatus };
}
