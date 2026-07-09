import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { selectAuthUid, useAuthSessionStore } from "../../../stores/authSessionStore";
import {
    getExpenseMonthOptionsCacheKey,
    selectExpenseCategories,
    selectExpenseMonthOptionsByYear,
    selectExpenseWallets,
    useExpenseDataStore,
} from "../../../stores/expenseDataStore";
import {
    colorsFallback,
    creditPaymentTransactionTypeId,
    expenseTransactionFilters,
    transactionDefaultPageSize,
    transactionDefaultSort,
    transactionPageSizeOptions,
    transactionPaginationWindowSize,
    transactionSearchDebounceMs,
    transactionSummaryItems,
    transactionTypeMeta,
} from "../constant/expensesMetaData";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    CalendarIcon,
    ChevronIcon,
    EditIcon,
    FilterIcon,
    PlusIcon,
    SearchIcon,
    SwapIcon,
    TransactionListIcon,
    TrashIcon,
} from "../icon/ExpenseIcons";
import AmountText from "../components/shared/AmountText";
import ExpenseEmoji from "../components/shared/ExpenseEmoji";
import SummaryCardList from "../components/shared/SummaryCardList";
import WebAddTransactionPanel from "../components/web/WebAddTransactionPanel";
import { getTransactionWalletLabel } from "../utils/transactionDisplayUtils";
import { getWalletDisplayName } from "../utils/walletDisplayUtils";

const transactionSummaryIcons = {
    count: TransactionListIcon,
    expense: ArrowDownIcon,
    income: ArrowUpIcon,
    transfer: SwapIcon,
};

function getTransactionCategoryLabel(transaction) {
    if (transaction.type === "transfer") {
        return "Chuyển khoản";
    }

    if (transaction.type === "creditPayment") {
        return "Credit Payment";
    }

    if (transaction.type === "adjustment") {
        return "Điều chỉnh số dư";
    }

    return transaction.categoryName || transaction.category || "-";
}

function getMonthLabel(monthKey) {
    if (!monthKey || monthKey === "all") {
        return "Tất cả tháng";
    }
    const [year, month] = monthKey.split("-");
    return month && year ? `Tháng ${month}/${year}` : monthKey;
}

function getCurrentMonthKey() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    return `${today.getFullYear()}-${month}`;
}

function getCurrentYear() {
    return new Date().getFullYear();
}

function getMonthDayOptions(monthKey) {
    const resolvedMonthKey = monthKey && monthKey !== "all" ? monthKey : getCurrentMonthKey();
    const [year, month] = resolvedMonthKey.split("-").map(Number);

    if (!year || !month) {
        return [];
    }

    const lastDay = new Date(year, month, 0).getDate();

    return Array.from({ length: lastDay }, (_, index) => String(index + 1).padStart(2, "0"));
}

function getCategoryFilterOptions(categories, activeType) {
    if (activeType !== "all" && activeType !== "expense" && activeType !== "income") {
        return [];
    }

    return categories
        .filter((category) => {
            const categoryType = category.type ?? "expense";

            if (activeType === "expense" || activeType === "income") {
                return categoryType === activeType;
            }

            return categoryType === "expense" || categoryType === "income";
        })
        .sort((firstCategory, secondCategory) => {
            const orderDiff =
                (firstCategory.sortOrder ?? Number.MAX_SAFE_INTEGER) -
                (secondCategory.sortOrder ?? Number.MAX_SAFE_INTEGER);

            if (orderDiff) {
                return orderDiff;
            }

            return firstCategory.name.localeCompare(secondCategory.name, "vi");
        });
}

function addWalletFilterOption(optionsById, wallet, isArchived = false) {
    if (!wallet?.id) {
        return;
    }

    const currentOption = optionsById.get(wallet.id);

    optionsById.set(wallet.id, {
        id: wallet.id,
        isArchived: Boolean(wallet.isArchived ?? isArchived),
        name: getWalletDisplayName(wallet) || currentOption?.name || wallet.id,
        order: wallet.order ?? currentOption?.order ?? Number.MAX_SAFE_INTEGER,
    });
}

