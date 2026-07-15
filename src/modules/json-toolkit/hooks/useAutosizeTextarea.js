import { useLayoutEffect } from "react";

export default function useAutosizeTextarea(ref, value) {
    useLayoutEffect(() => {
        const textarea = ref.current;

        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.max(textarea.scrollHeight, 300)}px`;
    }, [ref, value]);
}
