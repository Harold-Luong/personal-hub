import MobilePageHeader from "./MobilePageHeader";
import TransactionForm from "../transaction/TransactionForm";

export default function MobileAddTransactionView({ categories, onCancel, onSubmit, wallets }) {
    return (
        <main className="mobile-add-transaction-view">
            <MobilePageHeader
                actions={
                    <button onClick={onCancel} type="button">
                        Hủy
                    </button>
                }
                className="mobile-add-transaction-view__header"
                title="Thêm giao dịch"
                titleTag="h1"
            />

            <TransactionForm categories={categories} onSubmit={onSubmit} wallets={wallets} />
        </main>
    );
}
