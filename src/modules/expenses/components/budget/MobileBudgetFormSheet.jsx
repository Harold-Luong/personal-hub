import ExpenseDialog from "../shared/ExpenseDialog";
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

    return (
        <ExpenseDialog
            backdropClassName="mobile-budget-page__sheet-backdrop"
            headerClassName="mobile-budget-page__sheet-header"
            headingId="mobile-budget-form-title"
            onClose={onCancel}
            panelClassName="mobile-budget-page__sheet"
            title={isEditing ? "Sửa ngân sách" : "Tạo ngân sách"}
        >
            <BudgetForm
                key={initialCategoryId || "budget-form"}
                budgets={budgets}
                categories={categories}
                initialCategoryId={initialCategoryId}
                onCancel={onCancel}
                onDelete={onDelete}
                onSubmit={onSubmit}
            />
        </ExpenseDialog>
    );
}
