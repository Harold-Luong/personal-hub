import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
import ExpenseIcon from "../components/shared/ExpenseIcon";
import ExpenseStateMessage from "../components/shared/ExpenseStateMessage";
import SummaryCardList from "../components/shared/SummaryCardList";
import {
    budgetExceededThresholdPercentage,
    budgetWarningThresholdPercentage,
    categoryChartPinnedCategoryLimit,
    categoryChartTopCategoryLimit,
    categoryTransactionPageSize,
    expenseRoutePaths,
    transactionTypes,
} from "../constants/expenseMetadata";
import { expenseSortKeys, expenseUiText } from "../constants/expenseUiMetadata";
import { BudgetIcon, CalendarIcon, ChevronIcon, ReportIcon, TransactionListIcon } from "../icon/ExpenseIcons";
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
            if (sortKey === expenseSortKeys.NAME) {
                return firstCategory.name.localeCompare(secondCategory.name, "vi");
            }

            if (sortKey === "budget") {
                return secondCategory.budgetPercentage - firstCategory.budgetPercentage;
            }

            return (secondCategory.amount ?? 0) - (firstCategory.amount ?? 0);
        });
}

function getCategoryDetailRows(categories, categorySpending, budgets, sortKey, monthKey) {
    const spendingByCategory = new Map(categorySpending.map((category) => [category.id, category]));

    return getCategoryRows(
        categories
            .filter((category) => category.type === "expense")
            .map((category) => {
                const spending = spendingByCategory.get(category.id);

                return {
                    ...category,
                    ...spending,
                    amount: spending?.amount ?? 0,
                    monthKey,
                    percentage: spending?.percentage ?? 0,
                };
            }),
        budgets,
        sortKey,
    );
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
                <ExpenseIcon icon={transaction.icon ?? transaction.category} label={transaction.title} />
                <div className="category-spending-page__transaction-copy transactions-page__row-copy">
                    <strong>{transaction.title}</strong>
                    <span>{transaction.note || expenseUiText.transaction.NO_NOTE}</span>
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

function CategoryExpandedDetails({
    category,
    detailError,
    detailId,
    hasNextPage,
    isLoading,
    onLoadMore,
    onViewTransactions,
    selectedMonth,
    transactions,
}) {
    const latestTransaction = getLatestTransaction(transactions);
    const latestTransactionParts = latestTransaction ? getTransactionDateParts(latestTransaction) : null;
    const remainingBudget = category.budgetLimit ? category.budgetLimit - category.amount : null;

    return (
        <div className="category-spending-page__category-expanded" id={detailId}>
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
                className="category-spending-page__transactions transactions-page__list"
                aria-label={`Giao dịch của ${category.name}`}
            >
                <div className="category-spending-page__transactions-head transactions-page__table-head" role="row">
                    <span>Giao dịch</span>
                    <span>Thời gian</span>
                    <span>Ví</span>
                    <span>Số tiền</span>
                </div>
                {isLoading && !transactions.length ? (
                    <ExpenseStateMessage
                        className="category-spending-page__empty transactions-page__empty"
                        message={expenseUiText.transaction.LOADING}
                    />
                ) : detailError ? (
                    <ExpenseStateMessage
                        className="category-spending-page__empty transactions-page__empty"
                        message={detailError}
                    />
                ) : transactions.length ? (
                    transactions.map((transaction) => (
                        <CategoryTransactionItem key={transaction.id} transaction={transaction} />
                    ))
                ) : (
                    <ExpenseStateMessage
                        className="category-spending-page__empty transactions-page__empty"
                        message={expenseUiText.transaction.NOT_FOUND}
                    />
                )}
            </section>
            <button
                className="category-spending-page__category-detail-link"
                onClick={() => onViewTransactions?.(category.id)}
                type="button"
            >
                <span>Xem thêm chi tiết</span>
            </button>
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
        </div>
    );
}

function CategoryTableRow({
    category,
    detailError,
    hasNextPage,
    isExpanded,
    isLoading,
    onExpand,
    onLoadMore,
    onViewTransactions,
    selectedMonth,
    transactions,
}) {
    const detailId = `category-spending-detail-${category.id}`;
    const hasBudget = (category.budgetLimit ?? 0) > 0;
    const budgetStatusLabel = getBudgetStatusLabel(category);
    const expandLabel = isExpanded ? `Đóng chi tiết ${category.name}` : `Mở chi tiết ${category.name}`;
    const rowClassName = [
        "category-spending-page__category-row-group",
        isExpanded ? "is-expanded" : "",
        hasBudget
            ? "category-spending-page__category-row-group--budgeted"
            : "category-spending-page__category-row-group--unbudgeted",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <article className={rowClassName} style={{ "--category-color": category.color }}>
            <div className="category-spending-page__category-row" role="row">
                <div className="category-spending-page__category-main" role="cell">
                    <ExpenseIcon
                        appearance="emoji"
                        color={category.color}
                        icon={category.icon}
                        label={category.name}
                    />
                    <div className="category-spending-page__category-copy">
                        <strong>{category.name}</strong>
                        <span>{category.percentage}% tổng chi trong tháng</span>
                    </div>
                </div>
                <div className="category-spending-page__category-amount" role="cell">
                    <AmountText amount={category.amount} />
                </div>
                <div className="category-spending-page__category-budget" role="cell">
                    {hasBudget ? (
                        <>
                            <strong>{category.budgetPercentage}% ngân sách</strong>
                            <span>
                                <AmountText amount={category.amount} /> / <AmountText amount={category.budgetLimit} />
                            </span>
                        </>
                    ) : (
                        <>
                            <strong>Chưa đặt</strong>
                            <span>Không có hạn mức</span>
                        </>
                    )}
                </div>
                <div className="category-spending-page__category-status" role="cell">
                    <span
                        className={`category-spending-page__detail-budget-badge category-spending-page__detail-budget-badge--${category.budgetTone}`}
                    >
                        {budgetStatusLabel}
                    </span>
                </div>
                <div className="category-spending-page__category-action" role="cell">
                    <button
                        aria-label={expandLabel}
                        aria-controls={detailId}
                        aria-expanded={isExpanded}
                        className="category-spending-page__category-expand-button"
                        onClick={() => onExpand(category.id)}
                        title={expandLabel}
                        type="button"
                    >
                        <ChevronIcon size={14} />
                    </button>
                </div>
            </div>

            {isExpanded ? (
                <CategoryExpandedDetails
                    category={category}
                    detailError={detailError}
                    detailId={detailId}
                    hasNextPage={hasNextPage}
                    isLoading={isLoading}
                    onLoadMore={onLoadMore}
                    onViewTransactions={onViewTransactions}
                    selectedMonth={selectedMonth}
                    transactions={transactions}
                />
            ) : null}
        </article>
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
    onLoadMore,
    onViewTransactions,
    selectedMonth,
    titleId,
    transactions,
}) {
    const detailClassName = [
        "category-spending-page__detail",
        "section-card",
        "category-spending-page__detail--table",
        className,
    ]
        .filter(Boolean)
        .join(" ");
    const resolvedTitleId = titleId ?? "category-spending-detail-title";

    if (!categories.length) {
        return (
            <section className={detailClassName}>
                <ExpenseStateMessage
                    className="category-spending-page__empty"
                    message="Chưa có danh mục chi tiêu."
                />
            </section>
        );
    }

    return (
        <section className={detailClassName} aria-labelledby={resolvedTitleId}>
            <header className="category-spending-page__detail-header">
                <div>
                    <span>{getMonthLabel(selectedMonth)}</span>
                    <h2 id={resolvedTitleId}>Danh sách danh mục</h2>
                </div>
                <strong>{categories.length}</strong>
            </header>

            <section className="category-spending-page__category-table" aria-label="Danh sách danh mục" role="table">
                <div className="category-spending-page__category-table-head" role="row">
                    <span>Danh mục</span>
                    <span>Tổng chi</span>
                    <span>Ngân sách</span>
                    <span>Trạng thái</span>
                    <span>Chi tiết</span>
                </div>
                {categories.map((categoryRow) => (
                    <CategoryTableRow
                        category={categoryRow}
                        detailError={detailError}
                        hasNextPage={hasNextPage}
                        isExpanded={categoryRow.id === category?.id}
                        isLoading={isLoading}
                        key={categoryRow.id}
                        onExpand={onCategorySelect}
                        onLoadMore={onLoadMore}
                        onViewTransactions={onViewTransactions}
                        selectedMonth={selectedMonth}
                        transactions={categoryRow.id === category?.id ? transactions : []}
                    />
                ))}
            </section>
        </section>
    );
}

export default function CategorySpendingPage({
    categories: controlledCategories,
    mode,
    monthOptions: controlledMonthOptions,
    onBack,
    onSelectedMonthChange,
    onSortKeyChange,
    selectedMonth: controlledSelectedMonth,
    sortKey: controlledSortKey,
}) {
    const navigate = useNavigate();
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
    const [internalSortKey, setInternalSortKey] = useState(expenseSortKeys.AMOUNT);
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
    const spendingCategoryRows = useMemo(
        () => getCategoryRows(categorySpending, budgets, sortKey),
        [budgets, categorySpending, sortKey],
    );
    const categoryRows = useMemo(
        () => getCategoryDetailRows(categories, categorySpending, budgets, sortKey, selectedMonth),
        [budgets, categories, categorySpending, selectedMonth, sortKey],
    );
    const selectedCategory = categoryRows.find((category) => category.id === selectedCategoryId) ?? null;
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
                    type: transactionTypes.EXPENSE,
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
                type: transactionTypes.EXPENSE,
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
        setSelectedCategoryId((currentCategoryId) => (currentCategoryId === categoryId ? "" : categoryId));
    };

    const handleViewCategoryTransactions = useCallback(
        (categoryId) => {
            if (!categoryId) {
                return;
            }

            const params = new URLSearchParams({
                categoryId,
                monthKey: selectedMonth,
            });

            navigate(`${expenseRoutePaths.transactions}?${params.toString()}`);
        },
        [navigate, selectedMonth],
    );

    return (
        <div className={`category-spending-page category-spending-page--${mode}`}>
            {!isDesktopMode ? (
                <button className="category-spending-page__back" onClick={onBack} type="button">
                    <ChevronIcon direction="left" size={15} />
                    <span>Cài đặt</span>
                </button>
            ) : null}
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
                                <option value={expenseSortKeys.AMOUNT}>Số tiền cao nhất</option>
                                <option value={expenseSortKeys.BUDGET}>Theo ngân sách</option>
                                <option value={expenseSortKeys.NAME}>Tên danh mục</option>
                            </select>
                        </label>
                    </div>
                </section>
            ) : null}

            <CategorySummaryCards categories={spendingCategoryRows} monthlyStats={monthlyStats} budgets={budgets} />

            {loadError ? <p className="category-spending-page__notice">{loadError}</p> : null}

            <section className="category-spending-page__workspace">
                <div className="category-spending-page__analysis">
                    <section className="category-spending-page__chart section-card">
                        <header>
                            <div>
                                <span>{getMonthLabel(selectedMonth)}</span>
                                <h2>Tỷ trọng chi tiêu</h2>
                            </div>
                            <strong>{spendingCategoryRows.length}</strong>
                        </header>
                        {isLoading ? (
                            <ExpenseStateMessage
                                className="category-spending-page__empty"
                                message={expenseUiText.status.LOADING_DATA}
                            />
                        ) : spendingCategoryRows.length ? (
                            <CategoryChartOverview
                                categories={spendingCategoryRows}
                                onSelect={handleSelectCategory}
                                selectedCategoryId={selectedCategory?.id}
                                totalExpense={monthlyStats.expenseMinor ?? 0}
                            />
                        ) : (
                            <ExpenseStateMessage
                                className="category-spending-page__empty"
                                message="Tháng này chưa có chi tiêu."
                            />
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
                    onViewTransactions={handleViewCategoryTransactions}
                    selectedMonth={selectedMonth}
                    transactions={transactions}
                />
            </section>
        </div>
    );
}
