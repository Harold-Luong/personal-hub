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
    const activeRef = useRef(true);
    const [devices, setDevices] = useState([]);
    const [deviceId, setDeviceId] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const stopCamera = useCallback(() => {
        controlsRef.current?.stop();
        controlsRef.current = null;
        const video = videoRef.current;
        if (video?.srcObject instanceof MediaStream)
            video.srcObject.getTracks().forEach((track) => track.stop());
        if (video) {
            video.pause();
            video.srcObject = null;
        }
        setStatus("idle");
    }, []);
    useEffect(() => () => { activeRef.current = false; stopCamera(); }, [stopCamera]);
    const startCamera = useCallback(async (preferredDeviceId) => {
        stopCamera();
        setError("");
        setStatus("starting");
        try {
            if (!navigator.mediaDevices?.getUserMedia)
                throw new DOMException("No camera API", "NotFoundError");
            const { BrowserQRCodeReader } = await import("@zxing/browser");
            if (!activeRef.current || !videoRef.current)
                return;
            const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 180 });
            const controls = await reader.decodeFromVideoDevice(preferredDeviceId || undefined, videoRef.current, (result) => {
                if (!result || !activeRef.current)
                    return;
                const value = result.getText();
                stopCamera();
                onResult(value);
            });
            if (!activeRef.current) {
                controls.stop();
                return;
            }
            controlsRef.current = controls;
            setStatus("scanning");
            const available = await BrowserQRCodeReader.listVideoInputDevices();
            if (activeRef.current) {
                setDevices(available);
                const selected = preferredDeviceId || available.find((item) => /back|rear|environment/i.test(item.label))?.deviceId || available[0]?.deviceId || "";
                setDeviceId(selected);
            }
        }
        catch (reason) {
            stopCamera();
            if (activeRef.current)
                setError(cameraErrorMessage(reason));
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
