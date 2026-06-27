import { useEffect } from 'react'
import { XIcon } from '../../icon/ExpenseIcons'
import TransactionForm from '../transaction/TransactionForm'

export default function WebAddTransactionPanel({
  categories,
  onCancel,
  onSubmit,
  wallets,
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel])

  return (
    <section
      aria-labelledby="web-add-transaction-title"
      aria-modal="true"
      className="web-add-transaction-modal"
      role="dialog"
    >
      <div className="web-add-transaction-panel">
        <header className="web-add-transaction-panel__header">
          <h2 id="web-add-transaction-title">Thêm giao dịch</h2>
          <button
            aria-label="Đóng"
            className="web-add-transaction-panel__close"
            onClick={onCancel}
            title="Đóng"
            type="button"
          >
            <XIcon size={18} />
          </button>
        </header>
        <TransactionForm
          categories={categories}
          onCancel={onCancel}
          onSubmit={onSubmit}
          wallets={wallets}
        />
      </div>
    </section>
  )
}
