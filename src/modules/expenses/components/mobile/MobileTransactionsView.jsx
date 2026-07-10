import { useMemo, useState } from "react";
import { FilterIcon, SearchIcon } from "../../icon/ExpenseIcons";
import {
    getLatestTransactionDate,
    getTransactionGroupLabel,
    groupTransactions,
} from "../../utils/mobileTransactionUtils";
import { expenseTransactionFilters } from "../../constant/expensesMetaData";
import { expenseFilterValues, expenseUiText } from "../../constant/expensesUiMetaData";
import MobilePageHeader from "./MobilePageHeader";
import AmountText from "../shared/AmountText";
import ExpenseButton from "../shared/ExpenseButton";
import ExpenseIcon from "../shared/ExpenseEmoji";
import ExpenseStateMessage from "../shared/ExpenseStateMessage";
import SectionCard from "../shared/SectionCard";

function MobileTransactionItem({ transaction }) {
    return (
        <article className="mobile-transaction-item">
            <ExpenseIcon
                appearance="emoji"
                className={`mobile-transaction-item__icon mobile-transaction-item__icon--${transaction.icon ?? transaction.category}`}
                icon={transaction.icon ?? transaction.category}
                label={transaction.title}
            />
            <div className="mobile-transaction-item__copy">
                <strong>{transaction.title}</strong>
                <time dateTime={`${transaction.date}T${transaction.time}`}>{transaction.time}</time>
            </div>
            <AmountText amount={transaction.amount} showSign />
        </article>
    );
}

export default function MobileTransactionsView({ transactions = [] }) {
    const [activeFilter, setActiveFilter] = useState(expenseFilterValues.ALL);
    const [searchTerm, setSearchTerm] = useState("");

    const transactionGroups = useMemo(
        () => groupTransactions(transactions, activeFilter, searchTerm),
        [activeFilter, searchTerm, transactions],
    );
    const latestDate = getLatestTransactionDate(transactions);

    return (
        <main className="mobile-transactions-view">
            <MobilePageHeader className="mobile-transactions-view__header" title="Giao dịch" titleTag="h1" />

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
                <ExpenseButton
                    ariaLabel="Lọc giao dịch"
                    className="mobile-transactions-view__filter-button"
                    icon={FilterIcon}
                    iconSize={20}
                />
            </div>

            <div aria-label="Lọc theo loại giao dịch" className="mobile-transactions-view__filters" role="group">
                {expenseTransactionFilters.map((filter) => (
                    <ExpenseButton
                        aria-pressed={activeFilter === filter.id}
                        className={activeFilter === filter.id ? "is-active" : ""}
                        key={filter.id}
                        label={filter.label}
                        onClick={() => setActiveFilter(filter.id)}
                    />
                ))}
            </div>

            <div className="mobile-transactions-view__groups">
                {transactionGroups.length ? (
                    transactionGroups.map((group) => (
                        <section className="mobile-transaction-group" key={group.date}>
                            <h2>{getTransactionGroupLabel(group.date, latestDate)}</h2>
                            <SectionCard
                                actionLabel={null}
                                as="div"
                                className="mobile-transaction-group__list"
                            >
                                {group.transactions.map((transaction) => (
                                    <MobileTransactionItem key={transaction.id} transaction={transaction} />
                                ))}
                            </SectionCard>
                        </section>
                    ))
                ) : (
                    <ExpenseStateMessage
                        className="mobile-transactions-view__empty"
                        message={expenseUiText.transaction.NOT_FOUND}
                    />
                )}
            </div>
        </main>
    );
}
