import { Camera, CameraOff, RefreshCw, SwitchCamera } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
function cameraErrorMessage(error) {
    const name = error instanceof DOMException ? error.name : "";
    if (name === "NotAllowedError" || name === "SecurityError")
        return "Quyền camera đã bị từ chối. Hãy cho phép camera trong cài đặt trình duyệt rồi thử lại.";
    if (name === "NotFoundError" || name === "DevicesNotFoundError")
        return "Không tìm thấy camera trên thiết bị này.";
    if (!window.isSecureContext)
        return "Camera chỉ hoạt động trên HTTPS hoặc localhost.";
    return "Không thể mở camera. Camera có thể đang được ứng dụng khác sử dụng.";
}
export default function QRScannerCamera({ onResult }) {
    const videoRef = useRef(null);
    const controlsRef = useRef(null);
    const streamRef = useRef(null);
    const activeRef = useRef(true);
    const requestRef = useRef(0);
    const [devices, setDevices] = useState([]);
    const [deviceId, setDeviceId] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const stopCamera = useCallback(() => {
        requestRef.current += 1;
        controlsRef.current?.stop();
        controlsRef.current = null;
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const video = videoRef.current;
        if (video?.srcObject instanceof MediaStream)
            video.srcObject.getTracks().forEach((track) => track.stop());
        if (video) {
            video.pause();
            video.srcObject = null;
        }
        setStatus("idle");
    }, []);
    useEffect(() => {
        activeRef.current = true;
        return () => { activeRef.current = false; stopCamera(); };
    }, [stopCamera]);
    const startCamera = useCallback(async (preferredDeviceId) => {
        stopCamera();
        const requestId = requestRef.current;
        const isCurrent = () => activeRef.current && requestId === requestRef.current;
        setError("");
        setStatus("starting");
        let stream;
        try {
            if (!navigator.mediaDevices?.getUserMedia)
                throw new DOMException("No camera API", "NotFoundError");
            const { BrowserQRCodeReader } = await import("@zxing/browser");
            if (!isCurrent() || !videoRef.current)
                return;
            const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 180 });
            stream = await navigator.mediaDevices.getUserMedia({
                video: preferredDeviceId ? { deviceId: { exact: preferredDeviceId } } : { facingMode: "environment" },
                audio: false,
            });
            if (!isCurrent()) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            if (!isCurrent()) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            // Give each decoder its own video so a late cleanup cannot detach the
            // next camera's live preview.
            const decodingVideo = document.createElement("video");
            decodingVideo.muted = true;
            decodingVideo.playsInline = true;
            const controls = await reader.decodeFromStream(stream, decodingVideo, (result, _error, scanControls) => {
                if (!result || !isCurrent())
                    return;
                const value = result.getText();
                scanControls.stop();
                stopCamera();
                onResult(value);
            });
            if (!isCurrent()) {
                controls.stop();
                return;
            }
            controlsRef.current = controls;
            setStatus("scanning");
            const available = await BrowserQRCodeReader.listVideoInputDevices();
            if (isCurrent()) {
                setDevices(available);
                const selected = preferredDeviceId || available.find((item) => /back|rear|environment/i.test(item.label))?.deviceId || available[0]?.deviceId || "";
                setDeviceId(selected);
            }
        }
        catch (reason) {
            stream?.getTracks().forEach((track) => track.stop());
            if (isCurrent()) {
                stopCamera();
                setError(cameraErrorMessage(reason));
            }
        }
    }, [onResult, stopCamera]);
    const switchCamera = async (nextDeviceId) => {
        setDeviceId(nextDeviceId);
        await startCamera(nextDeviceId);
    };
    return (<section className="qr-scanner-panel">
            <div className="qr-scanner-heading"><div><span>Camera scanner</span><h2>Đưa QR vào khung hình</h2><p>Hình ảnh chỉ được phân tích trong trình duyệt và không được tải lên máy chủ.</p></div><Camera aria-hidden="true" size={28}/></div>
            <div className={`qr-camera-stage is-${status}`}><video aria-label="Camera quét QR" muted playsInline ref={videoRef}/><div className="qr-camera-frame" aria-hidden="true"><i /><i /><i /><i /></div>{status === "idle" ? <div className="qr-camera-empty"><CameraOff aria-hidden="true" size={30}/><span>Camera đang tắt</span></div> : null}{status === "starting" ? <div className="qr-camera-loading"><RefreshCw aria-hidden="true" className="is-spinning" size={24}/> Đang xin quyền camera…</div> : null}</div>
            {error ? <p className="qr-alert is-error" role="alert">{error}</p> : null}
            <div className="qr-scanner-actions">{status === "idle" ? <button className="qr-primary-button" onClick={() => startCamera(deviceId)} type="button"><Camera aria-hidden="true" size={17}/> Bật camera</button> : <button className="qr-secondary-button" onClick={stopCamera} type="button"><CameraOff aria-hidden="true" size={17}/> Dừng camera</button>}{devices.length > 1 ? <label className="qr-camera-select"><SwitchCamera aria-hidden="true" size={17}/><span className="sr-only">Chọn camera</span><select aria-label="Chọn camera trước hoặc sau" onChange={(event) => switchCamera(event.target.value)} value={deviceId}>{devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}</select></label> : null}</div>
        </section>);
}
