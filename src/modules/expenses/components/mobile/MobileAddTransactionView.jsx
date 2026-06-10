import TransactionForm from '../transaction/TransactionForm'

export default function MobileAddTransactionView({
    categories,
    onCancel,
    onSubmit,
    wallets,
}) {
    return (
        <main className="mobile-add-transaction-view">
            <header className="mobile-add-transaction-view__header">
                <h1>Thêm giao dịch</h1>
                <button onClick={onCancel} type="button">
                    Hủy
                </button>
            </header>

            <TransactionForm
                categories={categories}
                onSubmit={onSubmit}
                wallets={wallets}
            />
        </main>
    )
}
