import { TEXT_MAX_LENGTH, TEXT_WARNING_LENGTH } from "../constants/qrPresets";
import { normalizeUrl } from "./qrPayloadBuilders";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{6,24}$/;
export function isSafeHttpUrl(value) {
    try {
        const parsed = new URL(normalizeUrl(value));
        return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
    }
    catch {
        return false;
    }
}
export function validateQRForm(type, data) {
    const errors = {};
    if (type === "url") {
        const form = data;
        if (!form.url.trim())
            errors.url = "Hãy nhập URL.";
        else if (!isSafeHttpUrl(form.url))
            errors.url = "URL phải dùng http:// hoặc https:// và có tên miền hợp lệ.";
    }
    if (type === "text") {
        const form = data;
        if (!form.text.trim())
            errors.text = "Hãy nhập nội dung.";
        else if (form.text.length > TEXT_MAX_LENGTH)
            errors.text = `Nội dung không được vượt quá ${TEXT_MAX_LENGTH} ký tự.`;
        else if (form.text.length > TEXT_WARNING_LENGTH)
            errors.warning = "Nội dung dài sẽ tạo QR dày và khó quét hơn.";
    }
    if (type === "wifi") {
        const form = data;
        if (!form.ssid.trim())
            errors.ssid = "Tên Wi-Fi không được để trống.";
        if (form.security !== "nopass" && !form.password)
            errors.password = "Hãy nhập mật khẩu cho mạng được bảo vệ.";
    }
    if (type === "contact") {
        const form = data;
        if (!form.fullName.trim())
            errors.fullName = "Họ và tên không được để trống.";
        if (form.email && !EMAIL_PATTERN.test(form.email))
            errors.email = "Email không hợp lệ.";
        if (form.phone && !PHONE_PATTERN.test(form.phone))
            errors.phone = "Số điện thoại chứa ký tự không hợp lệ.";
        if (form.website && !isSafeHttpUrl(form.website))
            errors.website = "Website không hợp lệ.";
    }
    if (type === "email") {
        const form = data;
        if (!EMAIL_PATTERN.test(form.recipient))
            errors.recipient = "Email người nhận không hợp lệ.";
    }
    if (type === "sms") {
        const form = data;
        if (!PHONE_PATTERN.test(form.phone))
            errors.phone = "Số điện thoại không hợp lệ.";
    }
    if (type === "event") {
        const form = data;
        if (!form.title.trim())
            errors.title = "Tên sự kiện không được để trống.";
        if (!form.start)
            errors.start = "Hãy chọn thời gian bắt đầu.";
        if (!form.end)
            errors.end = "Hãy chọn thời gian kết thúc.";
        if (form.start && form.end && new Date(form.end).getTime() <= new Date(form.start).getTime())
            errors.end = "Thời gian kết thúc phải sau thời gian bắt đầu.";
        if (!form.timezone)
            errors.timezone = "Hãy chọn múi giờ.";
    }
    return errors;
}
export function isFormValid(errors) {
    return Object.keys(errors).every((key) => key === "warning");
}
export function isValidEmail(value) { return EMAIL_PATTERN.test(value); }
export function isValidPhone(value) { return PHONE_PATTERN.test(value); }
