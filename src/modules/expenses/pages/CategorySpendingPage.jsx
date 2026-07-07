import { useCallback, useEffect, useMemo, useState } from "react";
import { selectAuthUid, useAuthSessionStore } from "../../../stores/authSessionStore";
import {
    getExpenseMonthOptionsCacheKey,
    selectExpenseBudgetLimitsByMonth,
    selectExpenseCategories,
    selectExpenseMonthOptionsByYear,
    selectExpenseMonthlyStatsByMonth,
    useExpenseDataStore,
} from "../../../stores/expenseDataStore";
import AmountText from "../components/shared/AmountText";
import DonutChart from "../components/shared/DonutChart";
import ExpenseEmoji from "../components/shared/ExpenseEmoji";
import ProgressBar from "../components/shared/ProgressBar";
import SummaryCardList from "../components/shared/SummaryCardList";
import {
    budgetExceededThresholdPercentage,
    budgetWarningThresholdPercentage,
    categoryChartPinnedCategoryLimit,
    categoryChartTopCategoryLimit,
    categoryTransactionPageSize,
} from "../constant/expensesMetaData";
import { BudgetIcon, CalendarIcon, ChevronIcon, ReportIcon, TransactionListIcon, XIcon } from "../icon/ExpenseIcons";
import { getCategorySpendingByMonth } from "../utils/categorySpendingUtils";
import { formatCurrency } from "../utils/formatCurrency";
import { getEmptyMonthlyStats } from "../utils/monthlyStatsUtils";
import { getCurrentMonthKey, getCurrentYear, getMonthLabel, getVisibleMonthOptions } from "../utils/monthUtils";
import {
    getTransactionDateParts,
    getTransactionSortTime,
    getTransactionWalletLabel,
} from "../utils/transactionDisplayUtils";

function getBudgetTone(amount, limit) {
    if (!limit) {
        return "neutral";
    }

    const percentage = Math.round((amount / limit) * 100);

    if (percentage >= budgetExceededThresholdPercentage) {
        return "danger";
    }

    if (percentage >= budgetWarningThresholdPercentage) {
        return "warning";
    }

    return "good";
}

function getBudgetPercentage(amount, limit) {
    return limit > 0 ? Math.round((amount / limit) * 100) : 0;
}

function getBudgetStatusLabel(category) {
    if (!category.budgetLimit) {
        return "Chưa đặt ngân sách";
    }

    if (category.budgetTone === "danger") {
        return "Vượt ngân sách";
    }

    if (category.budgetTone === "warning") {
        return "Gần chạm ngân sách";
    }

    return "Trong ngân sách";
}

function getMonthDayCount(monthKey) {
    const [year, month] = String(monthKey ?? "")
        .split("-")
        .map(Number);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
        return 30;
    }

    return new Date(year, month, 0).getDate();
}

function getAverageDailyAmount(amount, monthKey) {
    return Math.round((amount ?? 0) / getMonthDayCount(monthKey));
}

function getLatestTransaction(transactions) {
    return transactions.reduce((latestTransaction, transaction) => {
        if (!latestTransaction) {
            return transaction;
        }

        return getTransactionSortTime(transaction) > getTransactionSortTime(latestTransaction)
            ? transaction
            : latestTransaction;
    }, null);
}

function getCategoryRows(categorySpending, budgets, sortKey) {
    const budgetsByCategory = new Map(budgets.map((budget) => [budget.categoryId, budget]));

    return categorySpending
        .map((category) => {
            const budget = budgetsByCategory.get(category.id);
            const budgetLimit = budget?.limitMinor ?? 0;

            return {
                ...category,
                budget,
                budgetLimit,
                budgetPercentage: getBudgetPercentage(category.amount, budgetLimit),
                budgetTone: getBudgetTone(category.amount, budgetLimit),
            };
        })
        .sort((firstCategory, secondCategory) => {
            if (sortKey === "name") {
                return firstCategory.name.localeCompare(secondCategory.name, "vi");
            }

            if (sortKey === "budget") {
                return secondCategory.budgetPercentage - firstCategory.budgetPercentage;
            }

            return (secondCategory.amount ?? 0) - (firstCategory.amount ?? 0);
        });
}

