import ExpenseDialog from "../shared/ExpenseDialog";
import TransactionForm from "../transaction/TransactionForm";

export default function WebAddTransactionPanel({
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
            backdropClassName="web-add-transaction-modal"
            closeButtonClassName="web-add-transaction-panel__close"
            headerClassName="web-add-transaction-panel__header"
            headingId="web-add-transaction-title"
            onClose={onCancel}
            panelClassName="web-add-transaction-panel"
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
