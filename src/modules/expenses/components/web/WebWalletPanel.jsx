import ExpenseDialog from "../shared/ExpenseDialog";
import WalletForm from "../wallet/WalletForm";

export default function WebWalletPanel({
    initialWalletId,
    onCancel,
    onDelete,
    onSubmit,
    wallets,
}) {
    return (
        <ExpenseDialog
            backdropClassName="web-add-transaction-modal"
            closeButtonClassName="web-add-transaction-panel__close"
            headerClassName="web-add-transaction-panel__header"
            headingId="web-wallet-title"
            onClose={onCancel}
            panelClassName="web-add-transaction-panel web-wallet-panel"
            title="Quản lý ví"
        >
            <WalletForm
                initialWalletId={initialWalletId}
                onCancel={onCancel}
                onDelete={onDelete}
                onSubmit={onSubmit}
                wallets={wallets}
            />
        </ExpenseDialog>
    );
}