function CategorySummaryCards({ categories, monthlyStats, budgets }) {
    const totalExpense = monthlyStats.expenseMinor ?? 0;
    const topCategory = [...categories].sort(
        (firstCategory, secondCategory) => (secondCategory.amount ?? 0) - (firstCategory.amount ?? 0),
    )[0];
    const totalBudget = budgets.reduce((total, budget) => total + (budget.limitMinor ?? 0), 0);
    const overBudgetCount = categories.filter(
        (category) => category.budgetLimit > 0 && category.amount > category.budgetLimit,
    ).length;
    const summaryCards = [
        {
            id: "total",
            icon: ReportIcon,
            label: "Tổng chi",
            tone: "expense",
            value: totalExpense,
        },
        {
            id: "count",
            icon: TransactionListIcon,
            label: "Danh mục có chi",
            tone: "neutral",
            value: `${categories.length}`,
            valueType: "text",
        },
        {
            id: "top",
            icon: ChevronIcon,
            label: "Cao nhất",
            tone: "good",
            value: topCategory ? topCategory.name : "-",
            valueType: "text",
        },
        {
            id: "budget",
            icon: BudgetIcon,
            label: "Vượt ngân sách",
            tone: overBudgetCount ? "danger" : "neutral",
            value: totalBudget ? `${overBudgetCount}` : "-",
            valueType: "text",
        },
    ];

    return (
        <SummaryCardList
            ariaLabel="Tóm tắt chi tiêu theo danh mục"
            cardVariant="compact"
            className="category-spending-page__summary"
            items={summaryCards}
        />
    );
}

function CategoryChartOverview({ categories, onSelect, selectedCategoryId, totalExpense }) {
    const topCategories = categories.slice(0, categoryChartTopCategoryLimit);
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? topCategories[0];
    const hasVisibleSelection = topCategories.some((category) => category.id === selectedCategory?.id);
    const visibleCategories =
        selectedCategory && !hasVisibleSelection
            ? [...topCategories.slice(0, categoryChartPinnedCategoryLimit), selectedCategory]
            : topCategories;
    const hiddenCategoryCount = Math.max(
        categories.length - new Set(visibleCategories.map((category) => category.id)).size,
        0,
    );

    return (
        <div className="category-spending-page__chart-overview">
            <DonutChart categories={categories}>
                <span>{selectedCategory ? selectedCategory.name : "Tổng"}</span>
                <strong>
                    <AmountText amount={selectedCategory?.amount ?? totalExpense} />
                </strong>
                {selectedCategory ? <small>{selectedCategory.percentage}% tổng chi</small> : null}
            </DonutChart>

            <div className="category-spending-page__chart-breakdown">
                {visibleCategories.map((category) => (
                    <button
                        aria-pressed={category.id === selectedCategory?.id}
                        className={`category-spending-page__chart-category`}
                        key={category.id}
                        onClick={() => onSelect(category.id)}
                        type="button"
                    >
                        <span className="category-spending-page__chart-dot" style={{ "--dot-color": category.color }} />
                        <span className="category-spending-page__chart-category-copy">
                            <strong>{category.name}</strong>
                            <small>
                                <AmountText amount={category.amount} />
                            </small>
                        </span>
                        <span className="category-spending-page__chart-percentage">{category.percentage}%</span>
                    </button>
                ))}
                {hiddenCategoryCount ? (
                    <span className="category-spending-page__chart-more">+{hiddenCategoryCount} danh mục khác</span>
                ) : null}
            </div>
        </div>
    );
}

function CategoryDetailMetric({ label, value, tone = "neutral", valueFirst = false }) {
    return (
        <div className={`category-spending-page__detail-metric category-spending-page__detail-metric--${tone}`}>
            {valueFirst ? (
                <>
                    <strong>{value}</strong>
                    <span className="category-spending-page__detail-metric-label">{label}</span>
                </>
            ) : (
                <>
                    <span className="category-spending-page__detail-metric-label">{label}</span>
                    <strong>{value}</strong>
                </>
            )}
        </div>
    );
}

