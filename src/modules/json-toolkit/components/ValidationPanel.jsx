import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ValidationPanel({ result }) {
    if (!result) return null;

    if (result.isValid) {
        return (
            <div className="json-validation is-valid" role="status">
                <CheckCircle2 aria-hidden="true" size={18} />
                <div><strong>JSON hợp lệ</strong><span>Parser đã phân tích tài liệu thành công.</span></div>
            </div>
        );
    }

    const location = [
        result.line ? `Dòng ${result.line}` : "",
        result.column ? `Cột ${result.column}` : "",
    ].filter(Boolean).join(", ");

    return (
        <div className="json-validation is-invalid" role="alert">
            <AlertTriangle aria-hidden="true" size={18} />
            <div>
                <strong>JSON không hợp lệ{location ? ` · ${location}` : ""}</strong>
                <span>{result.message}</span>
            </div>
        </div>
    );
}
