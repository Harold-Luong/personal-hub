import { describe, expect, it } from "vitest";
import { detectQRContentType, parseQRPayload, parseWifiPayload } from "./qrPayloadParser";
describe("QR payload parser", () => {
    it("detects supported payloads", () => {
        expect(detectQRContentType("https://example.com")).toBe("url");
        expect(detectQRContentType("example.com/path")).toBe("url");
        expect(detectQRContentType("BEGIN:VCARD\nFN:A\nEND:VCARD")).toBe("contact");
        expect(detectQRContentType("SMSTO:+8490:Hello")).toBe("sms");
        expect(detectQRContentType("javascript:alert(1)")).toBe("text");
    });
    it("unescapes Wi-Fi values", () => {
        expect(parseWifiPayload("WIFI:T:WPA;S:Cafe\\;Guest;P:a\\:b;H:false;;"))
            .toMatchObject({ security: "WPA", ssid: "Cafe;Guest", password: "a:b", hidden: false });
    });
    it("never exposes unsafe text as a URL action", () => {
        expect(parseQRPayload("data:text/html,hello").safeUrl).toBeUndefined();
    });
    it("parses MATMSG email fields", () => {
        expect(parseQRPayload("MATMSG:TO:a@example.com;SUB:Hello;BODY:Message;;").fields)
            .toMatchObject({ recipient: "a@example.com", subject: "Hello", body: "Message" });
    });
});
