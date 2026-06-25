import { useState } from 'react'
import MonthPicker from '../shared/MonthPicker'
import { LogoutIcon, ThemeIcon } from '../../icon/ExpenseIcons'

export default function ExpenseHeader({
  month = '2026-06',
  onLogout,
  onToggleTheme,
  theme = 'sage',
  user,
}) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [failedAvatarUrl, setFailedAvatarUrl] = useState('')
  const accountName = user?.displayName || user?.email || 'Tài khoản'
  const accountPhotoUrl = user?.photoURL || ''
  const shouldShowAccountPhoto =
    accountPhotoUrl && failedAvatarUrl !== accountPhotoUrl
  const avatarLabel = accountName.trim().charAt(0).toUpperCase() || 'T'

  const handleLogout = async () => {
    setIsSigningOut(true)

    try {
      await onLogout?.()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="expense-header">
      <div>
        <h1>Xin chào, {accountName}</h1>
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
        <span
          className="expense-header__avatar"
          title={user?.email || accountName}
        >
          {shouldShowAccountPhoto ? (
            <img
              alt=""
              onError={() => setFailedAvatarUrl(accountPhotoUrl)}
              src={accountPhotoUrl}
            />
          ) : (
            avatarLabel
          )}
        </span>
        <button
          aria-label="Đăng xuất"
          className="expense-header__logout"
          disabled={isSigningOut}
          onClick={handleLogout}
          title="Đăng xuất"
          type="button"
        >
          <LogoutIcon size={17} />
        </button>
      </div>
    </header>
  )
}
