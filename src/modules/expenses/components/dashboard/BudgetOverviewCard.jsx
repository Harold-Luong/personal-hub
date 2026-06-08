import AmountText from '../shared/AmountText'
import CategoryIcon from '../shared/CategoryIcon'
import ProgressBar from '../shared/ProgressBar'
import SectionCard from '../shared/SectionCard'

export default function BudgetOverviewCard({ budgets = [] }) {
  return (
    <SectionCard actionLabel="Xem tat ca" className="budget-overview-card" title="Ngan sach cua ban">
      {budgets.map((budget) => (
        <article className="budget-item" key={budget.id ?? budget.category}>
          <div className="budget-item__top">
            <CategoryIcon color={budget.color} icon={budget.icon} label={budget.category} />
            <div>
              <strong>{budget.category}</strong>
              <p>
                <AmountText amount={budget.amount} /> / <AmountText amount={budget.limit} />
              </p>
            </div>
            <span>{Math.round((budget.amount / budget.limit) * 100)}%</span>
          </div>
          <ProgressBar color={budget.color} max={budget.limit} value={budget.amount} />
        </article>
      ))}
    </SectionCard>
  )
}
