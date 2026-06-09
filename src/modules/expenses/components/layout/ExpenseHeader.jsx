import MonthPicker from '../shared/MonthPicker'
import { ThemeIcon } from '../../icon/ExpenseIcons'

export default function ExpenseHeader({
  month = '2026-06',
  onToggleTheme,
  theme = 'sage',
}) {
  return (
    <header className="expense-header">
      <div>
        <h1>Xin chao, Duc</h1>
        <p>Quan ly chi tieu thong minh</p>
      </div>
      <div className="expense-header__actions">
        <MonthPicker value={month} />
        <button
          aria-label="Doi giao dien"
          className="expense-theme-toggle"
          onClick={onToggleTheme}
          type="button"
        >
          <ThemeIcon size={18} />
          <span>{theme}</span>
        </button>
        <button aria-label="Search" type="button">SR</button>
        <button aria-label="Notifications" type="button">NT</button>
        <span className="expense-header__avatar">D</span>
      </div>
    </header>
  )
}
