export default function QuoteText({ quote }) {
    return (
        <div className="quote-text">
            <span className="quote-text__eyebrow">Một câu nói hôm nay</span>
            <blockquote>“{quote.text}”</blockquote>
            <cite>— {quote.author}</cite>
        </div>
    );
}