function CategoryTransactionItem({ transaction }) {
    const walletLabel = getTransactionWalletLabel(transaction);
    const { dateLabel, dateTime, timeLabel } = getTransactionDateParts(transaction);

    return (
        <article className="category-spending-page__transaction transactions-page__row" role="row">
            <div className="category-spending-page__transaction-main transactions-page__row-main" role="cell">
                <ExpenseEmoji icon={transaction.icon ?? transaction.category} label={transaction.title} />
                <div className="category-spending-page__transaction-copy transactions-page__row-copy">
                    <strong>{transaction.title}</strong>
                    <span>{transaction.note || "Không có ghi chú"}</span>
                </div>
            </div>
            <div
                className="category-spending-page__transaction-date-cell transactions-page__cell transactions-page__date-cell"
                role="cell"
            >
                <strong>
                    <time dateTime={dateTime}>
                        {timeLabel} - {dateLabel}
                    </time>
                </strong>
            </div>
            <div className="category-spending-page__transaction-mobile-meta transactions-page__mobile-meta" role="cell">
                <time className="transactions-page__mobile-date" dateTime={dateTime}>
                    <CalendarIcon size={18} />
                    <span>
                        {timeLabel} - {dateLabel}
                    </span>
                </time>
            </div>
            <div
                className="category-spending-page__transaction-wallet-cell transactions-page__cell transactions-page__wallet-cell"
                role="cell"
            >
                <strong>{walletLabel}</strong>
            </div>
            <div className="category-spending-page__transaction-amount transactions-page__amount" role="cell">
                <AmountText amount={transaction.amount} showSign />
            </div>
        </article>
    );
}

function CategoryDetailSelector({ categories = [], selectedCategoryId = "", onSelect, selectedMonth }) {
    if (!categories.length || !onSelect) {
        return null;
    }
    return (
        <label className="category-spending-page__detail-selector">
            <span>Danh mục đang xem {getMonthLabel(selectedMonth)}</span>
            <span className="category-spending-page__select category-spending-page__detail-select">
                <select onChange={(event) => onSelect(event.target.value)} value={selectedCategoryId}>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name} <ExpenseEmoji icon={category.icon} />
                        </option>
                    ))}
                </select>
            </span>
        </label>
    );
}

function CategoryDetailPanel({
    category,
    categories = [],
    className = "",
    detailError,
    hasNextPage,
    isLoading,
    onCategorySelect,
    onClose,
    onLoadMore,
    selectedMonth,
    titleId,
    transactions,
}) {
    const hasBudget = (category?.budgetLimit ?? 0) > 0;
    const budgetClassName = "category-spending-page__detail--hasBudget";
    const detailClassName = ["category-spending-page__detail", "section-card", budgetClassName, className]
        .filter(Boolean)
        .join(" ");

    if (!category) {
        return (
            <section className={detailClassName}>
                <p className="category-spending-page__empty">Chưa có danh mục chi tiêu trong tháng này.</p>
            </section>
        );
    }

    const latestTransaction = getLatestTransaction(transactions);
    const latestTransactionParts = latestTransaction ? getTransactionDateParts(latestTransaction) : null;
    const remainingBudget = hasBudget ? category.budgetLimit - category.amount : null;
    const budgetStatusLabel = getBudgetStatusLabel(category);

    return (
        <section className={detailClassName} aria-label={titleId ? undefined : `Chi tiết ${category.name}`}>
            <header className="category-spending-page__detail-header">
                <div>
                    <CategoryDetailSelector
                        categories={categories}
                        onSelect={onCategorySelect}
                        selectedCategoryId={category.id}
                        selectedMonth={selectedMonth}
                    />
                </div>
                <div className="category-spending-page__detail-actions">
                    <ExpenseEmoji
                        appearance="emoji"
                        color={category.color}
                        icon={category.icon}
                        label={category.name}
                    />
                    {onClose ? (
                        <button
                            aria-label="Đóng chi tiết"
                            className="category-spending-page__detail-close"
                            onClick={onClose}
                            type="button"
                        >
                            <XIcon size={18} />
                        </button>
                    ) : null}
                </div>
            </header>

            <section
                aria-label={`Tổng chi ${category.name}`}
                className="category-spending-page__detail-total"
                style={{ "--category-color": category.color }}
            >
                <div className="category-spending-page__detail-total-copy">
                    <span>Tổng chi</span>
                    <h3>{category.name}</h3>
                    <strong>
                        <AmountText amount={category.amount} />
                    </strong>
                    <small>{category.percentage}% tổng chi trong tháng</small>
                </div>

                <div className="category-spending-page__detail-budget">
                    <div className="category-spending-page__detail-budget-row">
                        <span>{hasBudget ? "Ngân sách" : "Trạng thái"}</span>
                        <span
                            className={`category-spending-page__detail-budget-badge category-spending-page__detail-budget-badge--${category.budgetTone}`}
                        >
                            {budgetStatusLabel}
                        </span>
                    </div>

                    {hasBudget ? (
                        <>
                            <ProgressBar color={category.color} max={category.budgetLimit} value={category.amount} />
                            <div className="category-spending-page__detail-budget-amounts">
                                <strong>{category.budgetPercentage}% ngân sách</strong>
                                <span>
                                    <AmountText amount={category.amount} /> /{" "}
                                    <AmountText amount={category.budgetLimit} />
                                </span>
                            </div>
                        </>
                    ) : (
                        <small>Chưa có hạn mức để theo dõi tiến độ.</small>
                    )}
                </div>
            </section>

            <section className="category-spending-page__detail-metrics" aria-label="Chỉ số danh mục">
                <CategoryDetailMetric
                    label="giao dịch"
                    value={`${transactions.length}${hasNextPage ? "+" : ""}`}
                    valueFirst
                />
                <CategoryDetailMetric
                    label="Gần nhất"
                    value={latestTransactionParts ? latestTransactionParts.dateLabel : "-"}
                />
                <CategoryDetailMetric
                    label="TB/ngày"
                    value={<AmountText amount={getAverageDailyAmount(category.amount, selectedMonth)} />}
                />
                <CategoryDetailMetric
                    label="Còn lại"
                    tone={remainingBudget !== null && remainingBudget < 0 ? "danger" : "neutral"}
                    value={remainingBudget === null ? "-" : <AmountText amount={remainingBudget} />}
                />
            </section>

            <section
                className="category-spending-page__transactions transactions-page__list section-card"
                aria-label="Danh sách giao dịch"
            >
                <div className="category-spending-page__transactions-head transactions-page__table-head" role="row">
                    <span>Giao dịch</span>
                    <span>Thời gian</span>
                    <span>Ví</span>
                    <span>Số tiền</span>
                </div>
                {isLoading && !transactions.length ? (
                    <p className="category-spending-page__empty transactions-page__empty">Đang tải giao dịch...</p>
                ) : detailError ? (
                    <p className="category-spending-page__empty transactions-page__empty">{detailError}</p>
                ) : transactions.length ? (
                    transactions.map((transaction) => (
                        <CategoryTransactionItem key={transaction.id} transaction={transaction} />
                    ))
                ) : (
                    <p className="category-spending-page__empty transactions-page__empty">
                        Không có giao dịch phù hợp.
                    </p>
                )}
            </section>

            {hasNextPage ? (
                <button
                    className="category-spending-page__load-more"
                    disabled={isLoading}
                    onClick={onLoadMore}
                    type="button"
                >
                    {isLoading ? "Đang tải..." : "Tải thêm"}
                </button>
            ) : null}
        </section>
    );
}

