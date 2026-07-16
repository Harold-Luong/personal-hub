import { CalendarPlus, Copy, Download, ExternalLink, Mail, MessageSquare, Phone, RefreshCw, Wifi } from "lucide-react";
function downloadText(value, filename, type) {
    const url = URL.createObjectURL(new Blob([value], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
export default function ScanResult({ result, onReset, showToast }) {
    const copy = async (value = result.raw) => {
        try {
            await navigator.clipboard.writeText(value);
            showToast("Đã sao chép nội dung QR.");
        }
        catch {
            showToast("Không thể truy cập clipboard.", "error");
        }
    };
    const fields = result.fields || {};
    const hasUnsafeProtocol = /^(?:javascript|data|vbscript|file):/i.test(result.raw.trim());
    return (<section className="qr-scan-result">
            <div className="qr-scan-result__badge">Đã nhận diện · {result.label}</div>
            <h2>Kết quả quét</h2>
            <pre>{result.raw}</pre>
            {hasUnsafeProtocol ? <p className="qr-alert is-error" role="alert">Protocol này không an toàn. Nội dung được hiển thị dưới dạng văn bản và sẽ không được mở.</p> : null}
            {Object.keys(fields).length ? <dl>{Object.entries(fields).filter(([, value]) => value !== "").map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl> : null}
            <div className="qr-result-actions">
                <button className="qr-secondary-button" onClick={() => copy()} type="button"><Copy aria-hidden="true" size={16}/> Sao chép</button>
                {result.type === "url" && result.safeUrl ? <a className="qr-primary-button" href={result.safeUrl} rel="noreferrer noopener" target="_blank"><ExternalLink aria-hidden="true" size={16}/> Mở liên kết</a> : null}
                {result.type === "email" && result.safeUrl ? <a className="qr-primary-button" href={result.safeUrl}><Mail aria-hidden="true" size={16}/> Gửi email</a> : null}
                {result.type === "phone" && result.safeUrl ? <a className="qr-primary-button" href={result.safeUrl}><Phone aria-hidden="true" size={16}/> Gọi điện</a> : null}
                {result.type === "sms" && result.safeUrl ? <a className="qr-primary-button" href={result.safeUrl}><MessageSquare aria-hidden="true" size={16}/> Gửi SMS</a> : null}
                {result.type === "wifi" ? <button className="qr-primary-button" onClick={() => copy(String(fields.password || fields.ssid || result.raw))} type="button"><Wifi aria-hidden="true" size={16}/> Sao chép Wi-Fi</button> : null}
                {result.type === "contact" ? <button className="qr-primary-button" onClick={() => downloadText(result.raw, "qr-contact.vcf", "text/vcard;charset=utf-8")} type="button"><Download aria-hidden="true" size={16}/> Tải vCard</button> : null}
                {result.type === "event" ? <button className="qr-primary-button" onClick={() => downloadText(result.raw, "qr-event.ics", "text/calendar;charset=utf-8")} type="button"><CalendarPlus aria-hidden="true" size={16}/> Thêm sự kiện</button> : null}
            </div>
            <button className="qr-scan-again" onClick={onReset} type="button"><RefreshCw aria-hidden="true" size={16}/> Quét mã khác</button>
        </section>);
}
