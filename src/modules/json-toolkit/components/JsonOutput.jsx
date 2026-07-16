import JsonEditor from "./JsonEditor";

export default function JsonOutput({ onCopyShortcut, textareaRef, value }) {
    return (
        <JsonEditor
            id="json-output"
            label="Kết quả JSON"
            onCopyShortcut={onCopyShortcut}
            placeholder="JSON sau khi định dạng hoặc thu gọn sẽ xuất hiện tại đây."
            readOnly
            textareaRef={textareaRef}
            value={value}
        />
    );
}
