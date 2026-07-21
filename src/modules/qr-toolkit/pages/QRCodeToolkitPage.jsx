import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, Check, FileImage, Link, Mail, MessageSquare, Moon, QrCode, Sparkles, Sun, Type, UserRound, Wifi, CalendarDays } from "lucide-react";
import { NavLink } from "react-router";
import QRDownloadPanel from "../components/QRDownloadPanel";
import QRForms from "../components/forms/QRForms";
import QRPreview from "../components/QRPreview";
import QRStylePanel from "../components/QRStylePanel";
import ScanResult from "../components/ScanResult";
import { DEFAULT_QR_STYLE, DEMO_QR_FORMS } from "../constants/qrPresets";
import useQRGenerator from "../hooks/useQRGenerator";
import { buildEmailPayload, buildEventPayload, buildSmsPayload, buildTextPayload, buildUrlPayload, buildVCardPayload, buildWifiPayload } from "../lib/qrPayloadBuilders";
import { parseQRPayload } from "../lib/qrPayloadParser";
import { isFormValid, validateQRForm } from "../lib/qrValidators";
import "../styles/qr-toolkit.scss";
const QRScannerCamera = lazy(() => import("../components/QRScannerCamera"));
const QRScannerImage = lazy(() => import("../components/QRScannerImage"));
const QR_TYPES = [
    { id: "url", label: "URL", icon: Link },
    { id: "text", label: "Văn bản", icon: Type },
    { id: "wifi", label: "Wi-Fi", icon: Wifi },
    { id: "contact", label: "Contact", icon: UserRound },
    { id: "email", label: "Email", icon: Mail },
    { id: "sms", label: "SMS", icon: MessageSquare },
    { id: "event", label: "Sự kiện", icon: CalendarDays },
];
const EMPTY_FORMS = {
    url: { url: "" }, text: { text: "" }, wifi: { ssid: "", password: "", security: "WPA", hidden: false },
    contact: { fullName: "", company: "", title: "", phone: "", email: "", website: "", address: "", note: "" },
    email: { recipient: "", subject: "", body: "" }, sms: { phone: "", message: "" },
    event: { title: "", location: "", description: "", start: "", end: "", allDay: false, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh" },
};
function loadStyle() {
    try {
        const saved = localStorage.getItem("personal-hub:qr-style");
        return saved ? { ...DEFAULT_QR_STYLE, ...JSON.parse(saved) } : DEFAULT_QR_STYLE;
    }
    catch {
        return DEFAULT_QR_STYLE;
    }
}
function buildPayload(type, data) {
    switch (type) {
        case "url": return buildUrlPayload(data);
        case "text": return buildTextPayload(data);
        case "wifi": return buildWifiPayload(data);
        case "contact": return buildVCardPayload(data);
        case "email": return buildEmailPayload(data);
        case "sms": return buildSmsPayload(data);
        case "event": return buildEventPayload(data);
    }
}
export default function QRCodeToolkitPage() {
    const [tab, setTab] = useState("create");
    const [type, setType] = useState("url");
    const [forms, setForms] = useState(DEMO_QR_FORMS);
    const [style, setStyle] = useState(loadStyle);
    const [logo, setLogo] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem("personal-hub:qr-theme") === "dark" ? "dark" : "light");
    const [toast, setToast] = useState(null);
    const errors = useMemo(() => validateQRForm(type, forms[type]), [forms, type]);
    const payload = useMemo(() => isFormValid(errors) ? buildPayload(type, forms[type]) : "", [errors, forms, type]);
    const generator = useQRGenerator(payload, style, logo);
    const showToast = useCallback((message, tone = "success") => setToast({ message, tone }), []);
    useEffect(() => { localStorage.setItem("personal-hub:qr-style", JSON.stringify(style)); }, [style]);
    useEffect(() => { localStorage.setItem("personal-hub:qr-theme", theme); }, [theme]);
    useEffect(() => { if (!toast)
        return; const id = window.setTimeout(() => setToast(null), 2600); return () => window.clearTimeout(id); }, [toast]);
    const updateCurrentForm = (patch) => {
        setForms((current) => ({ ...current, [type]: { ...current[type], ...patch } }));
    };
    const clearCurrentForm = () => setForms((current) => ({ ...current, [type]: { ...EMPTY_FORMS[type] } }));
    const copy = async (value) => {
        try {
            await navigator.clipboard.writeText(value);
            showToast("Đã sao chép.");
        }
        catch {
            showToast("Không thể truy cập clipboard.", "error");
        }
    };
    const receiveScan = (value) => setScanResult(parseQRPayload(value));
    const changeTab = (next) => { setTab(next); setScanResult(null); };
    return (<main className="qr-toolkit-page" data-theme={theme}>
            <header className="qr-toolkit-header">
                <NavLink aria-label="Quay lại Personal Hub" className="qr-toolkit-header__back" to="/hub"><ArrowLeft aria-hidden="true" size={18}/> Hub</NavLink>
                <div className="qr-toolkit-header__brand"><span><QrCode aria-hidden="true" size={24}/></span><div><strong>QR Code Toolkit</strong><small>Tạo · Tùy chỉnh · Quét</small></div></div>
                <div className="qr-toolkit-header__privacy"><Sparkles aria-hidden="true" size={15}/> 100% trên thiết bị</div>
                <button aria-label={theme === "light" ? "Bật giao diện tối" : "Bật giao diện sáng"} className="qr-icon-button" onClick={() => setTheme((value) => value === "light" ? "dark" : "light")} title="Đổi giao diện" type="button">{theme === "light" ? <Moon aria-hidden="true" size={18}/> : <Sun aria-hidden="true" size={18}/>}</button>
            </header>

            <section className="qr-toolkit-intro"><div><span className="qr-eyebrow">Private browser tool</span><h1>Một nơi cho mọi QR Code.</h1><p>Tạo mã có thương hiệu, kiểm tra khả năng quét và đọc QR từ camera hoặc ảnh mà không gửi dữ liệu ra khỏi thiết bị.</p></div><div className="qr-privacy-card"><QrCode aria-hidden="true" size={24}/><span><strong>Riêng tư mặc định</strong>Nội dung, ảnh và logo không được upload hay lưu trên máy chủ.</span></div></section>

            <nav aria-label="Chức năng QR Toolkit" className="qr-main-tabs">
                <button aria-current={tab === "create" ? "page" : undefined} className={tab === "create" ? "is-active" : ""} onClick={() => changeTab("create")} type="button"><QrCode aria-hidden="true" size={18}/> Create</button>
                <button aria-current={tab === "camera" ? "page" : undefined} className={tab === "camera" ? "is-active" : ""} onClick={() => changeTab("camera")} type="button"><Camera aria-hidden="true" size={18}/> Scan Camera</button>
                <button aria-current={tab === "image" ? "page" : undefined} className={tab === "image" ? "is-active" : ""} onClick={() => changeTab("image")} type="button"><FileImage aria-hidden="true" size={18}/> Scan Image</button>
            </nav>

            {tab === "create" ? (<div className="qr-create-layout">
                    <aside className="qr-type-nav"><span>Loại nội dung</span><div>{QR_TYPES.map((item) => { const Icon = item.icon; return <button aria-current={type === item.id ? "page" : undefined} className={type === item.id ? "is-active" : ""} key={item.id} onClick={() => setType(item.id)} type="button"><Icon aria-hidden="true" size={17}/>{item.label}</button>; })}</div></aside>
                    <section className="qr-form-card"><QRForms data={forms[type]} errors={errors} onChange={updateCurrentForm} onClear={clearCurrentForm} onCopy={copy} type={type}/>{errors.warning ? <p className="qr-alert is-warning">{errors.warning}</p> : null}</section>
                    <QRPreview containerRef={generator.containerRef} hasPayload={Boolean(payload)} isRendering={generator.isRendering} onTest={generator.testScannability} testStatus={generator.testStatus} transparent={style.transparent}/>
                    <QRStylePanel logo={logo} onLogoChange={setLogo} onReset={() => setStyle(DEFAULT_QR_STYLE)} onStyleChange={(patch) => setStyle((current) => ({ ...current, ...patch }))} showToast={showToast} style={style}/>
                    <QRDownloadPanel logo={logo} payload={payload} showToast={showToast} style={style}/>
                </div>) : (<div className="qr-scan-layout">
                    {scanResult ? <ScanResult onReset={() => setScanResult(null)} result={scanResult} showToast={showToast}/> : <Suspense fallback={<div className="qr-module-loading">Đang tải bộ quét QR…</div>}>{tab === "camera" ? <QRScannerCamera onResult={receiveScan}/> : <QRScannerImage onResult={receiveScan}/>}</Suspense>}
                    <aside className="qr-scan-tips"><h2>Mẹo quét nhanh</h2><ul><li>Giữ QR nằm trọn trong khung.</li><li>Tránh phản sáng hoặc ảnh quá mờ.</li><li>QR được nhận diện nhưng không tự mở liên kết.</li></ul><div><Check aria-hidden="true" size={17}/><span>Camera tự dừng sau khi quét thành công.</span></div></aside>
                </div>)}

            {toast ? <div className={`qr-toast is-${toast.tone}`} role="status">{toast.tone === "success" ? <Check aria-hidden="true" size={17}/> : null}{toast.message}</div> : null}
        </main>);
}
