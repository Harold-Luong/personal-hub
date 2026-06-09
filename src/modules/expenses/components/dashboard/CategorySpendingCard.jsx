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
      actionLabel="Xem chi tiết"
      className={`category-spending-card category-spending-card--${variant}`}
      title="Chi tiêu theo danh mục"
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
                <span className="category-row__name">{category.name}</span>
                <span className="category-row__amount">
                  <AmountText amount={category.amount} />
                </span>
              </div>
              <ProgressBar color={category.color} value={category.percentage} />
            </div>
            <small className="category-row__percentage">{category.percentage}%</small>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
