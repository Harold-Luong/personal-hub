import {
    ArrowDownAZ,
    CheckCircle2,
    Clipboard,
    Code2,
    Download,
    Eraser,
    GitCompareArrows,
    Minimize2,
} from "lucide-react";

export default function JsonToolbar({
    canExport,
    compareMode,
    compareType,
    indentSize,
    onClear,
    onCopy,
    onDownload,
    onFormat,
    onIndentSizeChange,
    onMinify,
    onCompare,
    onCompareTypeChange,
    onSort,
    onToggleCompare,
    onValidate,
}) {
    return (
        <div aria-label="Các thao tác JSON và so sánh văn bản" className="json-toolbar" role="toolbar">
            {compareMode ? (
                <>
                    <button
                        aria-label={`So sánh hai ${compareType === "text" ? "văn bản" : "tài liệu JSON"} (Ctrl+Shift+D)`}
                        className="is-primary"
                        onClick={onCompare}
                        type="button"
                    >
                        <GitCompareArrows aria-hidden="true" size={16} />
                        {compareType === "text" ? "So sánh văn bản" : "So sánh JSON"}
                    </button>
                    <label className="json-toolbar__compare-type">
                        <span>Kiểu dữ liệu</span>
                        <select
                            aria-label="Chọn kiểu dữ liệu cần so sánh"
                            onChange={(event) => onCompareTypeChange(event.target.value)}
                            value={compareType}
                        >
                            <option value="json">JSON</option>
                            <option value="text">Văn bản</option>
                        </select>
                    </label>
                </>
            ) : null}
            {!compareMode ? (
                <>
                    <button aria-label="Định dạng JSON (Ctrl+Enter)" className="is-primary" onClick={onFormat} type="button">
                        <Code2 aria-hidden="true" size={16} /> Định dạng
                    </button>
                    <button aria-label="Thu gọn JSON (Ctrl+Shift+M)" onClick={onMinify} type="button">
                        <Minimize2 aria-hidden="true" size={16} /> Thu gọn
                    </button>
                    <button aria-label="Kiểm tra JSON (Ctrl+Shift+V)" onClick={onValidate} type="button">
                        <CheckCircle2 aria-hidden="true" size={16} /> Kiểm tra
                    </button>
                    <button aria-label="Sắp xếp key JSON từ A đến Z" onClick={onSort} type="button">
                        <ArrowDownAZ aria-hidden="true" size={16} /> Sort A–Z
                    </button>
                    <label className="json-toolbar__indent">
                        <span>Thụt lề</span>
                        <select
                            aria-label="Số spaces dùng để thụt lề JSON"
                            onChange={(event) => onIndentSizeChange(Number(event.target.value))}
                            value={indentSize}
                        >
                            <option value={2}>2 spaces</option>
                            <option value={4}>4 spaces</option>
                        </select>
                    </label>
                </>
            ) : null}
            <button
                aria-label={`${compareMode ? "Tắt" : "Bật"} chế độ so sánh`}
                aria-pressed={compareMode}
                className={compareMode ? "is-active" : ""}
                onClick={onToggleCompare}
                type="button"
            >
                <GitCompareArrows aria-hidden="true" size={16} /> {compareMode ? "Thoát so sánh" : "So sánh"}
            </button>
            <span className="json-toolbar__divider" aria-hidden="true" />
            <button aria-label="Xóa toàn bộ dữ liệu" onClick={onClear} type="button">
                <Eraser aria-hidden="true" size={16} /> Xóa
            </button>
            {!compareMode ? (
                <div className="json-toolbar__exports">
                    <button aria-label="Sao chép kết quả đã định dạng" disabled={!canExport} onClick={onCopy} type="button">
                        <Clipboard aria-hidden="true" size={16} /> Sao chép
                    </button>
                    <button aria-label="Tải xuống JSON đã định dạng" disabled={!canExport} onClick={onDownload} type="button">
                        <Download aria-hidden="true" size={16} /> Tải xuống
                    </button>
                </div>
            ) : null}
        </div>
    );
}
