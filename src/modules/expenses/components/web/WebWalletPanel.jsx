import { useEffect } from "react";
import { XIcon } from "../../icon/ExpenseIcons";
import WalletForm from "../wallet/WalletForm";

export default function WebWalletPanel({
    initialWalletId,
    onCancel,
    onDelete,
    onSubmit,
    wallets,
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
            aria-labelledby="web-wallet-title"
            aria-modal="true"
            className="web-add-transaction-modal"
            role="dialog"
        >
            <div className="web-add-transaction-panel web-wallet-panel">
                <header className="web-add-transaction-panel__header">
                    <h2 id="web-wallet-title">Quản lý ví</h2>
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
                <WalletForm
                    initialWalletId={initialWalletId}
                    onCancel={onCancel}
                    onDelete={onDelete}
                    onSubmit={onSubmit}
                    wallets={wallets}
                />
            </div>
        </section>
    );
}