function CategorySpendingWorkspace({
    categories: controlledCategories,
    mode,
    monthOptions: controlledMonthOptions,
    onSelectedMonthChange,
    onSortKeyChange,
    selectedMonth: controlledSelectedMonth,
    sortKey: controlledSortKey,
}) {
    const uid = useAuthSessionStore(selectAuthUid);
    const storeCategories = useExpenseDataStore(selectExpenseCategories);
    const budgetLimitsByMonth = useExpenseDataStore(selectExpenseBudgetLimitsByMonth);
    const monthlyStatsByMonth = useExpenseDataStore(selectExpenseMonthlyStatsByMonth);
    const monthOptionsByYear = useExpenseDataStore(selectExpenseMonthOptionsByYear);
    const loadExpenseBudgets = useExpenseDataStore((state) => state.loadExpenseBudgets);
    const loadExpenseMonthlyStats = useExpenseDataStore((state) => state.loadExpenseMonthlyStats);
    const loadExpenseMonthOptions = useExpenseDataStore((state) => state.loadExpenseMonthOptions);
    const isDesktopMode = mode === "desktop";
    const currentMonthKey = getCurrentMonthKey();
    const currentYear = getCurrentYear();
    const monthOptionsCacheKey = getExpenseMonthOptionsCacheKey(uid, currentYear);
    const categories = controlledCategories ?? storeCategories;
    const isMonthOptionsControlled = Array.isArray(controlledMonthOptions);
    const isSelectedMonthControlled = controlledSelectedMonth !== undefined;
    const isSortKeyControlled = controlledSortKey !== undefined;
    const [internalSelectedMonth, setInternalSelectedMonth] = useState(currentMonthKey);
    const [internalSortKey, setInternalSortKey] = useState("amount");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [transactions, setTransactions] = useState([]);
    const [transactionCursor, setTransactionCursor] = useState(null);
    const [hasNextTransactionPage, setHasNextTransactionPage] = useState(false);
    const [isTransactionLoading, setIsTransactionLoading] = useState(false);
    const [transactionError, setTransactionError] = useState("");
    const selectedMonth = isSelectedMonthControlled ? controlledSelectedMonth : internalSelectedMonth;
    const monthlyStats = monthlyStatsByMonth[selectedMonth] ?? getEmptyMonthlyStats(selectedMonth);
    const budgets = useMemo(() => budgetLimitsByMonth[selectedMonth] ?? [], [budgetLimitsByMonth, selectedMonth]);
    const monthOptions = useMemo(
        () =>
            isMonthOptionsControlled
                ? controlledMonthOptions
                : (monthOptionsByYear[monthOptionsCacheKey] ?? [currentMonthKey]),
        [controlledMonthOptions, currentMonthKey, isMonthOptionsControlled, monthOptionsByYear, monthOptionsCacheKey],
    );
    const sortKey = isSortKeyControlled ? controlledSortKey : internalSortKey;
    const setSelectedMonth = useCallback(
        (nextMonth) => {
            if (!isSelectedMonthControlled) {
                setInternalSelectedMonth(nextMonth);
            }

            onSelectedMonthChange?.(nextMonth);
        },
        [isSelectedMonthControlled, onSelectedMonthChange],
    );
    const setSortKey = useCallback(
        (nextSortKey) => {
            if (!isSortKeyControlled) {
                setInternalSortKey(nextSortKey);
            }

            onSortKeyChange?.(nextSortKey);
        },
        [isSortKeyControlled, onSortKeyChange],
    );

    const categorySpending = useMemo(
        () =>
            getCategorySpendingByMonth({
                categories,
                monthKey: selectedMonth,
                monthlyStats,
            }),
        [categories, monthlyStats, selectedMonth],
    );
    const categoryRows = useMemo(
        () => getCategoryRows(categorySpending, budgets, sortKey),
        [budgets, categorySpending, sortKey],
    );
    const selectedCategory = categoryRows.find((category) => category.id === selectedCategoryId) ?? categoryRows[0];
    const displayedMonthOptions = useMemo(
        () => getVisibleMonthOptions([...monthOptions, selectedMonth], currentMonthKey),
        [currentMonthKey, monthOptions, selectedMonth],
    );

    useEffect(() => {
        loadExpenseMonthOptions(uid, currentYear, currentMonthKey);
    }, [currentMonthKey, currentYear, loadExpenseMonthOptions, uid]);

    useEffect(() => {
        let isCancelled = false;

        Promise.resolve().then(() => {
            if (!isCancelled) {
                setIsLoading(true);
                setLoadError("");
            }
        });

        if (!uid) {
            Promise.resolve().then(() => {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            });

            return () => {
                isCancelled = true;
            };
        }

        Promise.all([loadExpenseMonthlyStats(uid, selectedMonth), loadExpenseBudgets(uid, selectedMonth)])
            .catch(() => {
                if (!isCancelled) {
                    setLoadError("Không thể tải chi tiêu theo danh mục. Vui lòng thử lại.");
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [loadExpenseBudgets, loadExpenseMonthlyStats, selectedMonth, uid]);

    useEffect(() => {
        let isCancelled = false;
        const nextCategoryId = selectedCategory?.id;

        Promise.resolve().then(() => {
            if (!isCancelled) {
                setTransactions([]);
                setTransactionCursor(null);
                setHasNextTransactionPage(false);
                setIsTransactionLoading(false);
                setTransactionError("");
            }
        });

        if (!uid || !nextCategoryId) {
            return undefined;
        }

        Promise.resolve().then(() => {
            if (!isCancelled) {
                setIsTransactionLoading(true);
            }
        });

        import("../api/transactionsRepository")
            .then(({ getExpenseTransactionsPage }) =>
                getExpenseTransactionsPage(uid, {
                    categoryId: nextCategoryId,
                    monthKey: selectedMonth,
                    pageSize: categoryTransactionPageSize,
                    type: "expense",
                }),
            )
            .then((result) => {
                if (!isCancelled) {
                    setTransactions(result.transactions);
                    setTransactionCursor(result.cursor);
                    setHasNextTransactionPage(result.hasNextPage);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setTransactionError("Không thể tải giao dịch của danh mục này.");
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsTransactionLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [selectedCategory?.id, selectedMonth, uid]);

    const handleLoadMoreTransactions = async () => {
        if (!uid || !selectedCategory?.id || !transactionCursor || isTransactionLoading) {
            return;
        }

        setIsTransactionLoading(true);
        setTransactionError("");

        try {
            const { getExpenseTransactionsPage } = await import("../api/transactionsRepository");
            const result = await getExpenseTransactionsPage(uid, {
                categoryId: selectedCategory.id,
                cursor: transactionCursor,
                monthKey: selectedMonth,
                pageSize: categoryTransactionPageSize,
                type: "expense",
            });

            setTransactions((currentTransactions) =>
                [...currentTransactions, ...result.transactions].sort(
                    (firstTransaction, secondTransaction) =>
                        getTransactionSortTime(secondTransaction) - getTransactionSortTime(firstTransaction),
                ),
            );
            setTransactionCursor(result.cursor);
            setHasNextTransactionPage(result.hasNextPage);
        } catch {
            setTransactionError("Không thể tải thêm giao dịch.");
        } finally {
            setIsTransactionLoading(false);
        }
    };

    const handleSelectCategory = (categoryId) => {
        setSelectedCategoryId(categoryId);
    };

    return (
        <div className={`category-spending-page category-spending-page--${mode}`}>
            {!isDesktopMode ? (
                <section className="category-spending-page__hero">
                    <div className="category-spending-page__hero-copy">
                        <span>Chi tiêu</span>
                        <h1>Chi tiêu theo danh mục</h1>
                        <p>
                            {getMonthLabel(selectedMonth)} · {formatCurrency(monthlyStats.expenseMinor ?? 0)}
                        </p>
                    </div>
                    <div className="category-spending-page__controls">
                        <label className="category-spending-page__select">
                            <span className="sr-only">Chọn tháng</span>
                            <select
                                onChange={(event) => {
                                    setSelectedMonth(event.target.value);
                                    setSelectedCategoryId("");
                                }}
                                value={selectedMonth}
                            >
                                {displayedMonthOptions.map((monthKey) => (
                                    <option key={monthKey} value={monthKey}>
                                        {getMonthLabel(monthKey)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="category-spending-page__select">
                            <span className="sr-only">Sắp xếp danh mục</span>
                            <select onChange={(event) => setSortKey(event.target.value)} value={sortKey}>
                                <option value="amount">Số tiền cao nhất</option>
                                <option value="budget">Theo ngân sách</option>
                                <option value="name">Tên danh mục</option>
                            </select>
                        </label>
                    </div>
                </section>
            ) : null}

            <CategorySummaryCards categories={categoryRows} monthlyStats={monthlyStats} budgets={budgets} />

            {loadError ? <p className="category-spending-page__notice">{loadError}</p> : null}

            <section className="category-spending-page__workspace">
                <div className="category-spending-page__analysis">
                    <section className="category-spending-page__chart section-card">
                        <header>
                            <div>
                                <span>{getMonthLabel(selectedMonth)}</span>
                                <h2>Tỷ trọng chi tiêu</h2>
                            </div>
                            <strong>{categoryRows.length}</strong>
                        </header>
                        {isLoading ? (
                            <p className="category-spending-page__empty">Đang tải dữ liệu...</p>
                        ) : categoryRows.length ? (
                            <CategoryChartOverview
                                categories={categoryRows}
                                onSelect={handleSelectCategory}
                                selectedCategoryId={selectedCategory?.id}
                                totalExpense={monthlyStats.expenseMinor ?? 0}
                            />
                        ) : (
                            <p className="category-spending-page__empty">Tháng này chưa có chi tiêu.</p>
                        )}
                    </section>
                </div>

                <CategoryDetailPanel
                    category={selectedCategory}
                    categories={categoryRows}
                    detailError={transactionError}
                    hasNextPage={hasNextTransactionPage}
                    isLoading={isTransactionLoading}
                    onCategorySelect={handleSelectCategory}
                    onLoadMore={handleLoadMoreTransactions}
                    selectedMonth={selectedMonth}
                    transactions={transactions}
                />
            </section>
        </div>
    );
}

export default function CategorySpendingPage({
    categories,
    monthOptions,
    mode = "mobile",
    onSelectedMonthChange,
    onSortKeyChange,
    selectedMonth,
    sortKey,
}) {
    return (
        <CategorySpendingWorkspace
            categories={categories}
            monthOptions={monthOptions}
            mode={mode}
            onSelectedMonthChange={onSelectedMonthChange}
            onSortKeyChange={onSortKeyChange}
            selectedMonth={selectedMonth}
            sortKey={sortKey}
        />
    );
}
