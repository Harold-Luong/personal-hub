import CategoryIcon from '../shared/CategoryIcon'

export default function ExpenseSidebar({
  items = [],
  activeId = 'dashboard',
  user,
}) {
  const accountName = user?.displayName || user?.email || 'Tai khoan'

  return (
    <aside className="expense-sidebar">
      <div className="expense-sidebar__brand">
        <span className="expense-sidebar__logo">MC</span>
        <strong>MoneyCare</strong>
      </div>
      <section className="expense-sidebar__profile">
        <span>Xin chào,</span>
        <strong>{accountName}</strong>
        <small>Quản lý chi tiêu thông minh</small>
      </section>
      <nav>
        {items.map((item) => (
          <button
            className={item.id === activeId ? 'is-active' : ''}
            key={item.id}
            type="button"
          >
            <CategoryIcon icon={item.icon} label={item.label} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <section className="expense-sidebar__upgrade">
        <strong>Nang cap Pro</strong>
        <p>Mo khoa tat ca tinh nang va bao cao nang cao.</p>
        <button type="button">Nang cap ngay</button>
      </section>
    </aside>
  )
}
