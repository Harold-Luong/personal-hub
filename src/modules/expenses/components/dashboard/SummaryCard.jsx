import AmountText from '../shared/AmountText'
import CategoryIcon from '../shared/CategoryIcon'

export default function SummaryCard({ icon, label, tone = 'positive', trend = 0, value }) {
  return (
    <article className={`summary-card summary-card--${tone}`}>
      <div className="summary-card__top">
        <p>{label}</p>
        <CategoryIcon icon={icon} label={label} />
      </div>
      <strong>
        <AmountText amount={value} />
      </strong>
      <small className={trend < 0 ? 'is-down' : 'is-up'}>
        {trend < 0 ? '↓' : '↑'} {Math.abs(trend)}% so voi thang truoc
      </small>
    </article>
  )
}
