export default function QuoteCreatorPreview({ alignment, background, color, font, fontScale, overlay, previewRef, quote, ratio }) {
    const quoteLengthClass = quote.text.length > 100 ? " has-long-quote" : "";

    return (
        <div className="quote-creator-preview-shell">
            <div
                className={`quote-creator-preview is-${ratio} is-${alignment}${quoteLengthClass}`}
                ref={previewRef}
                style={{
                    "--creator-color": color,
                    "--creator-font": font,
                    "--creator-font-scale": `${fontScale}%`,
                    "--creator-overlay": overlay,
                }}
            >
                <img alt="" className="quote-creator-preview__background" src={background} />
                <span className="quote-creator-preview__veil" />
                <div>
                    <blockquote>“{quote.text}”</blockquote>
                    <cite>— {quote.author}</cite>
                </div>
            </div>
        </div>
    );
}
