import { FileImage, ImageUp, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MAX_SCAN_IMAGE_BYTES } from "../constants/qrPresets";
export default function QRScannerImage({ onResult }) {
    const inputRef = useRef(null);
    const objectUrlRef = useRef("");
    const [preview, setPreview] = useState("");
    const [filename, setFilename] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState("");
    const clearImage = () => {
        if (objectUrlRef.current)
            URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
        setPreview("");
        setFilename("");
        setError("");
        if (inputRef.current)
            inputRef.current.value = "";
    };
    useEffect(() => clearImage, []);
    const scanFile = async (file) => {
        if (!file)
            return;
        setError("");
        const allowed = ["image/png", "image/jpeg", "image/webp"];
        if (!allowed.includes(file.type)) {
            setError("Ảnh phải là PNG, JPG, JPEG hoặc WEBP.");
            return;
        }
        if (file.size > MAX_SCAN_IMAGE_BYTES) {
            setError("Ảnh quét không được vượt quá 10 MB.");
            return;
        }
        clearImage();
        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;
        setPreview(objectUrl);
        setFilename(file.name);
        setIsScanning(true);
        try {
            const { BrowserQRCodeReader } = await import("@zxing/browser");
            const result = await new BrowserQRCodeReader().decodeFromImageUrl(objectUrl);
            onResult(result.getText());
        }
        catch {
            setError("Không tìm thấy QR Code trong ảnh. Hãy thử ảnh rõ hơn, đủ sáng và không bị cắt góc.");
        }
        finally {
            setIsScanning(false);
        }
    };
    return (<section className="qr-scanner-panel">
            <div className="qr-scanner-heading"><div><span>Image scanner</span><h2>Quét QR từ ảnh</h2><p>Hỗ trợ PNG, JPG và WEBP tối đa 10 MB.</p></div><FileImage aria-hidden="true" size={28}/></div>
            {!preview ? <button className={`qr-image-dropzone${isDragging ? " is-dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setIsDragging(false); scanFile(event.dataTransfer.files[0]); }} type="button"><ImageUp aria-hidden="true" size={34}/><strong>Kéo thả ảnh QR vào đây</strong><span>hoặc bấm để chọn ảnh từ máy</span></button> : <div className="qr-image-preview"><img alt={`Ảnh đang quét: ${filename}`} src={preview}/>{isScanning ? <div><RefreshCw aria-hidden="true" className="is-spinning" size={22}/> Đang phân tích QR…</div> : null}<button aria-label="Chọn ảnh khác" className="qr-icon-button" onClick={clearImage} type="button"><X aria-hidden="true" size={17}/></button></div>}
            <input accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => scanFile(event.target.files?.[0])} ref={inputRef} type="file"/>
            {error ? <p className="qr-alert is-error" role="alert">{error}</p> : null}
            {preview && !isScanning ? <button className="qr-secondary-button" onClick={() => inputRef.current?.click()} type="button"><ImageUp aria-hidden="true" size={17}/> Chọn ảnh khác</button> : null}
        </section>);
}
