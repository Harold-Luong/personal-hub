export const QUOTE_BACKGROUND_ACCEPT = "image/jpeg,image/png,image/webp";
export const QUOTE_BACKGROUND_MAX_SIZE_BYTES = 10 * 1024 * 1024;

const supportedQuoteBackgroundTypes = new Set(QUOTE_BACKGROUND_ACCEPT.split(","));

export function validateQuoteBackgroundFile(file) {
    if (!file) return "Vui lòng chọn một ảnh nền.";
    if (!supportedQuoteBackgroundTypes.has(file.type)) {
        return "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.";
    }
    if (file.size <= 0) return "Ảnh đang trống hoặc không thể đọc được.";
    if (file.size > QUOTE_BACKGROUND_MAX_SIZE_BYTES) return "Ảnh vượt quá giới hạn 10 MB.";

    return "";
}
