export default function MarkedCharacters({ ranges = [], text }) {
    if (ranges.length === 0 || text.length === 0) return text;

    const parts = [];
    let cursor = 0;

    ranges.forEach((range, index) => {
        const start = Math.max(cursor, Math.min(range.start, text.length));
        const end = Math.max(start, Math.min(range.end, text.length));

        if (start > cursor) parts.push(text.slice(cursor, start));
        if (end > start) {
            parts.push(
                <span className={`json-character-marker is-${range.tone}`} key={`${start}-${end}-${index}`}>
                    {text.slice(start, end)}
                </span>,
            );
        }
        cursor = end;
    });

    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
}
