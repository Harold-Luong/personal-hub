import AmountText from '../shared/AmountText'
import CategoryIcon from '../shared/CategoryIcon'

const categoryIconMap = {
  food: 'utensils',
  home: 'home',
  income: 'income',
  shopping: 'bag',
  transport: 'bus',
}

export default function TransactionItem({ transaction }) {
  if (!transaction) {
    return null
  }

  return (
    <article className="transaction-item">
      <CategoryIcon icon={categoryIconMap[transaction.category]} label={transaction.title} />
      <div>
        <strong>{transaction.title}</strong>
        <p>{transaction.subtitle}</p>
      </div>
      <AmountText amount={transaction.amount} showSign />
    </article>
  )
}
