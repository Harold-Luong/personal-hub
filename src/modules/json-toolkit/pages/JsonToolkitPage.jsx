import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Braces, Check, LockKeyhole } from "lucide-react";
import { NavLink } from "react-router";
import JsonDiffTree from "../components/JsonDiffTree";
import JsonEditor from "../components/JsonEditor";
import JsonOutput from "../components/JsonOutput";
import JsonToolbar from "../components/JsonToolbar";
import TextDiffPanel from "../components/TextDiffPanel";
import ValidationPanel from "../components/ValidationPanel";
import { copyText } from "../utils/clipboard";
import { compareJson, prepareJsonDiffView } from "../utils/diff";
import { downloadJson } from "../utils/download";
import { formatJson, minifyJson, sortJson } from "../utils/formatter";
import { formatByteSize, MAX_JSON_INPUT_BYTES } from "../utils/size";
import { compareText } from "../utils/textDiff";
import { validateJson } from "../utils/validator";
import "../styles/json-toolkit.scss";

function contextualizeError(label, result) {
    return { ...result, message: `${label}: ${result.message}` };
}

export default function JsonToolkitPage() {
    const [input, setInput] = useState("");
    const [indentSize, setIndentSize] = useState(2);
    const [secondInput, setSecondInput] = useState("");
    const [output, setOutput] = useState("");
    const [compareMode, setCompareMode] = useState(false);
    const [compareType, setCompareType] = useState("json");
    const [diff, setDiff] = useState(null);
    const [textDiff, setTextDiff] = useState(null);
    const [inputHighlights, setInputHighlights] = useState({});
    const [outputHighlights, setOutputHighlights] = useState({});
    const [validation, setValidation] = useState(null);
    const [toast, setToast] = useState(null);
    const outputRef = useRef(null);

    const showToast = useCallback((message, tone = "success") => {
        setToast({ message, tone });
    }, []);

    const handleInputLimitExceeded = useCallback(() => {
        showToast(`Dữ liệu đầu vào không được vượt quá ${formatByteSize(MAX_JSON_INPUT_BYTES)}.`, "error");
    }, [showToast]);

    useEffect(() => {
        if (!toast) return;
        const timeoutId = window.setTimeout(() => setToast(null), 2400);
        return () => window.clearTimeout(timeoutId);
    }, [toast]);

    const handleFormat = useCallback(() => {
        const result = formatJson(input, indentSize);

        if (!result.success) {
            setValidation(result.error);
            return;
        }

        setOutput(result.output);
        setValidation({ isValid: true, value: JSON.parse(result.output) });
    }, [indentSize, input]);

    const handleMinify = useCallback(() => {
        const result = minifyJson(input);

        if (!result.success) {
            setValidation(result.error);
            return;
        }

        setOutput(result.output);
        setValidation({ isValid: true, value: JSON.parse(result.output) });
    }, [input]);

    const handleValidate = useCallback(() => {
        const result = validateJson(input);

        setValidation(result);
        setInputHighlights(result.isValid || !result.line ? {} : { [result.line]: "error" });
    }, [input]);

    const handleSort = useCallback(() => {
        const result = sortJson(input, indentSize);

        if (!result.success) {
            setValidation(result.error);
            return;
        }

        setOutput(result.output);
        setValidation({ isValid: true, value: JSON.parse(result.output) });
    }, [indentSize, input]);

    const handleCompare = useCallback(() => {
        if (compareType === "text") {
            const result = compareText(input, secondInput);

            setValidation(null);
            setDiff(null);
            setTextDiff(result);
            setInputHighlights(result.beforeHighlights);
            setOutputHighlights(result.afterHighlights);
            return;
        }

        const firstResult = validateJson(input);
        if (!firstResult.isValid) {
            setValidation(contextualizeError("JSON A", firstResult));
            setDiff(null);
            setTextDiff(null);
            setInputHighlights({});
            setOutputHighlights({});
            return;
        }

        const secondResult = validateJson(secondInput);
        if (!secondResult.isValid) {
            setValidation(contextualizeError("JSON B", secondResult));
            setDiff(null);
            setTextDiff(null);
            setInputHighlights({});
            setOutputHighlights({});
            return;
        }

        const diffResult = compareJson(firstResult.value, secondResult.value);
        const beforeView = prepareJsonDiffView(firstResult.value, diffResult, "before", indentSize);
        const afterView = prepareJsonDiffView(secondResult.value, diffResult, "after", indentSize);

        setInput(beforeView.output);
        setSecondInput(afterView.output);
        setInputHighlights(beforeView.lineHighlights);
        setOutputHighlights(afterView.lineHighlights);
        setValidation({ isValid: true, value: firstResult.value });
        setDiff(diffResult);
        setTextDiff(null);
    }, [compareType, indentSize, input, secondInput]);

    const handleCopy = useCallback(async () => {
        if (!output) return;

        try {
            await copyText(output);
            showToast("Đã sao chép JSON.");
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Không thể sao chép JSON.", "error");
        }
    }, [output, showToast]);

    const handleDownload = useCallback(() => {
        if (!output) return;

        try {
            const formattedResult = formatJson(output, indentSize);
            downloadJson(formattedResult.success ? formattedResult.output : output);
            showToast("Đã tải xuống formatted.json.");
        } catch {
            showToast("Không thể tải xuống JSON.", "error");
        }
    }, [indentSize, output, showToast]);

    const handleClear = useCallback(() => {
        setInput("");
        setSecondInput("");
        setOutput("");
        setDiff(null);
        setTextDiff(null);
        setInputHighlights({});
        setOutputHighlights({});
        setValidation(null);
    }, []);

    const handleToggleCompare = useCallback(() => {
        setCompareMode((current) => !current);
        setValidation(null);
        setDiff(null);
        setTextDiff(null);
        setInputHighlights({});
        setOutputHighlights({});
    }, []);

    const handleCompareTypeChange = useCallback((nextCompareType) => {
        setCompareType(nextCompareType);
        setValidation(null);
        setDiff(null);
        setTextDiff(null);
        setInputHighlights({});
        setOutputHighlights({});
    }, []);

    const isTextCompare = compareMode && compareType === "text";

    useEffect(() => {
        function handleShortcut(event) {
            if (!(event.ctrlKey || event.metaKey)) return;

            if (event.key === "Enter" && !compareMode) {
                event.preventDefault();
                handleFormat();
            } else if (event.shiftKey && event.key.toLowerCase() === "m" && !compareMode) {
                event.preventDefault();
                handleMinify();
            } else if (event.shiftKey && event.key.toLowerCase() === "v" && !compareMode) {
                event.preventDefault();
                handleValidate();
            } else if (event.shiftKey && event.key.toLowerCase() === "d") {
                event.preventDefault();
                if (compareMode) handleCompare();
                else handleToggleCompare();
            }
        }

        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    }, [compareMode, handleCompare, handleFormat, handleMinify, handleToggleCompare, handleValidate]);

    return (
        <main className={`json-toolkit-page${compareMode ? " is-compare-mode" : ""}`}>
            <header className="json-toolkit-hero">
                <NavLink aria-label="Quay lại Personal Hub" className="json-toolkit-hero__back" to="/hub">
                    <ArrowLeft aria-hidden="true" size={18} /> Hub
                </NavLink>
                <div className="json-toolkit-hero__copy">
                    <span className="json-toolkit-hero__eyebrow"><Braces aria-hidden="true" size={15} /> Developer tools</span>
                    <h1>JSON Toolkit</h1>
                    <p>Định dạng, kiểm tra JSON và so sánh JSON hoặc văn bản theo từng dòng.</p>
                </div>
                <div className="json-toolkit-privacy">
                    <LockKeyhole aria-hidden="true" size={18} />
                    <span><strong>Xử lý hoàn toàn trên browser</strong>Tài liệu của bạn không bao giờ rời khỏi thiết bị này.</span>
                </div>
            </header>

            <div className="json-toolkit-workbench">
                <div className="json-toolkit-workbench__toolbar">
                    <JsonToolbar
                        canExport={Boolean(output)}
                        compareMode={compareMode}
                        compareType={compareType}
                        indentSize={indentSize}
                        onClear={handleClear}
                        onCompare={handleCompare}
                        onCompareTypeChange={handleCompareTypeChange}
                        onCopy={handleCopy}
                        onDownload={handleDownload}
                        onFormat={handleFormat}
                        onIndentSizeChange={setIndentSize}
                        onMinify={handleMinify}
                        onSort={handleSort}
                        onToggleCompare={handleToggleCompare}
                        onValidate={handleValidate}
                    />
                </div>

                <div className="json-toolkit-workbench__input">
                    <JsonEditor
                        characterHighlights={isTextCompare ? textDiff?.beforeCharacterHighlights : undefined}
                        id="json-input"
                        indentSize={indentSize}
                        label={compareMode ? (isTextCompare ? "Văn bản A" : "JSON A") : "Trình soạn thảo JSON"}
                        lineHighlights={inputHighlights}
                        maxBytes={MAX_JSON_INPUT_BYTES}
                        onChange={(value) => {
                            setInput(value);
                            setValidation(null);
                            setDiff(null);
                            setTextDiff(null);
                            setInputHighlights({});
                            setOutputHighlights({});
                        }}
                        onLimitExceeded={handleInputLimitExceeded}
                        placeholder={isTextCompare ? "Dán văn bản thứ nhất vào đây..." : undefined}
                        syntaxHighlight={!isTextCompare}
                        value={input}
                    />
                </div>

                <div className="json-toolkit-workbench__output">
                    {compareMode ? (
                        <JsonEditor
                            characterHighlights={isTextCompare ? textDiff?.afterCharacterHighlights : undefined}
                            id="json-input-b"
                            indentSize={indentSize}
                            label={isTextCompare ? "Văn bản B" : "JSON B"}
                            lineHighlights={outputHighlights}
                            maxBytes={MAX_JSON_INPUT_BYTES}
                            onChange={(value) => {
                                setSecondInput(value);
                                setValidation(null);
                                setDiff(null);
                                setTextDiff(null);
                                setInputHighlights({});
                                setOutputHighlights({});
                            }}
                            onLimitExceeded={handleInputLimitExceeded}
                            placeholder={isTextCompare ? "Dán văn bản thứ hai vào đây..." : undefined}
                            syntaxHighlight={!isTextCompare}
                            value={secondInput}
                        />
                    ) : (
                        <JsonOutput onCopyShortcut={handleCopy} textareaRef={outputRef} value={output} />
                    )}
                </div>

                {!isTextCompare ? (
                    <div className="json-toolkit-workbench__status">
                        <ValidationPanel result={validation} />
                    </div>
                ) : null}

                {compareMode ? (
                    <div className="json-toolkit-workbench__diff">
                        {isTextCompare ? <TextDiffPanel result={textDiff} /> : <JsonDiffTree diff={diff} />}
                    </div>
                ) : null}
            </div>

            {toast ? (
                <div className={`json-toolkit-toast is-${toast.tone}`} role="status">
                    {toast.tone === "success" ? <Check aria-hidden="true" size={17} /> : null}
                    {toast.message}
                </div>
            ) : null}
        </main>
    );
}
