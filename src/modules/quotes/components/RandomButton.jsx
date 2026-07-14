import { RefreshCw } from "lucide-react";

export default function RandomButton({ disabled, onClick }) {
    return (
        <button className="quote-action quote-action--primary" disabled={disabled} onClick={onClick} type="button">
            <RefreshCw aria-hidden="true" size={18} />
            <span>Câu khác</span>
        </button>
    );
}
