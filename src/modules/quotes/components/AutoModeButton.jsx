import { Pause, Play } from "lucide-react";

export default function AutoModeButton({ isActive, onToggle }) {
    return (
        <button
            aria-label={isActive ? "Tắt chế độ ngẫu nhiên tự động" : "Bật chế độ ngẫu nhiên tự động"}
            aria-pressed={isActive}
            className={`quote-action quote-action--auto${isActive ? " is-enabled" : ""}`}
            onClick={onToggle}
            type="button"
        >
            {isActive ? <Pause aria-hidden="true" size={18} /> : <Play aria-hidden="true" size={18} />}
            <span>Tự động</span>
        </button>
    );
}
