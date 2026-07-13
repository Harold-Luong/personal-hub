import { useState } from "react";
import { quoteStorageKeys, quoteThemes } from "../constants/quoteMetadata";

function getInitialTheme() {
    if (typeof window === "undefined") {
        return quoteThemes.DARK;
    }

    const storedTheme = window.localStorage.getItem(quoteStorageKeys.theme);

    if (storedTheme === quoteThemes.DARK || storedTheme === quoteThemes.LIGHT) {
        return storedTheme;
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? quoteThemes.DARK
        : quoteThemes.LIGHT;
}

export default function useTheme() {
    const [theme, setTheme] = useState(getInitialTheme);

    const toggleTheme = () => {
        setTheme((currentTheme) => {
            const nextTheme = currentTheme === quoteThemes.DARK ? quoteThemes.LIGHT : quoteThemes.DARK;
            window.localStorage.setItem(quoteStorageKeys.theme, nextTheme);
            return nextTheme;
        });
    };

    return { theme, toggleTheme };
}
