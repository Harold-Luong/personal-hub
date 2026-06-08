import AmountText from '../shared/AmountText'

export default function BalanceHeroCard({ balance = 0, expense = 0, income = 0 }) {
  return (
    <section className="balance-hero-card">
      <div className="balance-hero-card__main">
        <p>Tong so du</p>
        <strong>
          <AmountText amount={balance} />
        </strong>
        <span className="balance-hero-card__sparkline" />
      </div>
      <div className="balance-hero-card__split">
        <div>
          <p>Thu nhap</p>
          <AmountText amount={income} />
        </div>
        <div>
          <p>Chi tieu</p>
          <AmountText amount={-Math.abs(expense)} />
        </div>
      </div>
    </section>
  )
}
