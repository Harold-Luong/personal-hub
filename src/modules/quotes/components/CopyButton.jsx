import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyButton({ quote }) {
    const [didCopy, setDidCopy] = useState(false);

    const handleCopy = async () => {
        const quoteText = `“${quote.text}” — ${quote.author}`;

        try {
            await navigator.clipboard.writeText(quoteText);
            setDidCopy(true);
            window.setTimeout(() => setDidCopy(false), 1600);
        } catch {
            setDidCopy(false);
        }
    };

    return (
        <button aria-label="Sao chép câu nói" className="quote-action quote-action--copy" onClick={handleCopy} type="button">
            {didCopy ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
            <span>{didCopy ? "Đã chép" : "Sao chép"}</span>
        </button>
    );
}
