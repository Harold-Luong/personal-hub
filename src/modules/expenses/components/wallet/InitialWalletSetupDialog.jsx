import ExpenseDialog from "../shared/ExpenseDialog";
import WalletForm from "./WalletForm";

export default function InitialWalletSetupDialog({ onSubmit, wallet, wallets = [] }) {
    return (
        <ExpenseDialog
            backdropClassName="desktop-form-dialog__backdrop initial-wallet-setup__backdrop"
            eyebrow="Bắt đầu"
            headerClassName="desktop-form-dialog__header initial-wallet-setup__header"
            headingId="initial-wallet-setup-title"
            panelClassName="desktop-form-dialog initial-wallet-setup__dialog"
            title="Thiết lập ví đầu tiên"
        >
            <div className="initial-wallet-setup__body">
                <p className="initial-wallet-setup__intro">
                    Hãy thiết lập ví và số dư ban đầu trước khi bắt đầu ghi nhận giao dịch.
                </p>
                <WalletForm
                    initialWalletId={wallet?.id ?? null}
                    isInitialSetup
                    onSubmit={onSubmit}
                    wallets={wallets}
                />
            </div>
        </ExpenseDialog>
    );
}
