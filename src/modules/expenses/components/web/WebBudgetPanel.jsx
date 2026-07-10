import BudgetForm from "../budget/BudgetForm";
import ExpenseDialog from "../shared/ExpenseDialog";

export default function WebBudgetPanel({ budgets, categories, initialCategoryId, onCancel, onDelete, onSubmit }) {
    return (
        <ExpenseDialog
            backdropClassName="web-add-transaction-modal"
            closeButtonClassName="web-add-transaction-panel__close"
            headerClassName="web-add-transaction-panel__header"
            headingId="web-budget-title"
            onClose={onCancel}
            panelClassName="web-add-transaction-panel web-budget-panel"
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
