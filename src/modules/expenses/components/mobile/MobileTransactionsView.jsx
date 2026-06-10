import { useMemo, useState } from 'react'
import { FilterIcon, SearchIcon } from '../../icon/ExpenseIcons'
import {
    getLatestTransactionDate,
    getTransactionGroupLabel,
    groupTransactions,
} from '../../utils/mobileTransactionUtils'
import AmountText from '../shared/AmountText'
import CategoryIcon from '../shared/CategoryIcon'
import ExpenseBottomNav from '../layout/ExpenseBottomNav'

const transactionFilters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'expense', label: 'Chi tiêu' },
    { id: 'income', label: 'Thu nhập' },
    { id: 'transfer', label: 'Chuyển khoản' },
]

function MobileTransactionItem({ transaction }) {
    return (
        <article className="mobile-transaction-item">
            <CategoryIcon
                appearance="emoji"
                className={`mobile-transaction-item__icon mobile-transaction-item__icon--${transaction.icon ?? transaction.category}`}
                icon={transaction.icon ?? transaction.category}
                label={transaction.title}
            />
            <div className="mobile-transaction-item__copy">
                <strong>{transaction.title}</strong>
                <time dateTime={`${transaction.date}T${transaction.time}`}>
                    {transaction.time}
                </time>
            </div>
            <AmountText amount={transaction.amount} showSign />
        </article>
    )
}

export default function MobileTransactionsView({
    navItems,
    onNavigate,
    transactions = [],
}) {
    const [activeFilter, setActiveFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    const transactionGroups = useMemo(
        () => groupTransactions(transactions, activeFilter, searchTerm),
        [activeFilter, searchTerm, transactions],
    )
    const latestDate = getLatestTransactionDate(transactions)

    return (
        <main className="mobile-transactions-view">
            <header className="mobile-transactions-view__header">
                <h1>Giao dịch</h1>
            </header>

            <div className="mobile-transactions-view__search-row">
                <label className="mobile-transactions-view__search">
                    <SearchIcon size={20} />
                    <span className="sr-only">Tìm kiếm giao dịch</span>
                    <input
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Tìm kiếm giao dịch"
                        type="search"
                        value={searchTerm}
                    />
                </label>
                <button
                    aria-label="Lọc giao dịch"
                    className="mobile-transactions-view__filter-button"
                    type="button"
                >
                    <FilterIcon size={20} />
                </button>
            </div>

            <div
                aria-label="Lọc theo loại giao dịch"
                className="mobile-transactions-view__filters"
                role="group"
            >
                {transactionFilters.map((filter) => (
                    <button
                        aria-pressed={activeFilter === filter.id}
                        className={activeFilter === filter.id ? 'is-active' : ''}
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        type="button"
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="mobile-transactions-view__groups">
                {transactionGroups.length ? (
                    transactionGroups.map((group) => (
                        <section className="mobile-transaction-group" key={group.date}>
                            <h2>{getTransactionGroupLabel(group.date, latestDate)}</h2>
                            <div className="mobile-transaction-group__list section-card">
                                {group.transactions.map((transaction) => (
                                    <MobileTransactionItem
                                        key={transaction.id}
                                        transaction={transaction}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <p className="mobile-transactions-view__empty">
                        Không tìm thấy giao dịch phù hợp.
                    </p>
                )}
            </div>

            <ExpenseBottomNav
                activeId="transactions"
                items={navItems}
                onNavigate={onNavigate}
            />
        </main>
    )
}
