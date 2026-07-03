import { useEffect } from "react";
import { XIcon } from "../../icon/ExpenseIcons";
import BudgetForm from "./BudgetForm";

export default function MobileBudgetFormSheet({
    budgets = [],
    categories = [],
    initialCategoryId = "",
    onCancel,
    onDelete,
    onSubmit,
}) {
    const isEditing = budgets.some((budget) => budget.categoryId === initialCategoryId);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    return (
        <section
            aria-labelledby="mobile-budget-form-title"
            aria-modal="true"
            className="mobile-budget-page__sheet-backdrop"
            role="dialog"
        >
            <div className="mobile-budget-page__sheet">
                <header className="mobile-budget-page__sheet-header">
                    <h2 id="mobile-budget-form-title">{isEditing ? "Sửa ngân sách" : "Tạo ngân sách"}</h2>
                    <button aria-label="Đóng" onClick={onCancel} type="button">
                        <XIcon size={18} />
                    </button>
                </header>
                <BudgetForm
                    key={initialCategoryId || "budget-form"}
                    budgets={budgets}
                    categories={categories}
                    initialCategoryId={initialCategoryId}
                    onCancel={onCancel}
                    onDelete={onDelete}
                    onSubmit={onSubmit}
                />
            </div>
        </section>
    );
}
