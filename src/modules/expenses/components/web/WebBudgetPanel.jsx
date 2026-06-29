import { useEffect } from "react";
import { XIcon } from "../../icon/ExpenseIcons";
import BudgetForm from "../budget/BudgetForm";

export default function WebBudgetPanel({
    budgets,
    categories,
    onCancel,
    onDelete,
    onSubmit,
}) {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onCancel?.();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onCancel]);

    return (
        <section
            aria-labelledby="web-budget-title"
            aria-modal="true"
            className="web-add-transaction-modal"
            role="dialog"
        >
            <div className="web-add-transaction-panel web-budget-panel">
                <header className="web-add-transaction-panel__header">
                    <h2 id="web-budget-title">Thiết lập ngân sách</h2>
                    <button
                        aria-label="Đóng"
                        className="web-add-transaction-panel__close"
                        onClick={onCancel}
                        title="Đóng"
                        type="button"
                    >
                        <XIcon size={18} />
                    </button>
                </header>
                <BudgetForm
                    budgets={budgets}
                    categories={categories}
                    onCancel={onCancel}
                    onDelete={onDelete}
                    onSubmit={onSubmit}
                />
            </div>
        </section>
    );
}
