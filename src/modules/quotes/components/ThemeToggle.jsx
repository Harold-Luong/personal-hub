import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ onToggle, theme }) {
    const isDark = theme === "dark";

    return (
        <button
            aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            className="lang-icon-button"
            onClick={onToggle}
            title={isDark ? "Giao diện sáng" : "Giao diện tối"}
            type="button"
        >
            {isDark ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
        </button>
    );
}
