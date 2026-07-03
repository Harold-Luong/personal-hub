import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ExpenseSidebar from "../components/layout/ExpenseSidebar";
import AmountText from "../components/shared/AmountText";
import DonutChart from "../components/shared/DonutChart";
import ExpenseEmoji from "../components/shared/ExpenseEmoji";
import ProgressBar from "../components/shared/ProgressBar";
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

const categoryTransactionPageSize = 15;

function getBudgetTone(amount, limit) {
    if (!limit) {
        return "neutral";
    }

    const percentage = Math.round((amount / limit) * 100);

    if (percentage >= 100) {
        return "danger";
    }

    if (percentage >= 80) {
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

function getTodayDateKey() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
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
            value: formatCurrency(totalExpense),
        },
        {
            id: "count",
            icon: TransactionListIcon,
            label: "Danh mục có chi",
            tone: "neutral",
            value: `${categories.length}`,
        },
        {
            id: "top",
            icon: ChevronIcon,
            label: "Cao nhất",
            tone: "good",
            value: topCategory ? topCategory.name : "-",
        },
        {
            id: "budget",
            icon: BudgetIcon,
            label: "Vượt ngân sách",
            tone: overBudgetCount ? "danger" : "neutral",
            value: totalBudget ? `${overBudgetCount}` : "-",
        },
    ];

    return (
        <section className="category-spending-page__summary" aria-label="Tóm tắt chi tiêu theo danh mục">
            {summaryCards.map(({ icon: Icon, id, label, tone, value }) => (
                <article
                    className={`category-spending-page__summary-card category-spending-page__summary-card--${tone}`}
                    key={id}
                >
                    <span className="category-spending-page__summary-icon" aria-hidden="true">
                        <Icon size={22} />
                    </span>
                    <span>{label}</span>
                    <strong>{value}</strong>
                </article>
            ))}
        </section>
    );
}

