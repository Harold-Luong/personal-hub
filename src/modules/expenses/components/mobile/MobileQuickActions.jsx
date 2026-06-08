import CategoryIcon from '../shared/CategoryIcon'

const actions = [
  { id: 'add', label: 'Them giao dich', icon: 'wallet' },
  { id: 'transactions', label: 'Giao dich', icon: 'swap' },
  { id: 'budget', label: 'Ngan sach', icon: 'card' },
  { id: 'report', label: 'Bao cao', icon: 'chart' },
]

export default function MobileQuickActions() {
  return (
    <div className="mobile-quick-actions">
      {actions.map((action) => (
        <button key={action.id} type="button">
          <CategoryIcon icon={action.icon} label={action.label} />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
