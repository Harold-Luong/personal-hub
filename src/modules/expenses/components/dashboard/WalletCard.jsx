import AmountText from '../shared/AmountText'
import CategoryIcon from '../shared/CategoryIcon'
import SectionCard from '../shared/SectionCard'

export default function WalletCard({ wallets = [] }) {
  return (
    <SectionCard actionLabel="Xem tat ca" className="wallet-card" title="Vi cua toi">
      {wallets.map((wallet) => (
        <article className="wallet-item" key={wallet.id}>
          <CategoryIcon icon={wallet.icon} label={wallet.name} />
          <span>{wallet.name}</span>
          <strong>
            <AmountText amount={wallet.balance} />
          </strong>
        </article>
      ))}
    </SectionCard>
  )
}
