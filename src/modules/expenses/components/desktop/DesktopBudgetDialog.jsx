import BudgetForm from "../budget/BudgetForm";
import ExpenseDialog from "../shared/ExpenseDialog";

export default function DesktopBudgetDialog({ budgets, categories, initialCategoryId, onCancel, onDelete, onSubmit }) {
    return (
        <ExpenseDialog
            backdropClassName="desktop-form-dialog__backdrop"
            closeButtonClassName="desktop-form-dialog__close"
            headerClassName="desktop-form-dialog__header"
            headingId="desktop-budget-dialog-title"
            onClose={onCancel}
            panelClassName="desktop-form-dialog desktop-budget-dialog"
            title="Thiết lập ngân sách"
        >
            <BudgetForm
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