function addTransactionWalletFilterOption(optionsById, walletId, walletName) {
    if (!walletId || optionsById.has(walletId)) {
        return;
    }

    optionsById.set(walletId, {
        id: walletId,
        isArchived: true,
        name: walletName || walletId,
        order: Number.MAX_SAFE_INTEGER,
    });
}

function getWalletFilterOptions(activeWallets, historicalWallets, transactions) {
    const optionsById = new Map();

    activeWallets.forEach((wallet) => addWalletFilterOption(optionsById, wallet));
    historicalWallets.forEach((wallet) => addWalletFilterOption(optionsById, wallet, wallet.isArchived));
    transactions.forEach((transaction) => {
        addTransactionWalletFilterOption(optionsById, transaction.walletId, transaction.walletName);
        addTransactionWalletFilterOption(optionsById, transaction.fromWalletId, transaction.fromWalletName);
        addTransactionWalletFilterOption(optionsById, transaction.toWalletId, transaction.toWalletName);
    });

    return [...optionsById.values()].sort((firstWallet, secondWallet) => {
        if (firstWallet.isArchived !== secondWallet.isArchived) {
            return firstWallet.isArchived ? 1 : -1;
        }

        const orderDiff = firstWallet.order - secondWallet.order;

        if (orderDiff) {
            return orderDiff;
        }

        return firstWallet.name.localeCompare(secondWallet.name, "vi");
    });
}

function getTransactionDateParts(transaction) {
    const [day, month] = transaction.date?.split("-").reverse() || [];
    const dateLabel = day && month ? `${day}/${month}` : transaction.date || "-";

    return {
        dateLabel: dateLabel,
        dateTime: `${transaction.date ?? ""}T${transaction.time ?? ""}`,
        timeLabel: transaction.time || "--:--",
    };
}

