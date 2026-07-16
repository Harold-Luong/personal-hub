import { describe, expect, it } from "vitest";
import { buildEmailPayload, buildEventPayload, buildVCardPayload, buildWifiPayload, normalizeUrl } from "./qrPayloadBuilders";
describe("QR payload builders", () => {
    it("normalizes HTTP URLs", () => {
        expect(normalizeUrl("example.com/path")).toBe("https://example.com/path");
        expect(normalizeUrl("http://example.com")).toBe("http://example.com");
    });
    it("escapes Wi-Fi separators", () => {
        expect(buildWifiPayload({ ssid: "Cafe;Guest", password: "a:b,c\\d", security: "WPA", hidden: true }))
            .toBe("WIFI:T:WPA;S:Cafe\\;Guest;P:a\\:b\\,c\\\\d;H:true;;");
    });
    it("builds only populated vCard fields", () => {
        const value = buildVCardPayload({ fullName: "Nguyễn Văn A", company: "", title: "", phone: "+8490", email: "", website: "", address: "", note: "Xin chào" });
        expect(value).toContain("FN:Nguyễn Văn A");
        expect(value).toContain("NOTE:Xin chào");
        expect(value).not.toContain("ORG:");
    });
    it("URL-encodes email subject and body", () => {
        expect(buildEmailPayload({ recipient: "a@example.com", subject: "Xin chào", body: "A & B" }))
            .toBe("mailto:a@example.com?subject=Xin+ch%C3%A0o&body=A+%26+B");
    });
    it("includes timezone in timed events", () => {
        const value = buildEventPayload({ title: "Meeting", location: "", description: "", start: "2026-07-20T09:00", end: "2026-07-20T10:00", allDay: false, timezone: "Asia/Ho_Chi_Minh" });
        expect(value).toContain("DTSTART;TZID=Asia/Ho_Chi_Minh:20260720T090000");
        expect(value).toContain("DTEND;TZID=Asia/Ho_Chi_Minh:20260720T100000");
    });
});
