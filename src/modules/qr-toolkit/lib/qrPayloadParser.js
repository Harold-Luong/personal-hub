import { isSafeHttpUrl, isValidEmail, isValidPhone } from "./qrValidators";
function unescapeStructured(value = "") {
    return value.replace(/\\n/gi, "\n").replace(/\\([\\;,:])/g, "$1");
}
function splitEscaped(value, delimiter = ";") {
    const parts = [];
    let current = "";
    let escaped = false;
    for (const char of value) {
        if (escaped) {
            current += `\\${char}`;
            escaped = false;
        }
        else if (char === "\\")
            escaped = true;
        else if (char === delimiter) {
            parts.push(current);
            current = "";
        }
        else
            current += char;
    }
    parts.push(current);
    return parts;
}
export function parseWifiPayload(raw) {
    const body = raw.replace(/^WIFI:/i, "").replace(/;;$/, "");
    const fields = {};
    for (const part of splitEscaped(body)) {
        const separator = part.indexOf(":");
        if (separator < 0)
            continue;
        const key = part.slice(0, separator).toUpperCase();
        const value = unescapeStructured(part.slice(separator + 1));
        if (key === "S")
            fields.ssid = value;
        if (key === "P")
            fields.password = value;
        if (key === "T")
            fields.security = value || "nopass";
        if (key === "H")
            fields.hidden = value.toLowerCase() === "true";
    }
    return fields;
}
function parseLines(raw) {
    const fields = {};
    raw.replace(/\r\n/g, "\n").split("\n").forEach((line) => {
        const separator = line.indexOf(":");
        if (separator < 0)
            return;
        const key = line.slice(0, separator).split(";")[0]?.toUpperCase() || "";
        fields[key] = unescapeStructured(line.slice(separator + 1));
    });
    return fields;
}
export function parseVCardPayload(raw) {
    const source = parseLines(raw);
    return { name: source.FN || "", company: source.ORG || "", title: source.TITLE || "", phone: source.TEL || "", email: source.EMAIL || "", website: source.URL || "", address: source.ADR?.replace(/^;;/, "").replace(/;;;;$/, "") || "", note: source.NOTE || "" };
}
export function parseEmailPayload(raw) {
    if (/^MATMSG:/i.test(raw)) {
        const body = raw.replace(/^MATMSG:/i, "").replace(/;;$/, "");
        const values = {};
        splitEscaped(body).forEach((part) => {
            const separator = part.indexOf(":");
            if (separator > 0)
                values[part.slice(0, separator).toUpperCase()] = unescapeStructured(part.slice(separator + 1));
        });
        return { recipient: values.TO || "", subject: values.SUB || "", body: values.BODY || "" };
    }
    const value = raw;
    const withoutScheme = value.replace(/^mailto:/i, "");
    const [recipient, query = ""] = withoutScheme.split("?");
    const params = new URLSearchParams(query);
    return { recipient: decodeURIComponent(recipient || ""), subject: params.get("subject") || "", body: params.get("body") || "" };
}
export function parseSmsPayload(raw) {
    if (/^SMSTO:/i.test(raw)) {
        const value = raw.replace(/^SMSTO:/i, "");
        const separator = value.indexOf(":");
        return { phone: separator < 0 ? value : value.slice(0, separator), message: separator < 0 ? "" : value.slice(separator + 1) };
    }
    const value = raw.replace(/^sms:/i, "");
    const [phone, query = ""] = value.split("?");
    return { phone: phone || "", message: new URLSearchParams(query).get("body") || "" };
}
export function parseEventPayload(raw) {
    const source = parseLines(raw);
    return { title: source.SUMMARY || "", location: source.LOCATION || "", description: source.DESCRIPTION || "", start: source.DTSTART || "", end: source.DTEND || "" };
}
export function detectQRContentType(raw) {
    const value = raw.trim();
    if (/^WIFI:/i.test(value))
        return "wifi";
    if (/^BEGIN:VCARD/i.test(value))
        return "contact";
    if (/BEGIN:VEVENT/i.test(value))
        return "event";
    if (/^(mailto:|MATMSG:)/i.test(value))
        return "email";
    if (/^(SMSTO:|sms:)/i.test(value))
        return "sms";
    if (/^tel:/i.test(value) || isValidPhone(value))
        return "phone";
    const looksLikeUrl = /^https?:\/\//i.test(value) || /^(?:www\.)?[a-z\d](?:[a-z\d-]*[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]*[a-z\d])?)+(?:[/:?#]|$)/i.test(value);
    if (looksLikeUrl && isSafeHttpUrl(value))
        return "url";
    if (isValidEmail(value))
        return "email";
    return "text";
}
export function parseQRPayload(raw) {
    const value = raw.trim();
    const type = detectQRContentType(value);
    if (type === "url") {
        const safeUrl = /^https?:\/\//i.test(value) ? value : `https://${value}`;
        return { raw: value, type, label: "Liên kết", safeUrl };
    }
    if (type === "wifi")
        return { raw: value, type, label: "Mạng Wi-Fi", fields: parseWifiPayload(value) };
    if (type === "contact")
        return { raw: value, type, label: "Danh thiếp vCard", fields: parseVCardPayload(value) };
    if (type === "event")
        return { raw: value, type, label: "Sự kiện lịch", fields: parseEventPayload(value) };
    if (type === "email") {
        const fields = /^mailto:|^MATMSG:/i.test(value) ? parseEmailPayload(value) : { recipient: value, subject: "", body: "" };
        return { raw: value, type, label: "Email", safeUrl: `mailto:${fields.recipient}`, fields };
    }
    if (type === "sms") {
        const fields = parseSmsPayload(value);
        return { raw: value, type, label: "Tin nhắn SMS", safeUrl: `sms:${fields.phone}`, fields };
    }
    if (type === "phone") {
        const phone = value.replace(/^tel:/i, "");
        return { raw: value, type, label: "Số điện thoại", safeUrl: `tel:${phone}`, fields: { phone } };
    }
    return { raw: value, type, label: "Văn bản" };
}
