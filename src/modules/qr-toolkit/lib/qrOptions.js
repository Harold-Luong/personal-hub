export function buildStylingOptions(data, style, logo, overrideSize) {
    const gradient = style.gradientEnabled ? {
        type: style.gradientType,
        rotation: style.gradientRotation * Math.PI / 180,
        colorStops: [{ offset: 0, color: style.gradientStart }, { offset: 1, color: style.gradientEnd }],
    } : undefined;
    const width = overrideSize ?? style.width;
    const height = overrideSize ?? style.height;
    return {
        type: "svg",
        width,
        height,
        margin: style.margin,
        data: data || " ",
        image: logo || undefined,
        qrOptions: { errorCorrectionLevel: logo ? "H" : style.errorCorrectionLevel },
        dotsOptions: { color: style.foreground, gradient, type: style.dotType },
        cornersSquareOptions: { color: style.cornerSquareColor, type: style.cornerSquareType },
        cornersDotOptions: { color: style.cornerDotColor, type: style.cornerDotType },
        backgroundOptions: { color: style.transparent ? "transparent" : style.background },
        imageOptions: { hideBackgroundDots: style.logoBackground, imageSize: style.logoSize, margin: style.logoMargin, saveAsBlob: true },
    };
}
export function defaultExportFilename(now = new Date()) {
    const pad = (value) => String(value).padStart(2, "0");
    return `qr-code-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}
export function sanitizeFilename(value) {
    const withoutControlCharacters = Array.from(value.trim(), (character) => character.charCodeAt(0) <= 0x1f ? "-" : character).join("");
    return withoutControlCharacters.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80) || "qr-code";
}
