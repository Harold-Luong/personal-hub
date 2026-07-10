import { useEffect } from "react";
import { expenseUiText } from "../../constant/expensesUiMetaData";
import { XIcon } from "../../icon/ExpenseIcons";
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
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose?.();
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
        };
    }, [lockBodyScroll, onClose]);

    return (
        <section
            aria-labelledby={headingId}
            aria-modal="true"
            className={backdropClassName}
            role="dialog"
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
                    <ExpenseButton
                        ariaLabel={expenseUiText.actions.CLOSE}
                        className={closeButtonClassName}
                        icon={XIcon}
                        onClick={onClose}
                        title={expenseUiText.actions.CLOSE}
                    />
                </header>
                {children}
            </div>
        </section>
    );
}
