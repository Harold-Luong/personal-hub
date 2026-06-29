import AmountText from '../shared/AmountText'
import CategoryIcon from '../shared/CategoryIcon'

export default function TransactionItem({ transaction }) {
  if (!transaction) {
    return null
  }

  return (
    <article className="transaction-item">
      <CategoryIcon
        appearance="emoji"
        icon={transaction.icon ?? transaction.category}
        label={transaction.title}
      />
      <div>
        <strong>{transaction.title}</strong>
        <p>{transaction.subtitle}</p>
         <p>{transaction.note}</p>
      </div>
      <AmountText amount={transaction.amount} showSign />
    </article>
  )
}