function getTransactionSortTime(transaction) {
    const timestamp = new Date(`${transaction.date ?? ""}T${transaction.time || "00:00"}`).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getTransactionSortAmount(transaction) {
    return Number(transaction.amount ?? 0);
}

function getDotColor(color) {
    if (color) {
        return color;
    }
    return colorsFallback[Math.floor(Math.random() * colorsFallback.length)];
}

function TransactionSummary({ transactions }) {
    const summary = transactions.reduce(
        (totals, transaction) => {
            if (transaction.type === "income") {
                totals.income += transaction.amountMinor ?? Math.abs(transaction.amount ?? 0);
            } else if (transaction.type === "transfer") {
                totals.transfer += transaction.amountMinor ?? Math.abs(transaction.amount ?? 0);
            } else if (transaction.type === "expense") {
                totals.expense += transaction.amountMinor ?? Math.abs(transaction.amount ?? 0);
            }

            totals.count += 1;
            return totals;
        },
        { count: 0, expense: 0, income: 0, transfer: 0 },
    );

    const summaryItems = transactionSummaryItems.map(({ id, label, tone, valueKey }) => ({
        icon: transactionSummaryIcons[id],
        id,
        label,
        tone,
        value: summary[valueKey],
        valueType: valueKey === "count" ? "text" : "currency",
    }));

    return (
        <SummaryCardList
            ariaLabel="Tóm tắt giao dịch"
            cardVariant="compact"
            className="transactions-page__summary"
            items={summaryItems}
        />
    );
}

function TransactionRow({ onDelete, onEdit, transaction }) {
    const { label: typeLabel, tone: typeTone } = transactionTypeMeta[transaction.type] ?? transactionTypeMeta.default;
    const walletLabel = getTransactionWalletLabel(transaction);
    const categoryLabel = getTransactionCategoryLabel(transaction);
    const { dateLabel, dateTime, timeLabel } = getTransactionDateParts(transaction);
    const canEdit = transaction.type !== "adjustment" && transaction.type !== creditPaymentTransactionTypeId;

    return (
        <article className="transactions-page__row" role="row">
            <div className="transactions-page__row-main" role="cell">
                <ExpenseEmoji icon={transaction.icon ?? transaction.category} label={transaction.title} />
                <div className="transactions-page__row-copy">
                    <strong>{transaction.title}</strong>
                    <span>{transaction.note || "Không có ghi chú"}</span>
                </div>
            </div>
            <div className="transactions-page__cell" role="cell">
                <span className={`transactions-page__type-badge transactions-page__type-badge--${typeTone}`}>
                    {typeLabel}
                </span>
            </div>
            <div className="transactions-page__cell transactions-page__category-cell" role="cell">
                <span
                    className="transactions-page__category-dot"
                    style={{ "--dot-color": getDotColor(transaction.categoryColor) }}
                />
                <strong>{categoryLabel}</strong>
            </div>
            <div className="transactions-page__cell transactions-page__wallet-cell" role="cell">
                <span
                    className="transactions-page__wallet-dot"
                    style={{ "--dot-color": getDotColor(transaction.walletColor) }}
                />
                <strong style={{ color: getDotColor(transaction.walletColor) }}>{walletLabel}</strong>
            </div>
            <div className="transactions-page__cell transactions-page__date-cell" role="cell">
                <strong>
                    <time dateTime={dateTime}>
                        {timeLabel} - {dateLabel}
                    </time>
                </strong>
            </div>
            <div className="transactions-page__mobile-meta" role="cell">
                <span className="transactions-page__mobile-chip transactions-page__mobile-chip--wallet">
                    <strong>{walletLabel}</strong>
                </span>
                <time className="transactions-page__mobile-date" dateTime={dateTime}>
                    <CalendarIcon size={18} />
                    <span>
                        {timeLabel} - {dateLabel}
                    </span>
                </time>
            </div>
            <div className="transactions-page__amount" role="cell">
                <AmountText amount={transaction.amount} showSign />
            </div>
            <div className="transactions-page__actions" role="cell">
                {canEdit ? (
                    <button aria-label={`Sửa ${transaction.title}`} onClick={() => onEdit(transaction)} type="button">
                        <EditIcon size={16} />
                    </button>
                ) : null}
                <button
                    aria-label={`Xóa ${transaction.title}`}
                    className="is-danger"
                    onClick={() => onDelete(transaction)}
                    type="button"
                >
                    <TrashIcon size={16} />
                </button>
            </div>
        </article>
    );
}

function TransactionsWorkspace({
    categories: controlledCategories,
    initialCategoryId = "all",
    initialMonthKey = "",
    mode,
    onAddTransaction,
    onDeleteTransaction,
    onUpdateTransaction,
    wallets: controlledWallets,
}) {
    const uid = useAuthSessionStore(selectAuthUid);
    const storeCategories = useExpenseDataStore(selectExpenseCategories);
    const storeWallets = useExpenseDataStore(selectExpenseWallets);
    const monthOptionsByYear = useExpenseDataStore(selectExpenseMonthOptionsByYear);
    const loadExpenseMonthOptions = useExpenseDataStore((state) => state.loadExpenseMonthOptions);
    const createExpenseTransactionAction = useExpenseDataStore((state) => state.createExpenseTransaction);
    const updateExpenseTransactionAction = useExpenseDataStore((state) => state.updateExpenseTransaction);
    const voidExpenseTransactionAction = useExpenseDataStore((state) => state.voidExpenseTransaction);
    const isDesktopMode = mode === "desktop";
    const categories = controlledCategories ?? storeCategories;
    const wallets = controlledWallets ?? storeWallets;
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [querySearchTerm, setQuerySearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState(() => initialCategoryId || "all");
    const [walletFilter, setWalletFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState(() => initialMonthKey || getCurrentMonthKey());
    const [dayFilter, setDayFilter] = useState("");
    const [transactionSort, setTransactionSort] = useState(transactionDefaultSort);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(transactionDefaultPageSize);
    const [pageTransactions, setPageTransactions] = useState([]);
    const [pageCursors, setPageCursors] = useState([null]);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [refreshRevision, setRefreshRevision] = useState(0);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [historicalWallets, setHistoricalWallets] = useState([]);
    const currentMonthKey = getCurrentMonthKey();
    const currentYear = getCurrentYear();
    const monthOptionsCacheKey = getExpenseMonthOptionsCacheKey(uid, currentYear);
    const monthOptions = useMemo(
        () => monthOptionsByYear[monthOptionsCacheKey] ?? [currentMonthKey],
        [currentMonthKey, monthOptionsByYear, monthOptionsCacheKey],
    );

    const queryCursor = pageCursors[currentPage - 1] ?? null;
    const visibleTransactions = useMemo(
        () =>
            [...pageTransactions].sort((firstTransaction, secondTransaction) => {
                const sortValue =
                    transactionSort.key === "amount"
                        ? getTransactionSortAmount(firstTransaction) - getTransactionSortAmount(secondTransaction)
                        : getTransactionSortTime(firstTransaction) - getTransactionSortTime(secondTransaction);

                return transactionSort.direction === "asc" ? sortValue : -sortValue;
            }),
        [pageTransactions, transactionSort.direction, transactionSort.key],
    );
    const walletFilterOptions = useMemo(
        () => getWalletFilterOptions(wallets, uid ? historicalWallets : [], visibleTransactions),
        [historicalWallets, uid, visibleTransactions, wallets],
    );
    const categoryFilterOptions = useMemo(
        () => getCategoryFilterOptions(categories, activeFilter),
        [activeFilter, categories],
    );
    const pageStart = visibleTransactions.length ? (currentPage - 1) * pageSize + 1 : 0;
    const pageEnd = visibleTransactions.length ? pageStart + visibleTransactions.length - 1 : 0;
    const knownPageCount = currentPage + (hasNextPage ? 1 : 0);
    const pageWindowSize = Math.min(knownPageCount, transactionPaginationWindowSize);
    const firstVisiblePage = Math.min(Math.max(1, currentPage - 1), Math.max(1, knownPageCount - pageWindowSize + 1));
    const pageNumbers = Array.from({ length: pageWindowSize }, (_, index) => firstVisiblePage + index);
    const dayFilterMonthKey = monthFilter && monthFilter !== "all" ? monthFilter : getCurrentMonthKey();
    const dayFilterOptions = getMonthDayOptions(dayFilterMonthKey);
    const dateFilter = dayFilter ? `${dayFilterMonthKey}-${dayFilter}` : "";
    const activeFilterCount = [
        activeFilter !== "all",
        categoryFilter !== "all",
        walletFilter !== "all",
        monthFilter !== getCurrentMonthKey(),
        Boolean(dayFilter),
    ].filter(Boolean).length;

    const resetPaging = () => {
        setCurrentPage(1);
        setPageCursors([null]);
    };

    const refreshCurrentPage = () => {
        resetPaging();
        setRefreshRevision((revision) => revision + 1);
    };

    const toggleTransactionSort = (key) => {
        setTransactionSort((currentSort) => {
            if (currentSort.key !== key) {
                return { key, direction: "desc" };
            }

            return {
                key,
                direction: currentSort.direction === "desc" ? "asc" : "desc",
            };
        });
    };

    const getSortButtonLabel = (key, label) => {
        const nextDirection =
            transactionSort.key === key && transactionSort.direction === "desc" ? "tăng dần" : "giảm dần";

        return `Sắp xếp ${label} ${nextDirection}`;
    };

    const getSortIndicator = (key) => {
        if (transactionSort.key !== key) {
            return "↕";
        }

        return transactionSort.direction === "desc" ? "↓" : "↑";
    };

    useEffect(() => {
        if (searchTerm === querySearchTerm) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            resetPaging();
            setQuerySearchTerm(searchTerm);
        }, transactionSearchDebounceMs);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [querySearchTerm, searchTerm]);

    useEffect(() => {
        let isCancelled = false;

        if (!uid) {
            return undefined;
        }

        import("../api/walletsRepository")
            .then(({ getExpenseWallets }) => getExpenseWallets(uid, { includeArchived: true }))
            .then((nextWallets) => {
                if (!isCancelled) {
                    setHistoricalWallets(nextWallets);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setHistoricalWallets([]);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [uid, wallets]);

    useEffect(() => {
        loadExpenseMonthOptions(uid, currentYear, currentMonthKey);
    }, [currentMonthKey, currentYear, loadExpenseMonthOptions, refreshRevision, uid]);

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
                    setPageTransactions([]);
                    setHasNextPage(false);
                    setPageCursors([null]);
                    setIsLoading(false);
                }
            });

            return () => {
                isCancelled = true;
            };
        }

        import("../api/transactionsRepository")
            .then(({ getExpenseTransactionsPage }) =>
                getExpenseTransactionsPage(uid, {
                    categoryId: categoryFilter,
                    cursor: queryCursor,
                    date: dateFilter,
                    monthKey: monthFilter,
                    pageSize,
                    searchTerm: querySearchTerm,
                    type: activeFilter,
                    walletId: walletFilter,
                }),
            )
            .then((result) => {
                if (isCancelled) {
                    return;
                }
                setPageTransactions(result.transactions);
                setHasNextPage(result.hasNextPage);
                setPageCursors((currentCursors) => {
                    const nextCursors = currentCursors.slice(0, currentPage);

                    if (result.hasNextPage && result.cursor) {
                        nextCursors[currentPage] = result.cursor;
                    }

                    return nextCursors;
                });
            })
            .catch(() => {
                if (!isCancelled) {
                    setPageTransactions([]);
                    setHasNextPage(false);
                    setLoadError("Không thể tải giao dịch. Vui lòng thử lại.");
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
    }, [
        activeFilter,
        categoryFilter,
        currentPage,
        dateFilter,
        monthFilter,
        pageSize,
        queryCursor,
        querySearchTerm,
        refreshRevision,
        uid,
        walletFilter,
    ]);

    const openCreateEditor = () => {
        setEditingTransaction(null);
        setIsEditorOpen(true);
    };

    const openEditEditor = (transaction) => {
        setEditingTransaction(transaction);
        setIsEditorOpen(true);
    };

    const closeEditor = () => {
        setIsEditorOpen(false);
        setEditingTransaction(null);
    };

    const handleSubmit = async (transactionInput) => {
        if (editingTransaction) {
            if (onUpdateTransaction) {
                await onUpdateTransaction(editingTransaction.id, transactionInput);
            } else {
                await updateExpenseTransactionAction(uid, editingTransaction.id, transactionInput);
            }
        } else {
            if (onAddTransaction) {
                await onAddTransaction(transactionInput);
            } else {
                await createExpenseTransactionAction(uid, transactionInput);
            }
        }

        refreshCurrentPage();
        closeEditor();
    };

    const handleConfirmDelete = async () => {
        if (!transactionToDelete) {
            return;
        }

        setIsDeleting(true);
        setDeleteError("");

        try {
            if (onDeleteTransaction) {
                await onDeleteTransaction(transactionToDelete.id);
            } else {
                await voidExpenseTransactionAction(uid, transactionToDelete.id);
            }
            setTransactionToDelete(null);
            refreshCurrentPage();
        } catch {
            setDeleteError("Không thể xóa giao dịch. Vui lòng kiểm tra kết nối và thử lại.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={`transactions-page transactions-page--${mode}`}>
            {!isDesktopMode ? (
                <section className="transactions-page__hero">
                    <div className="transactions-page__hero-copy">
                        <h1>Giao dịch</h1>
                        <p>Quản lý tất cả giao dịch thu chi của bạn</p>
                    </div>
                    <button className="transactions-page__add-button" onClick={openCreateEditor} type="button">
                        <PlusIcon size={18} />
                        <span>Thêm giao dịch</span>
                    </button>
                </section>
            ) : null}

            <TransactionSummary transactions={visibleTransactions} />

            <section
                className={`transactions-page__toolbar section-card${isFilterPanelOpen ? " is-filter-open" : ""}`}
                aria-label="Bộ lọc giao dịch"
            >
                <label className="transactions-page__search">
                    <SearchIcon size={18} />
                    <span className="sr-only">Tìm kiếm giao dịch</span>
                    <input
                        onChange={(event) => {
                            setSearchTerm(event.target.value);
                        }}
                        placeholder="Tìm kiếm giao dịch..."
                        type="search"
                        value={searchTerm}
                    />
                </label>
                <button
                    aria-expanded={isFilterPanelOpen}
                    className={
                        activeFilterCount
                            ? "transactions-page__filter-button is-active"
                            : "transactions-page__filter-button"
                    }
                    onClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)}
                    type="button"
                >
                    <FilterIcon size={18} />
                    <span>Bộ lọc</span>
                    {activeFilterCount ? <strong>{activeFilterCount}</strong> : null}
                </button>
                <div className="transactions-page__filters-panel">
                    <label className="transactions-page__select">
                        <span className="sr-only">Lọc theo loại</span>
                        <select
                            onChange={(event) => {
                                const nextFilter = event.target.value;

                                resetPaging();
                                setActiveFilter(nextFilter);
                                setCategoryFilter((currentCategoryFilter) =>
                                    getCategoryFilterOptions(categories, nextFilter).some(
                                        (category) => category.id === currentCategoryFilter,
                                    )
                                        ? currentCategoryFilter
                                        : "all",
                                );
                            }}
                            value={activeFilter}
                        >
                            {expenseTransactionFilters.map((filter) => (
                                <option key={filter.id} value={filter.id}>
                                    {filter.id === "all" ? "Tất cả loại" : filter.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="transactions-page__select">
                        <span className="sr-only">L&#7885;c theo danh m&#7909;c</span>
                        <select
                            onChange={(event) => {
                                resetPaging();
                                setCategoryFilter(event.target.value);
                            }}
                            value={categoryFilter}
                        >
                            <option value="all">T&#7845;t c&#7843; danh m&#7909;c</option>
                            {categoryFilterOptions.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="transactions-page__select">
                        <span className="sr-only">Lọc theo ví</span>
                        <select
                            onChange={(event) => {
                                resetPaging();
                                setWalletFilter(event.target.value);
                            }}
                            value={walletFilter}
                        >
                            <option value="all">Tất cả ví</option>
                            {walletFilterOptions.map((wallet) => (
                                <option key={wallet.id} value={wallet.id}>
                                    {wallet.name}
                                    {wallet.isArchived ? " (đã xóa)" : ""}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="transactions-page__select transactions-page__select--month">
                        <span className="sr-only">Lọc theo tháng</span>
                        <select
                            onChange={(event) => {
                                resetPaging();
                                setMonthFilter(event.target.value);
                                setDayFilter("");
                            }}
                            value={monthFilter}
                        >
                            {monthOptions.map((monthKey) => (
                                <option key={monthKey} value={monthKey}>
                                    {getMonthLabel(monthKey)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="transactions-page__select transactions-page__select--day">
                        <span className="sr-only">Lọc theo ngày</span>
                        <select
                            onChange={(event) => {
                                resetPaging();
                                setDayFilter(event.target.value);
                            }}
                            value={dayFilter}
                        >
                            <option value="">Tất cả ngày</option>
                            {dayFilterOptions.map((day) => (
                                <option key={day} value={day}>
                                    Ngày {day}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>

            <section className="transactions-page__list section-card" aria-label="Danh sách giao dịch">
                <div className="transactions-page__table-head" role="row">
                    <span>Giao dịch</span>
                    <span>Loại</span>
                    <span>Danh mục</span>
                    <span>Ví</span>
                    <button
                        aria-label={getSortButtonLabel("date", "ngày")}
                        aria-pressed={transactionSort.key === "date"}
                        className={`transactions-page__sort-button${transactionSort.key === "date" ? " is-active" : ""}`}
                        onClick={() => toggleTransactionSort("date")}
                        type="button"
                    >
                        <span>Ngày</span>
                        <span aria-hidden="true">{getSortIndicator("date")}</span>
                    </button>
                    <button
                        aria-label={getSortButtonLabel("amount", "số tiền")}
                        aria-pressed={transactionSort.key === "amount"}
                        className={`transactions-page__sort-button transactions-page__sort-button--amount${
                            transactionSort.key === "amount" ? " is-active" : ""
                        }`}
                        onClick={() => toggleTransactionSort("amount")}
                        type="button"
                    >
                        <span>Số tiền</span>
                        <span aria-hidden="true">{getSortIndicator("amount")}</span>
                    </button>
                    <span>Thao tác</span>
                </div>
                {isLoading ? (
                    <p className="transactions-page__empty">Đang tải giao dịch...</p>
                ) : loadError ? (
                    <p className="transactions-page__empty">{loadError}</p>
                ) : visibleTransactions.length ? (
                    visibleTransactions.map((transaction) => (
                        <TransactionRow
                            key={transaction.id}
                            onDelete={setTransactionToDelete}
                            onEdit={openEditEditor}
                            transaction={transaction}
                        />
                    ))
                ) : (
                    <p className="transactions-page__empty">Không tìm thấy giao dịch phù hợp.</p>
                )}
                <footer className="transactions-page__pagination">
                    <span>
                        Hiển thị {pageStart} - {pageEnd}
                        {hasNextPage ? "+" : ""} giao dịch
                    </span>
                    <div className="transactions-page__page-actions">
                        <button
                            aria-label="Trang trước"
                            disabled={isLoading || currentPage === 1}
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            type="button"
                        >
                            <ChevronIcon direction="left" size={15} />
                        </button>
                        {pageNumbers.map((pageNumber) => (
                            <button
                                aria-current={currentPage === pageNumber ? "page" : undefined}
                                className={currentPage === pageNumber ? "is-active" : ""}
                                disabled={isLoading || (pageNumber !== 1 && !pageCursors[pageNumber - 1])}
                                key={pageNumber}
                                onClick={() => setCurrentPage(pageNumber)}
                                type="button"
                            >
                                {pageNumber}
                            </button>
                        ))}
                        <button
                            aria-label="Trang sau"
                            disabled={isLoading || !hasNextPage || !pageCursors[currentPage]}
                            onClick={() => setCurrentPage((page) => page + 1)}
                            type="button"
                        >
                            <ChevronIcon size={15} />
                        </button>
                    </div>
                    <label className="transactions-page__page-size">
                        <span className="sr-only">Số giao dịch mỗi trang</span>
                        <select
                            onChange={(event) => {
                                resetPaging();
                                setPageSize(Number(event.target.value));
                            }}
                            value={pageSize}
                        >
                            {transactionPageSizeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option} / trang
                                </option>
                            ))}
                        </select>
                    </label>
                </footer>
            </section>

            {isEditorOpen ? (
                <WebAddTransactionPanel
                    categories={categories}
                    initialTransaction={editingTransaction}
                    onCancel={closeEditor}
                    onSubmit={handleSubmit}
                    submitLabel={editingTransaction ? "Cập nhật giao dịch" : "Lưu giao dịch"}
                    title={editingTransaction ? "Sửa giao dịch" : "Thêm giao dịch"}
                    wallets={wallets}
                />
            ) : null}

            {transactionToDelete ? (
                <section className="transactions-page__confirm-backdrop" aria-modal="true" role="dialog">
                    <div className="transactions-page__confirm section-card">
                        <h2>Xóa giao dịch?</h2>
                        <p>
                            Giao dịch "{transactionToDelete.title}" sẽ được ẩn khỏi danh sách và số dư liên quan sẽ được
                            hoàn lại.
                        </p>
                        {deleteError ? <span>{deleteError}</span> : null}
                        <div>
                            <button onClick={() => setTransactionToDelete(null)} type="button">
                                Hủy
                            </button>
                            <button
                                className="is-danger"
                                disabled={isDeleting}
                                onClick={handleConfirmDelete}
                                type="button"
                            >
                                {isDeleting ? "Đang xóa..." : "Xóa giao dịch"}
                            </button>
                        </div>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

export default function TransactionsPage({
    categories,
    mode = "mobile",
    onAddTransaction,
    onDeleteTransaction,
    onUpdateTransaction,
    wallets,
}) {
    const [searchParams] = useSearchParams();
    const initialCategoryId = searchParams.get("categoryId") ?? "all";
    const initialMonthKey = searchParams.get("monthKey") ?? "";

    return (
        <TransactionsWorkspace
            categories={categories}
            initialCategoryId={initialCategoryId}
            initialMonthKey={initialMonthKey}
            mode={mode}
            onAddTransaction={onAddTransaction}
            onDeleteTransaction={onDeleteTransaction}
            onUpdateTransaction={onUpdateTransaction}
            wallets={wallets}
        />
    );
}
