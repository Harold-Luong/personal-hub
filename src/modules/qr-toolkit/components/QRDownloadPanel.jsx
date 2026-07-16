import { Download } from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import { useState } from "react";
import { buildStylingOptions, defaultExportFilename, sanitizeFilename } from "../lib/qrOptions";
export default function QRDownloadPanel({ logo, payload, style, showToast }) {
    const [options, setOptions] = useState({ filename: defaultExportFilename(), size: 1024, extension: "png" });
    const [isExporting, setIsExporting] = useState(false);
    const download = async () => {
        if (!payload || isExporting)
            return;
        setIsExporting(true);
        try {
            const instance = new QRCodeStyling(buildStylingOptions(payload, style, logo, options.size));
            await instance.download({ name: sanitizeFilename(options.filename), extension: options.extension });
            showToast(`Đã tải QR ${options.extension.toUpperCase()}.`);
        }
        catch {
            showToast("Không thể xuất QR. Hãy thử lại với định dạng khác.", "error");
        }
        finally {
            setIsExporting(false);
        }
    };
    return <section className="qr-download-panel"><h2>Tải xuống</h2><div className="qr-download-grid"><label className="qr-field" htmlFor="qr-filename"><span>Tên file</span><input id="qr-filename" onChange={(event) => setOptions((current) => ({ ...current, filename: event.target.value }))} value={options.filename}/></label><label className="qr-field" htmlFor="qr-export-size"><span>Kích thước</span><select id="qr-export-size" onChange={(event) => setOptions((current) => ({ ...current, size: Number(event.target.value) }))} value={options.size}><option value="512">512 px</option><option value="1024">1024 px</option><option value="2048">2048 px</option></select></label><label className="qr-field" htmlFor="qr-export-format"><span>Định dạng</span><select id="qr-export-format" onChange={(event) => setOptions((current) => ({ ...current, extension: event.target.value }))} value={options.extension}><option value="png">PNG</option><option value="svg">SVG vector</option><option value="jpeg">JPEG</option><option value="webp">WEBP</option></select></label></div><button className="qr-primary-button" disabled={!payload || isExporting} onClick={download} type="button"><Download aria-hidden="true" size={17}/>{isExporting ? "Đang xuất…" : "Tải QR về máy"}</button></section>;
}
