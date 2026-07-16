import { Fragment, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { Braces } from "lucide-react";
import useAutosizeTextarea from "../hooks/useAutosizeTextarea";
import { formatByteSize, getUtf8ByteLength } from "../utils/size";
import { tokenizeJson } from "../utils/syntaxHighlight";
import MarkedCharacters from "./MarkedCharacters";

export default function JsonEditor({
    characterHighlights = {},
    id,
    indentSize = 2,
    label,
    lineHighlights = {},
    maxBytes,
    onChange,
    onCopyShortcut,
    onLimitExceeded,
    placeholder = "Dán JSON vào đây...",
    readOnly = false,
    syntaxHighlight = true,
    textareaRef,
    value,
}) {
    const internalRef = useRef(null);
    const characterLayerRef = useRef(null);
    const gutterLinesRef = useRef(null);
    const highlightLayerRef = useRef(null);
    const highlightMarkerRefs = useRef(new Map());
    const syntaxLayerRef = useRef(null);
    const activeRef = textareaRef ?? internalRef;
    const hasHighlights = Object.keys(lineHighlights).length > 0;
    const hasCharacterHighlights = Object.values(characterHighlights).some((ranges) => ranges.length > 0);
    const valueSize = useMemo(() => getUtf8ByteLength(value), [value]);
    const hasReachedLimit = Boolean(maxBytes && valueSize >= maxBytes);
    const isNearLimit = Boolean(maxBytes && valueSize >= maxBytes * 0.9);
    const highlightedLines = useMemo(
        () => Object.entries(lineHighlights).map(([lineNumber, tone]) => [Number(lineNumber), tone]),
        [lineHighlights],
    );
    const syntaxTokens = useMemo(() => syntaxHighlight ? tokenizeJson(value) : [], [syntaxHighlight, value]);
    const hasSyntax = Boolean(value && syntaxHighlight);
    const lineNumbers = useMemo(
        () => Array.from({ length: Math.max(value.split("\n").length, 1) }, (_, index) => index + 1),
        [value],
    );

    useAutosizeTextarea(activeRef, value);

    function commitValue(nextValue) {
        const nextSize = getUtf8ByteLength(nextValue);

        if (maxBytes && nextSize > maxBytes && nextSize >= valueSize) {
            onLimitExceeded?.();
            return false;
        }

        onChange?.(nextValue);
        return true;
    }

    const syncEditorLayers = useCallback((textarea) => {
        const gutterLines = gutterLinesRef.current;

        if (gutterLines) {
            gutterLines.style.transform = `translateY(-${textarea.scrollTop}px)`;

            highlightedLines.forEach(([lineNumber]) => {
                const gutterLine = gutterLines.children[lineNumber - 1];
                const marker = highlightMarkerRefs.current.get(lineNumber);

                if (gutterLine && marker) {
                    marker.style.transform = `translateY(${gutterLine.offsetTop - textarea.scrollTop}px)`;
                }
            });
        }

        if (syntaxLayerRef.current) {
            syntaxLayerRef.current.style.transform = `translate(${-textarea.scrollLeft}px, ${-textarea.scrollTop}px)`;
        }

        if (characterLayerRef.current) {
            characterLayerRef.current.style.transform = `translate(${-textarea.scrollLeft}px, ${-textarea.scrollTop}px)`;
        }
    }, [highlightedLines]);

    useLayoutEffect(() => {
        const textarea = activeRef.current;

        if (!textarea) return;
        syncEditorLayers(textarea);
    }, [activeRef, syncEditorLayers, value]);

    function handleKeyDown(event) {
        if (event.key === "Tab" && !readOnly) {
            event.preventDefault();
            const textarea = event.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const indentation = " ".repeat(indentSize);
            const nextValue = `${value.slice(0, start)}${indentation}${value.slice(end)}`;

            if (commitValue(nextValue)) {
                requestAnimationFrame(() => {
                    textarea.selectionStart = start + indentSize;
                    textarea.selectionEnd = start + indentSize;
                });
            }
        }

        if (readOnly && onCopyShortcut && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
            event.preventDefault();
            onCopyShortcut();
        }
    }

    function handleScroll(event) {
        syncEditorLayers(event.currentTarget);
    }

    return (
        <section className={`json-editor-card${readOnly ? " is-output" : ""}${hasHighlights ? " has-highlights" : ""}${hasCharacterHighlights ? " has-character-highlights" : ""}${hasSyntax ? " has-syntax" : ""}`}>
            <div className="json-editor-card__heading">
                <span><Braces aria-hidden="true" size={17} /></span>
                <label htmlFor={id}>{label}</label>
                <small className={hasReachedLimit ? "is-limit-reached" : (isNearLimit ? "is-near-limit" : "")}>
                    {value ? `${value.length.toLocaleString("vi-VN")} ký tự` : "Trống"}
                    {maxBytes ? ` · ${formatByteSize(valueSize)} / ${formatByteSize(maxBytes)}` : ""}
                    {hasReachedLimit ? " · Đã đạt giới hạn" : ""}
                </small>
            </div>
            <div className="json-editor-card__body">
                <div aria-hidden="true" className="json-editor-card__gutter">
                    <div className="json-editor-card__gutter-lines" ref={gutterLinesRef}>
                        {lineNumbers.map((lineNumber) => (
                            <span className={lineHighlights[lineNumber] ? `is-${lineHighlights[lineNumber]}` : ""} key={lineNumber}>
                                {lineNumber}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="json-editor-card__editing-area">
                    {hasHighlights ? (
                        <div aria-hidden="true" className="json-editor-card__highlight-layer" ref={highlightLayerRef}>
                            {highlightedLines.map(([lineNumber, tone]) => (
                                <span
                                    className={`is-${tone}`}
                                    key={lineNumber}
                                    ref={(marker) => {
                                        if (marker) highlightMarkerRefs.current.set(lineNumber, marker);
                                        else highlightMarkerRefs.current.delete(lineNumber);
                                    }}
                                />
                            ))}
                        </div>
                    ) : null}
                    {hasSyntax ? (
                        <pre aria-hidden="true" className="json-editor-card__syntax-layer" ref={syntaxLayerRef}>
                            {syntaxTokens.map((token, index) => (
                                <span className={`is-${token.type}`} key={`${index}-${token.type}`}>{token.text}</span>
                            ))}
                        </pre>
                    ) : null}
                    {hasCharacterHighlights ? (
                        <pre aria-hidden="true" className="json-editor-card__character-layer" ref={characterLayerRef}>
                            {value.split("\n").map((line, lineIndex, lines) => (
                                <Fragment key={lineIndex}>
                                    <MarkedCharacters ranges={characterHighlights[lineIndex + 1]} text={line} />
                                    {lineIndex < lines.length - 1 ? "\n" : null}
                                </Fragment>
                            ))}
                        </pre>
                    ) : null}
                    <textarea
                        aria-label={label}
                        id={id}
                        onChange={(event) => commitValue(event.target.value)}
                        onKeyDown={handleKeyDown}
                        onScroll={handleScroll}
                        placeholder={placeholder}
                        readOnly={readOnly}
                        ref={activeRef}
                        spellCheck={false}
                        value={value}
                        wrap="off"
                    />
                </div>
            </div>
        </section>
    );
}
