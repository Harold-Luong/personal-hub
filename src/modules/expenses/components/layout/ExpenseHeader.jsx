import MonthPicker from '../shared/MonthPicker'

export default function ExpenseHeader({ month = '2026-06' }) {
  return (
    <header className="expense-header">
      <div>
        <h1>Xin chao, Duc</h1>
        <p>Quan ly chi tieu thong minh</p>
      </div>
      <div className="expense-header__actions">
        <MonthPicker value={month} />
        <button aria-label="Search" type="button">SR</button>
        <button aria-label="Notifications" type="button">NT</button>
        <span className="expense-header__avatar">D</span>
      </div>
    </header>
  )
}
