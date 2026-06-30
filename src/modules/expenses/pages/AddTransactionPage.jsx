import MobileAddTransactionView from "../components/mobile/MobileAddTransactionView";

export default function AddTransactionPage({ categories, onCancel, onSubmit, wallets }) {
    return (
        <MobileAddTransactionView categories={categories} onCancel={onCancel} onSubmit={onSubmit} wallets={wallets} />
    );
}
