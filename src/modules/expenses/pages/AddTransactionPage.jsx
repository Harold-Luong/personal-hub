import MobileAddTransactionSurface from "../components/mobile/MobileAddTransactionSurface";

export default function AddTransactionPage({ categories, onCancel, onSubmit, wallets }) {
    return (
        <MobileAddTransactionSurface
            categories={categories}
            onCancel={onCancel}
            onSubmit={onSubmit}
            wallets={wallets}
        />
    );
}
