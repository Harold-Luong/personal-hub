import { useEffect, useRef, useState } from "react";
import { expenseUiText } from "../../constants/expenseUiMetadata";
import ExpenseButton from "./ExpenseButton";

export default function ExpenseDialog({
    backdropClassName,
    children,
    closeButtonClassName = "",
    eyebrow,
    headerClassName,
    headingId,
    lockBodyScroll = true,
    onClose,
    panelClassName,
    title,
}) {
    const dialogRef = useRef(null);
    // Capture before children with autoFocus commit and move focus into the dialog.
    const [returnFocus] = useState(() => typeof document === "undefined" ? null : document.activeElement);
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; }, [onClose]);
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const previousFocus = returnFocus;
        const dialog = dialogRef.current;
        const focusable = () => [...dialog.querySelectorAll(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        )].filter((element) => element.getClientRects().length && !element.closest('[inert]'));
        if (!dialog.contains(document.activeElement)) {
            (dialog.querySelector('input:not(:disabled)') ?? focusable()[0] ?? dialog).focus();
        }
        const handleKeyDown = (event) => {
            // Only the top dialog handles keyboard events when dialogs are nested.
            if ([...document.querySelectorAll('[data-expense-dialog]')].at(-1) !== dialog) return;
            if (event.key === "Escape") {
                event.preventDefault();
                closeRef.current?.();
            }
            if (event.key === "Tab") {
                const elements = focusable();
                const first = elements[0] ?? dialog;
                const last = elements.at(-1) ?? dialog;
                if (!elements.length || !dialog.contains(document.activeElement)
                    || (event.shiftKey && document.activeElement === first)
                    || (!event.shiftKey && document.activeElement === last)) {
                    event.preventDefault();
                    (event.shiftKey ? last : first).focus();
                }
            }
        };

        if (lockBodyScroll) {
            document.body.style.overflow = "hidden";
        }
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            if (lockBodyScroll) {
                document.body.style.overflow = previousOverflow;
            }
            window.removeEventListener("keydown", handleKeyDown);
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [lockBodyScroll, returnFocus]);

    return (
        <section
            aria-labelledby={headingId}
            aria-modal="true"
            className={backdropClassName}
            data-expense-dialog=""
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
        >
            <div className={panelClassName}>
                <header className={headerClassName}>
                    {eyebrow ? (
                        <div>
                            <p>{eyebrow}</p>
                            <h2 id={headingId}>{title}</h2>
                        </div>
                    ) : (
                        <h2 id={headingId}>{title}</h2>
                    )}
                    {onClose ? (
                        <ExpenseButton
                            ariaLabel={expenseUiText.actions.CLOSE}
                            className={closeButtonClassName}
                            icon="close"
                            onClick={onClose}
                            title={expenseUiText.actions.CLOSE}
                        />
                    ) : null}
                </header>
                {children}
            </div>
        </section>
    );
}
