import ExpenseDialog from "../shared/ExpenseDialog";
import TransactionForm from "../transaction/TransactionForm";

export default function DesktopTransactionDialog({
    categories,
    initialTransaction,
    onCancel,
    onSubmit,
    submitLabel,
    title = "Thêm giao dịch",
    wallets,
}) {
    return (
        <ExpenseDialog
            backdropClassName="desktop-form-dialog__backdrop"
            closeButtonClassName="desktop-form-dialog__close"
            headerClassName="desktop-form-dialog__header"
            headingId="desktop-transaction-dialog-title"
            onClose={onCancel}
            panelClassName="desktop-form-dialog"
            title={title}
        >
            <TransactionForm
                categories={categories}
                initialTransaction={initialTransaction}
                onCancel={onCancel}
                onSubmit={onSubmit}
                submitLabel={submitLabel}
                wallets={wallets}
            />
        </ExpenseDialog>
    );
}
