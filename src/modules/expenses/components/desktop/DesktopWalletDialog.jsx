import ExpenseDialog from "../shared/ExpenseDialog";
import WalletForm from "../wallet/WalletForm";

export default function DesktopWalletDialog({
    initialWalletId,
    onCancel,
    onDelete,
    onSubmit,
    wallets,
}) {
    return (
        <ExpenseDialog
            backdropClassName="desktop-form-dialog__backdrop"
            closeButtonClassName="desktop-form-dialog__close"
            headerClassName="desktop-form-dialog__header"
            headingId="desktop-wallet-dialog-title"
            onClose={onCancel}
            panelClassName="desktop-form-dialog desktop-wallet-dialog"
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
