import AmountText from '../shared/AmountText'
import CategoryIcon from '../shared/CategoryIcon'
import ProgressBar from '../shared/ProgressBar'
import SectionCard from '../shared/SectionCard'
import {
  calculateBudgetUsagePercentage,
  getBudgetUsageStatus,
} from '../../utils/expenseCalculations'

const budgetStatusColors = {
  exceeded: '#dc1717',
  warning: '#d98c00',
}

export default function BudgetOverviewCard({ budgets = [] }) {
  return (
    <SectionCard className="budget-overview-card" title="Ngân sách của bạn">
      {budgets.length ? budgets.map((budget) => {
        const status = getBudgetUsageStatus(budget)
        const statusColor = budgetStatusColors[status] ?? budget.color

        return (
          <article
            className={`budget-item budget-item--${status}`}
            key={budget.id ?? budget.category}
          >
            <div className="budget-item__top">
              <CategoryIcon color={budget.color} icon={budget.icon} label={budget.category} />
              <div>
                <strong>{budget.category}</strong>
                <p>
                  <AmountText amount={budget.amount} /> / <AmountText amount={budget.limit} />
                </p>
              </div>
              <span>{calculateBudgetUsagePercentage(budget)}%</span>
            </div>
            <ProgressBar color={statusColor} max={budget.limit} value={budget.amount} />
          </article>
        )
      }) : (
        <p className="budget-overview-card__empty">Chưa tạo ngân sách cho tháng này.</p>
      )}
    </SectionCard>
  )
}
