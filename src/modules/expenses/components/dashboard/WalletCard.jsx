import AmountText from "../shared/AmountText";
import ExpenseIcon from "../shared/ExpenseEmoji";
import SectionCard from "../shared/SectionCard";

export default function WalletCard({ onEditWallet, onManageWallet, wallets = [] }) {
    return (
        <SectionCard
            actionLabel={wallets.length ? "Quản lý" : "Tạo ví"}
            className="wallet-card"
            onAction={onManageWallet}
            title="Ví của tôi"
        >
            {wallets.length ? (
                wallets.map((wallet) => (
                    <button
                        className="wallet-item"
                        key={wallet.id}
                        onClick={() => onEditWallet?.(wallet.id)}
                        type="button"
                    >
                        <ExpenseIcon color={wallet.color} icon={wallet.icon} label={wallet.name} />
                        <span>
                            <strong>{wallet.name}</strong>
                            {wallet.isDefault ? <small>Mặc định</small> : null}
                        </span>
                        <strong>
                            <AmountText amount={wallet.balance} />
                        </strong>
                    </button>
                ))
            ) : (
                <p className="wallet-card__empty">Chưa có ví nào để ghi nhận giao dịch.</p>
            )}
        </SectionCard>
    );
}
