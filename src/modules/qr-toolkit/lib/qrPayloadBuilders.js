const escapeWifi = (value) => value.replace(/([\\;,:"])/g, "\\$1");
const escapeVCard = (value) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const escapeICal = (value) => escapeVCard(value).replace(/\r/g, "");
export function normalizeUrl(value) {
    const trimmed = value.trim();
    if (!trimmed)
        return "";
    return /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
export function buildUrlPayload(data) { return normalizeUrl(data.url); }
export function buildTextPayload(data) { return data.text; }
export function buildWifiPayload(data) {
    const password = data.security === "nopass" ? "" : `P:${escapeWifi(data.password)};`;
    return `WIFI:T:${data.security};S:${escapeWifi(data.ssid)};${password}H:${data.hidden ? "true" : "false"};;`;
}
export function buildVCardPayload(data) {
    const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escapeVCard(data.fullName)}`];
    if (data.company)
        lines.push(`ORG:${escapeVCard(data.company)}`);
    if (data.title)
        lines.push(`TITLE:${escapeVCard(data.title)}`);
    if (data.phone)
        lines.push(`TEL:${escapeVCard(data.phone)}`);
    if (data.email)
        lines.push(`EMAIL:${escapeVCard(data.email)}`);
    if (data.website)
        lines.push(`URL:${escapeVCard(normalizeUrl(data.website))}`);
    if (data.address)
        lines.push(`ADR:;;${escapeVCard(data.address)};;;;`);
    if (data.note)
        lines.push(`NOTE:${escapeVCard(data.note)}`);
    lines.push("END:VCARD");
    return lines.join("\r\n");
}
export function buildEmailPayload(data) {
    const params = new URLSearchParams();
    if (data.subject)
        params.set("subject", data.subject);
    if (data.body)
        params.set("body", data.body);
    const query = params.toString();
    return `mailto:${data.recipient.trim()}${query ? `?${query}` : ""}`;
}
export function buildSmsPayload(data) {
    return `SMSTO:${data.phone.trim()}:${data.message}`;
}
function formatDateTime(value) {
    return value.replace(/[-:]/g, "").replace("T", "T") + (value.length === 16 ? "00" : "");
}
function formatDate(value) { return value.slice(0, 10).replace(/-/g, ""); }
export function buildEventPayload(data) {
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Personal Hub//QR Code Toolkit//VI",
        "BEGIN:VEVENT",
        `SUMMARY:${escapeICal(data.title)}`,
    ];
    if (data.location)
        lines.push(`LOCATION:${escapeICal(data.location)}`);
    if (data.description)
        lines.push(`DESCRIPTION:${escapeICal(data.description)}`);
    if (data.allDay) {
        lines.push(`DTSTART;VALUE=DATE:${formatDate(data.start)}`);
        lines.push(`DTEND;VALUE=DATE:${formatDate(data.end)}`);
    }
    else {
        lines.push(`DTSTART;TZID=${data.timezone}:${formatDateTime(data.start)}`);
        lines.push(`DTEND;TZID=${data.timezone}:${formatDateTime(data.end)}`);
    }
    lines.push("END:VEVENT", "END:VCALENDAR");
    return lines.join("\r\n");
}