function CategoryChartOverview({ categories, onSelect, selectedCategoryId, totalExpense }) {
    const topCategories = categories.slice(0, 5);
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? topCategories[0];
    const hasVisibleSelection = topCategories.some((category) => category.id === selectedCategory?.id);
    const visibleCategories =
        selectedCategory && !hasVisibleSelection ? [...topCategories.slice(0, 3), selectedCategory] : topCategories;
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
                        className={`category-spending-page__chart-category${
                            category.id === selectedCategory?.id ? " is-selected" : ""
                        }`}
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

function CategoryRow({ category, isSelected, onSelect }) {
    const hasBudget = category.budgetLimit > 0;
    const budgetLabel = category.budgetLimit ? `${category.budgetPercentage}% ngân sách` : "Chưa đặt ngân sách";

    return (
        <button
            aria-pressed={isSelected}
            className={`category-spending-page__category-row${isSelected ? " is-selected" : ""}`}
            onClick={() => onSelect(category.id)}
            style={{ "--category-color": category.color }}
            type="button"
        >
            <ExpenseEmoji appearance="emoji" color={category.color} icon={category.icon} label={category.name} />
            <div className="category-spending-page__category-main">
                <div className="category-spending-page__category-heading">
                    <div className="category-spending-page__category-title">
                        <strong>{category.name}</strong>
                        <span
                            className={`category-spending-page__budget-chip category-spending-page__budget-chip--${category.budgetTone}`}
                        >
                            {budgetLabel}
                        </span>
                    </div>
                    <span>{category.percentage}% tổng chi tiêu</span>
                </div>

                <ProgressBar
                    color={category.color}
                    max={hasBudget ? category.budgetLimit : 100}
                    value={hasBudget ? category.amount : 0}
                />

                <div className="category-spending-page__category-footer">
                    <span className="category-spending-page__category-budget-amounts">
                        {hasBudget ? <AmountText amount={category.amount} /> : "Chưa có hạn mức"}
                    </span>
                    <strong className="category-spending-page__category-amount">
                        <AmountText amount={category.budgetLimit} />
                    </strong>
                </div>
            </div>
            <span className="category-spending-page__category-chevron" aria-hidden="true">
                <ChevronIcon size={20} />
            </span>
        </button>
    );
}

function CategoryDetailMetric({ icon: Icon, label, value, hint, tone = "green" }) {
    return (
        <article className={`category-spending-page__detail-metric category-spending-page__detail-metric--${tone}`}>
            <span className="category-spending-page__detail-metric-icon" aria-hidden="true">
                <Icon size={20} />
            </span>
            <span className="category-spending-page__detail-metric-label">{label}</span>
            <strong>{value}</strong>
            <small>{hint}</small>
        </article>
    );
}

function CategoryTransactionItem({ transaction }) {
    const walletLabel = getTransactionWalletLabel(transaction);
    const { dateLabel, dateTime, timeLabel } = getTransactionDateParts(transaction);

    return (
        <article className="category-spending-page__transaction">
            <div className="category-spending-page__transaction-main">
                <div>
                    <strong>{transaction.title}</strong>
                    <span>{transaction.note || ""}</span>
                </div>
            </div>
            <span className="category-spending-page__transaction-wallet">{walletLabel}</span>
            <time dateTime={dateTime}>
                <CalendarIcon size={16} />
                <span>
                    {timeLabel} - {dateLabel}
                </span>
            </time>
            <strong className="category-spending-page__transaction-amount">
                <AmountText amount={transaction.amount} showSign />
            </strong>
        </article>
    );
}

function CategoryDetailPanel({
    category,
    className = "",
    detailError,
    hasNextPage,
    isLoading,
    onClose,
    onLoadMore,
    onManageBudget,
    onViewTransactions,
    selectedMonth,
    titleId,
    transactions,
}) {
    const hasBudget = (category?.budgetLimit ?? 0) > 0;
    const budgetClassName = category ? `category-spending-page__detail--${hasBudget ? "budgeted" : "unbudgeted"}` : "";
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
    const latestTransactionHint = latestTransaction?.date === getTodayDateKey() ? "Hôm nay" : "Gần nhất";

    return (
        <section className={detailClassName} aria-label={titleId ? undefined : `Chi tiết ${category.name}`}>
            <header className="category-spending-page__detail-header">
                <div>
                    <span>Chi tiết danh mục</span>
                    <h2 id={titleId}>{category.name}</h2>
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

            <div className="category-spending-page__detail-total">
                <div className="category-spending-page__detail-total-copy">
                    <span>Tổng chi</span>
                    <strong>
                        <AmountText amount={category.amount} />
                    </strong>
                    <small>{category.percentage}% tổng chi trong tháng</small>
                </div>
                {hasBudget ? (
                    <div
                        className={`category-spending-page__detail-budget-badge category-spending-page__detail-budget-badge--${category.budgetTone}`}
                    >
                        <span>{budgetStatusLabel}</span>
                        <strong>{category.budgetPercentage}%</strong>
                    </div>
                ) : null}
            </div>


            <div className="category-spending-page__detail-metrics" aria-label="Chỉ số danh mục">
                <CategoryDetailMetric
                    icon={TransactionListIcon}
                    hint="Giao dịch"
                    label="Số giao dịch"
                    value={`${transactions.length}${hasNextPage ? "+" : ""}`}
                />
                <CategoryDetailMetric
                    icon={CalendarIcon}
                    hint={latestTransaction ? latestTransactionHint : "Chưa có"}
                    label="Giao dịch gần nhất"
                    tone="blue"
                    value={
                        latestTransactionParts
                            ? `${latestTransactionParts.timeLabel} - ${latestTransactionParts.dateLabel}`
                            : "-"
                    }
                />
                <CategoryDetailMetric
                    icon={ReportIcon}
                    hint="Trong tháng"
                    label="Chi trung bình/ngày"
                    tone="purple"
                    value={<AmountText amount={getAverageDailyAmount(category.amount, selectedMonth)} />}
                />
                <CategoryDetailMetric
                    icon={BudgetIcon}
                    hint={
                        remainingBudget === null
                            ? "Chưa có hạn mức"
                            : remainingBudget < 0
                              ? "Vượt ngân sách"
                              : "Có thể chi"
                    }
                    label="Còn lại"
                    tone={remainingBudget !== null && remainingBudget < 0 ? "danger" : "orange"}
                    value={remainingBudget === null ? "-" : <AmountText amount={remainingBudget} />}
                />
            </div>

            <div className="category-spending-page__detail-commands">
                {onManageBudget ? (
                    <button
                        className="category-spending-page__manage-budget"
                        onClick={() => onManageBudget(category.id)}
                        type="button"
                    >
                        <BudgetIcon size={18} />
                        <span>{hasBudget ? "Chỉnh ngân sách" : "Đặt hạn mức"}</span>
                    </button>
                ) : null}
                <button className="category-spending-page__view-transactions" onClick={onViewTransactions} type="button">
                    <TransactionListIcon size={18} />
                    <span>Xem chi tiết trong giao dịch</span>
                </button>
            </div>

            <div className="category-spending-page__transactions">
                <header className="category-spending-page__transactions-header">
                    <h3>Giao dịch</h3>
                    <span>
                        {transactions.length}
                        {hasNextPage ? "+" : ""}
                    </span>
                </header>
                <div className="category-spending-page__transaction-list">
                    {isLoading && !transactions.length ? (
                        <p className="category-spending-page__empty">Đang tải giao dịch...</p>
                    ) : detailError ? (
                        <p className="category-spending-page__empty">{detailError}</p>
                    ) : transactions.length ? (
                        transactions.map((transaction) => (
                            <CategoryTransactionItem key={transaction.id} transaction={transaction} />
                        ))
                    ) : (
                        <p className="category-spending-page__empty">Không có giao dịch phù hợp.</p>
                    )}
                </div>
            </div>

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

function CategorySpendingWorkspace({ categories, mode, onManageBudget, userId }) {
    const navigate = useNavigate();
    const isDesktopMode = mode === "desktop";
    const currentMonthKey = getCurrentMonthKey();
    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
    const [monthOptions, setMonthOptions] = useState(() => [currentMonthKey]);
    const [monthlyStats, setMonthlyStats] = useState(() => getEmptyMonthlyStats(currentMonthKey));
    const [budgets, setBudgets] = useState([]);
    const [sortKey, setSortKey] = useState("amount");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [transactions, setTransactions] = useState([]);
    const [transactionCursor, setTransactionCursor] = useState(null);
    const [hasNextTransactionPage, setHasNextTransactionPage] = useState(false);
    const [isTransactionLoading, setIsTransactionLoading] = useState(false);
    const [transactionError, setTransactionError] = useState("");

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
    const budgetFormBudgets = useMemo(() => {
        const rowsByCategoryId = new Map(categoryRows.map((category) => [category.id, category]));
        const categoriesById = new Map(categories.map((category) => [category.id, category]));

        return budgets
            .map((budget) => {
                const row = rowsByCategoryId.get(budget.categoryId);
                const category = categoriesById.get(budget.categoryId);

                return {
                    id: budget.id,
                    monthKey: budget.monthKey,
                    categoryId: budget.categoryId,
                    category: row?.name ?? category?.name ?? budget.categoryId,
                    amount: row?.amount ?? 0,
                    limit: budget.limitMinor,
                    alertThreshold: budget.alertThreshold,
                    color: row?.color ?? category?.color ?? "#b8bec8",
                    icon: row?.icon ?? category?.icon ?? "more",
                };
            })
            .filter((budget) => budget.limit > 0);
    }, [budgets, categories, categoryRows]);
    const selectedCategory =
        categoryRows.find((category) => category.id === selectedCategoryId) ?? (isDesktopMode ? categoryRows[0] : null);
    const displayedMonthOptions = useMemo(
        () => getVisibleMonthOptions([...monthOptions, selectedMonth], currentMonthKey),
        [currentMonthKey, monthOptions, selectedMonth],
    );

    useEffect(() => {
        let isCancelled = false;
        const currentYear = getCurrentYear();

        if (!userId) {
            Promise.resolve().then(() => {
                if (!isCancelled) {
                    setMonthOptions([currentMonthKey]);
                }
            });

            return () => {
                isCancelled = true;
            };
        }

        import("../api/monthlyStatsRepository")
            .then(({ getExpenseMonthlyStatsMonths }) => getExpenseMonthlyStatsMonths(userId, currentYear))
            .then((monthKeys) => {
                if (!isCancelled) {
                    setMonthOptions(getVisibleMonthOptions(monthKeys, currentMonthKey));
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setMonthOptions([currentMonthKey]);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [currentMonthKey, userId]);

    useEffect(() => {
        let isCancelled = false;

        Promise.resolve().then(() => {
            if (!isCancelled) {
                setIsLoading(true);
                setLoadError("");
            }
        });

        if (!userId) {
            Promise.resolve().then(() => {
                if (!isCancelled) {
                    setMonthlyStats(getEmptyMonthlyStats(selectedMonth));
                    setBudgets([]);
                    setIsLoading(false);
                }
            });

            return () => {
                isCancelled = true;
            };
        }

        Promise.all([import("../api/monthlyStatsRepository"), import("../api/budgetsRepository")])
            .then(([{ getExpenseMonthlyStats }, { getExpenseBudgets }]) =>
                Promise.all([getExpenseMonthlyStats(userId, selectedMonth), getExpenseBudgets(userId, selectedMonth)]),
            )
            .then(([nextMonthlyStats, nextBudgets]) => {
                if (!isCancelled) {
                    setMonthlyStats(nextMonthlyStats);
                    setBudgets(nextBudgets);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setMonthlyStats(getEmptyMonthlyStats(selectedMonth));
                    setBudgets([]);
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
    }, [selectedMonth, userId]);

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

        if (!userId || !nextCategoryId) {
            return undefined;
        }

        Promise.resolve().then(() => {
            if (!isCancelled) {
                setIsTransactionLoading(true);
            }
        });

        import("../api/transactionsRepository")
            .then(({ getExpenseTransactionsPage }) =>
                getExpenseTransactionsPage(userId, {
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
    }, [selectedCategory?.id, selectedMonth, userId]);

    const handleLoadMoreTransactions = async () => {
        if (!userId || !selectedCategory?.id || !transactionCursor || isTransactionLoading) {
            return;
        }

        setIsTransactionLoading(true);
        setTransactionError("");

        try {
            const { getExpenseTransactionsPage } = await import("../api/transactionsRepository");
            const result = await getExpenseTransactionsPage(userId, {
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

    const handleViewTransactions = () => {
        if (!selectedCategory?.id) {
            return;
        }

        const query = new URLSearchParams({
            categoryId: selectedCategory.id,
            monthKey: selectedMonth,
        });

        navigate(`/expenses/transactions?${query.toString()}`);
    };

    const applySavedBudget = (budget) => {
        if (budget?.monthKey !== selectedMonth) {
            return;
        }

        setBudgets((currentBudgets) => {
            const existingBudgetIndex = currentBudgets.findIndex(
                (currentBudget) =>
                    currentBudget.monthKey === budget.monthKey && currentBudget.categoryId === budget.categoryId,
            );

            if (existingBudgetIndex === -1) {
                return [...currentBudgets, budget];
            }

            return currentBudgets.map((currentBudget, index) =>
                index === existingBudgetIndex ? budget : currentBudget,
            );
        });
    };

    const applyDeletedBudget = (budget) => {
        if (budget?.monthKey !== selectedMonth) {
            return;
        }

        setBudgets((currentBudgets) =>
            currentBudgets.filter(
                (currentBudget) =>
                    currentBudget.monthKey !== budget.monthKey || currentBudget.categoryId !== budget.categoryId,
            ),
        );
    };

    const handleManageBudget = (categoryId) => {
        if (!categoryId) {
            return;
        }

        onManageBudget?.(categoryId, {
            budgets: budgetFormBudgets,
            monthKey: selectedMonth,
            onDeleteBudget: applyDeletedBudget,
            onSaveBudget: applySavedBudget,
        });

        if (!isDesktopMode) {
            setIsDetailSheetOpen(false);
        }
    };

    const handleSelectCategory = (categoryId) => {
        setSelectedCategoryId(categoryId);

        if (!isDesktopMode) {
            setIsDetailSheetOpen(true);
        }
    };

    const handleCloseDetailSheet = () => {
        setIsDetailSheetOpen(false);
    };

    const stopDetailSheetClose = (event) => {
        event.stopPropagation();
    };

    return (
        <div className={`category-spending-page category-spending-page--${mode}`}>
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
                                setIsDetailSheetOpen(false);
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

                    <section className="category-spending-page__categories section-card">
                        <header>
                            <div>
                                <span>Danh sách đầy đủ</span>
                                <h2>Danh mục</h2>
                            </div>
                            <strong>{categoryRows.length}</strong>
                        </header>
                        <div className="category-spending-page__category-list">
                            {isLoading ? (
                                <p className="category-spending-page__empty">Đang tải danh mục...</p>
                            ) : categoryRows.length ? (
                                categoryRows.map((category) => (
                                    <CategoryRow
                                        category={category}
                                        isSelected={category.id === selectedCategory?.id}
                                        key={category.id}
                                        onSelect={handleSelectCategory}
                                    />
                                ))
                            ) : (
                                <p className="category-spending-page__empty">
                                    Không có danh mục phát sinh trong tháng này.
                                </p>
                            )}
                        </div>
                    </section>
                </div>

                {isDesktopMode ? (
                    <CategoryDetailPanel
                        category={selectedCategory}
                        detailError={transactionError}
                        hasNextPage={hasNextTransactionPage}
                        isLoading={isTransactionLoading}
                        onLoadMore={handleLoadMoreTransactions}
                        onManageBudget={onManageBudget ? handleManageBudget : undefined}
                        onViewTransactions={handleViewTransactions}
                        selectedMonth={selectedMonth}
                        transactions={transactions}
                    />
                ) : null}
            </section>

            {!isDesktopMode && isDetailSheetOpen && selectedCategory ? (
                <section
                    aria-labelledby="category-spending-detail-title"
                    aria-modal="true"
                    className="category-spending-page__detail-sheet-backdrop"
                    onClick={handleCloseDetailSheet}
                    role="dialog"
                >
                    <div className="category-spending-page__detail-sheet-shell" onClick={stopDetailSheetClose}>
                        <CategoryDetailPanel
                            category={selectedCategory}
                            className="category-spending-page__detail--sheet"
                            detailError={transactionError}
                            hasNextPage={hasNextTransactionPage}
                            isLoading={isTransactionLoading}
                            onClose={handleCloseDetailSheet}
                            onLoadMore={handleLoadMoreTransactions}
                            onManageBudget={onManageBudget ? handleManageBudget : undefined}
                            onViewTransactions={handleViewTransactions}
                            selectedMonth={selectedMonth}
                            titleId="category-spending-detail-title"
                            transactions={transactions}
                        />
                    </div>
                </section>
            ) : null}
        </div>
    );
}

export default function CategorySpendingPage({
    categories = [],
    mode = "mobile",
    navItems = [],
    onManageBudget,
    onNavigate,
    user,
}) {
    if (mode === "desktop") {
        return (
            <div className="web-dashboard-view web-category-spending-view">
                <ExpenseSidebar activeId="categories" items={navItems} onNavigate={onNavigate} user={user} />
                <main className="web-dashboard-view__main web-category-spending-view__main">
                    <CategorySpendingWorkspace
                        categories={categories}
                        mode={mode}
                        onManageBudget={onManageBudget}
                        userId={user?.uid}
                    />
                </main>
            </div>
        );
    }

    return (
        <CategorySpendingWorkspace
            categories={categories}
            mode={mode}
            onManageBudget={onManageBudget}
            userId={user?.uid}
        />
    );
}
