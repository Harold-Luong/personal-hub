import AmountText from "../shared/AmountText";
import ExpenseIcon from "../shared/ExpenseEmoji";
import SectionCard from "../shared/SectionCard";

export default function WalletCard({ wallets = [] }) {
    return (
        <SectionCard className="wallet-card" title="Ví của tôi">
            {wallets.map((wallet) => (
                <article className="wallet-item" key={wallet.id}>
                    <ExpenseIcon color={wallet.color} icon={wallet.icon} label={wallet.name} />
                    <span>{wallet.name}</span>
                    <strong>
                        <AmountText amount={wallet.balance} />
                    </strong>
                </article>
            ))}
        </SectionCard>
    );
}
