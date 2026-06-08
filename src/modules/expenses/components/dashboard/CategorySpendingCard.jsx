import AmountText from '../shared/AmountText'
import CategoryIcon from '../shared/CategoryIcon'
import ProgressBar from '../shared/ProgressBar'
import SectionCard from '../shared/SectionCard'

export default function CategorySpendingCard({ categories = [], variant = 'desktop' }) {
  const stops = categories.reduce((result, category, index) => {
    const previous = index === 0 ? 0 : result.total
    const next = previous + category.percentage
    result.total = next
    result.items.push(`${category.color} ${previous}% ${next}%`)
    return result
  }, { items: [], total: 0 }).items.join(', ')

  return (
    <SectionCard
      actionLabel="Xem chi tiet"
      className={`category-spending-card category-spending-card--${variant}`}
      title="Chi tieu theo danh muc"
    >
      {variant === 'desktop' ? (
        <div className="category-spending-card__chart" style={{ '--chart-stops': stops }} />
      ) : null}
      <div className="category-spending-card__list">
        {categories.map((category) => (
          <div className="category-row" key={category.id}>
            <CategoryIcon color={category.color} icon={category.icon} label={category.name} />
            <div className="category-row__body">
              <div>
                <span>{category.name}</span>
                <AmountText amount={category.amount} />
              </div>
              <ProgressBar color={category.color} value={category.percentage} />
            </div>
            <small>{category.percentage}%</small>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
