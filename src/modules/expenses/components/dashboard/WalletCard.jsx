import AmountText from '../shared/AmountText'
import CategoryIcon from '../shared/CategoryIcon'
import SectionCard from '../shared/SectionCard'

export default function WalletCard({ wallets = [] }) {
  return (
    <SectionCard className="wallet-card" title="Ví của tôi">
      {wallets.map((wallet) => (
        <article className="wallet-item" key={wallet.id}>
          <CategoryIcon
            color={wallet.color}
            icon={wallet.icon}
            label={wallet.name}
          />
          <span>{wallet.name}</span>
          <strong>
            <AmountText amount={wallet.balance} />
          </strong>
        </article>
      ))}
    </SectionCard>
  )
}
