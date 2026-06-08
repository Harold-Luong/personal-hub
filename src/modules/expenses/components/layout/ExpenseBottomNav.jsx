import CategoryIcon from '../shared/CategoryIcon'

export default function ExpenseBottomNav({ items = [], activeId = 'dashboard' }) {
  return (
    <nav className="expense-bottom-nav">
      {items.slice(0, 5).map((item) => (
        <button className={item.id === activeId ? 'is-active' : ''} key={item.id} type="button">
          <CategoryIcon icon={item.icon} label={item.label} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
