import { Expand, ScanLine, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
export default function QRPreview({ containerRef, hasPayload, isRendering, onTest, testStatus, transparent }) {
    const [zoom, setZoom] = useState(1);
    const dialogRef = useRef(null);
    const mirrorRef = useRef(null);
    useEffect(() => {
        if (!dialogRef.current?.open || !containerRef.current || !mirrorRef.current)
            return;
        mirrorRef.current.innerHTML = containerRef.current.innerHTML;
    }, [containerRef, isRendering, zoom]);
    const openFullscreen = () => {
        if (mirrorRef.current && containerRef.current)
            mirrorRef.current.innerHTML = containerRef.current.innerHTML;
        dialogRef.current?.showModal();
    };
    return (<section className="qr-preview-card" aria-labelledby="qr-preview-title">
            <div className="qr-section-heading"><div><span>Live preview</span><h2 id="qr-preview-title">QR Code</h2></div><div className="qr-preview-actions"><button aria-label="Thu nhỏ preview" className="qr-icon-button" disabled={zoom <= 0.65} onClick={() => setZoom((value) => Math.max(0.65, value - 0.15))} title="Thu nhỏ" type="button"><ZoomOut aria-hidden="true" size={17}/></button><button aria-label="Phóng to preview" className="qr-icon-button" disabled={zoom >= 1.5} onClick={() => setZoom((value) => Math.min(1.5, value + 0.15))} title="Phóng to" type="button"><ZoomIn aria-hidden="true" size={17}/></button><button aria-label="Mở preview toàn màn hình" className="qr-icon-button" onClick={openFullscreen} title="Toàn màn hình" type="button"><Expand aria-hidden="true" size={17}/></button></div></div>
            <div className={`qr-preview-stage${transparent ? " is-transparent" : ""}`}>
                <div className="qr-preview-stage__scale" style={{ transform: `scale(${zoom})` }}><div aria-label="Bản xem trước QR Code" className="qr-preview-output" ref={containerRef}/></div>
                {!hasPayload ? <div className="qr-preview-empty"><ScanLine aria-hidden="true" size={32}/><strong>Chưa có QR hợp lệ</strong><span>Hoàn thiện các trường bắt buộc để xem trước.</span></div> : null}
                {isRendering ? <div className="qr-preview-loading">Đang cập nhật…</div> : null}
            </div>
            <button className="qr-test-button" disabled={!hasPayload || testStatus === "testing"} onClick={onTest} type="button"><ScanLine aria-hidden="true" size={17}/>{testStatus === "testing" ? "Đang kiểm tra…" : "Kiểm tra khả năng quét"}</button>
            {testStatus === "success" ? <p className="qr-test-result is-success" role="status">QR được đọc lại thành công trên thiết bị này.</p> : null}
            {testStatus === "error" ? <p className="qr-test-result is-error" role="alert">Không đọc lại được QR. Hãy tăng tương phản, margin hoặc error correction.</p> : null}
            <dialog className="qr-preview-dialog" ref={dialogRef}><button aria-label="Đóng preview" className="qr-preview-dialog__close" onClick={() => dialogRef.current?.close()} type="button">×</button><div className="qr-preview-dialog__output" ref={mirrorRef}/></dialog>
        </section>);
}
