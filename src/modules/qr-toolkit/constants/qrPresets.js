export const DEFAULT_QR_STYLE = {
    width: 360,
    height: 360,
    margin: 12,
    foreground: "#102a43",
    background: "#ffffff",
    transparent: false,
    gradientEnabled: false,
    gradientType: "linear",
    gradientRotation: 45,
    gradientStart: "#0f766e",
    gradientEnd: "#2563eb",
    dotType: "rounded",
    cornerSquareType: "extra-rounded",
    cornerDotType: "dot",
    cornerSquareColor: "#102a43",
    cornerDotColor: "#0f766e",
    errorCorrectionLevel: "Q",
    logoSize: 0.28,
    logoMargin: 8,
    logoBackground: true,
};
export const QR_PRESETS = [
    { id: "classic", label: "Classic", style: { foreground: "#111827", background: "#ffffff", transparent: false, gradientEnabled: false, dotType: "square", cornerSquareType: "square", cornerDotType: "square" } },
    { id: "rounded", label: "Rounded", style: { foreground: "#12372a", background: "#f7fbf8", transparent: false, gradientEnabled: false, dotType: "rounded", cornerSquareType: "extra-rounded", cornerDotType: "dot" } },
    { id: "minimal", label: "Minimal", style: { foreground: "#334155", background: "#ffffff", transparent: false, gradientEnabled: false, dotType: "dots", cornerSquareType: "dot", cornerDotType: "dot" } },
    { id: "gradient", label: "Gradient", style: { gradientEnabled: true, gradientType: "linear", gradientRotation: 35, gradientStart: "#0f766e", gradientEnd: "#2563eb", background: "#ffffff", transparent: false, dotType: "rounded" } },
    { id: "dark", label: "Dark", style: { foreground: "#e2e8f0", background: "#0f172a", transparent: false, gradientEnabled: false, cornerSquareColor: "#f8fafc", cornerDotColor: "#38bdf8", dotType: "rounded" } },
    { id: "colorful", label: "Colorful", style: { gradientEnabled: true, gradientType: "radial", gradientStart: "#db2777", gradientEnd: "#7c3aed", background: "#fff7ed", transparent: false, cornerSquareColor: "#7c3aed", cornerDotColor: "#db2777", dotType: "classy-rounded" } },
    { id: "with-logo", label: "With Logo", style: { errorCorrectionLevel: "H", logoSize: 0.26, logoMargin: 10, logoBackground: true, dotType: "rounded", cornerSquareType: "extra-rounded" } },
];
const now = new Date();
const later = new Date(now.getTime() + 60 * 60 * 1000);
const toLocalInput = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
};
export const DEMO_QR_FORMS = {
    url: { url: "https://example.com" },
    text: { text: "Xin chào từ QR Code Toolkit" },
    wifi: { ssid: "Demo WiFi", password: "demo-password", security: "WPA", hidden: false },
    contact: { fullName: "Nguyen Van A", company: "Example Company", title: "Developer", phone: "+84901234567", email: "hello@example.com", website: "https://example.com", address: "Ho Chi Minh City, Vietnam", note: "Demo contact" },
    email: { recipient: "hello@example.com", subject: "Xin chào", body: "Tin nhắn từ QR Code Toolkit" },
    sms: { phone: "+84901234567", message: "Xin chào từ QR Code Toolkit" },
    event: { title: "Product Launch", location: "Ho Chi Minh City", description: "Sự kiện giới thiệu sản phẩm", start: toLocalInput(now), end: toLocalInput(later), allDay: false, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh" },
};
export const TEXT_WARNING_LENGTH = 800;
export const TEXT_MAX_LENGTH = 1200;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const MAX_SCAN_IMAGE_BYTES = 10 * 1024 * 1024;
