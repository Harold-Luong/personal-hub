import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Line,
    LineChart,
    ResponsiveContainer,
    Rectangle,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { selectAuthUid, useAuthSessionStore } from "../../../stores/authSessionStore";
import {
    selectExpenseBudgetLimitsByMonth,
    getExpenseMonthOptionsCacheKey,
    selectExpenseCategories,
    selectExpenseMonthOptionsByYear,
    selectExpenseMonthlyStatsByMonth,
    selectExpenseWallets,
    useExpenseDataStore,
} from "../../../stores/expenseDataStore";
import MobilePageHeader from "../components/mobile/MobilePageHeader";
import AmountText from "../components/shared/AmountText";
import ExpenseButton from "../components/shared/ExpenseButton";
import ExpenseStateMessage from "../components/shared/ExpenseStateMessage";
import ProgressBar from "../components/shared/ProgressBar";
import SummaryCardList from "../components/shared/SummaryCardList";
import {
    expenseDefaultLocale,
    reportCategoryComparisonLimit,
    reportChartSeries,
    reportComparisonMonthCount,
    reportTopTransactionLimit,
    reportTrendMonthCount,
    transactionTypes,
} from "../constant/expensesMetaData";
import { expenseReportTrendViews, expenseUiText } from "../constant/expensesUiMetaData";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    BudgetIcon,
    ReportIcon,
    TransactionListIcon,
} from "../icon/ExpenseIcons";
import { getCategorySpendingByMonth } from "../utils/categorySpendingUtils";
import { formatCurrency } from "../utils/formatCurrency";
import { calculateTrend, getEmptyMonthlyStats, getPreviousMonthKey } from "../utils/monthlyStatsUtils";
import { getCompactMonthLabel, getCurrentMonthKey, getCurrentYear, getMonthLabel } from "../utils/monthUtils";

function getTrailingMonthKeys(monthKey, count = reportTrendMonthCount) {
    const [year, month] = String(monthKey ?? "")
        .split("-")
        .map(Number);

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
        return [getCurrentMonthKey()];
    }

    return Array.from({ length: count }, (_, index) => {
        const date = new Date(year, month - count + index, 1);
        const nextMonth = String(date.getMonth() + 1).padStart(2, "0");

        return `${date.getFullYear()}-${nextMonth}`;
    });
}

function getPercent(value, total) {
    return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
}

function getMonthDayCount(monthKey) {
    const [year, month] = String(monthKey ?? "")
        .split("-")
        .map(Number);

    return year && month ? new Date(year, month, 0).getDate() : 30;
}

function getDateLabel(dateKey) {
    const [, month, day] = String(dateKey ?? "").split("-");

    return day && month ? `${day}/${month}` : dateKey;
}

const reportWeekdayFormatter = new Intl.DateTimeFormat(expenseDefaultLocale, {
    weekday: "short",
});

function getLocalDateKey(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${date.getFullYear()}-${month}-${day}`;
}

function getReportWeekdayLabel(date) {
    return reportWeekdayFormatter.format(date).replace("Th ", "T").replace(".", "");
}

function getShortMoney(value) {
    const amount = Math.abs(Number(value) || 0);

    if (amount >= 1_000_000) {
        return `${Math.round(amount / 100_000) / 10}tr`;
    }

    if (amount >= 1_000) {
        return `${Math.round(amount / 1_000)}k`;
    }

    return `${amount}`;
}

function getBudgetRows(budgets, categories, monthlyStats) {
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    const categorySpendingById = monthlyStats.categoryExpenseMinor ?? {};

    return budgets
        .map((budget) => {
            const category = categoriesById.get(budget.categoryId);
            const amount = categorySpendingById[budget.categoryId] ?? 0;
            const limit = budget.limitMinor ?? 0;

            return {
                ...budget,
                amount,
                category: category?.name ?? budget.categoryId,
                color: category?.color ?? "#b8bec8",
                percentage: getPercent(amount, limit),
            };
        })
        .filter((budget) => budget.limitMinor > 0)
        .sort((firstBudget, secondBudget) => secondBudget.percentage - firstBudget.percentage);
}

function getCategoryComparisonRows(categories, monthlyStats, previousMonthlyStats) {
    const expenseCategories = categories.filter((category) => (category.type ?? "expense") === "expense");
    const categoriesById = new Map(expenseCategories.map((category) => [category.id, category]));
    const currentSpendingById = monthlyStats.categoryExpenseMinor ?? {};
    const previousSpendingById = previousMonthlyStats.categoryExpenseMinor ?? {};
    const categoryIds = new Set([
        ...expenseCategories.map((category) => category.id),
        ...Object.keys(currentSpendingById),
        ...Object.keys(previousSpendingById),
    ]);

    return [...categoryIds]
        .map((categoryId) => {
            const category = categoriesById.get(categoryId);
            const currentAmount = currentSpendingById[categoryId] ?? 0;
            const previousAmount = previousSpendingById[categoryId] ?? 0;
            const change = currentAmount - previousAmount;
            const absoluteChange = Math.abs(change);
            const percentage = previousAmount > 0 ? Math.round((change / previousAmount) * 100) : null;
            let direction = "unchanged";

            if (previousAmount === 0 && currentAmount > 0) {
                direction = "new";
            } else if (currentAmount === 0 && previousAmount > 0) {
                direction = "stopped";
            } else if (change > 0) {
                direction = "increased";
            } else if (change < 0) {
                direction = "decreased";
            }

            return {
                absoluteChange,
                change,
                color: category?.color ?? "#8aa2ff",
                currentAmount,
                direction,
                icon: category?.icon ?? "more",
                id: categoryId,
                name: category?.name ?? "Danh mục khác",
                percentage,
                previousAmount,
            };
        })
        .filter((row) => row.currentAmount > 0 || row.previousAmount > 0)
        .sort((firstRow, secondRow) => {
            if (secondRow.absoluteChange !== firstRow.absoluteChange) {
                return secondRow.absoluteChange - firstRow.absoluteChange;
            }

            return secondRow.currentAmount - firstRow.currentAmount;
        });
}

function getDailyExpenseRows(monthKey, transactions) {
    const dayCount = getMonthDayCount(monthKey);
    const totalsByDay = transactions.reduce((result, transaction) => {
        const day = Number(String(transaction.date ?? "").slice(-2));

        if (Number.isInteger(day) && day > 0) {
            const amount = Math.abs(transaction.amountMinor ?? transaction.amount ?? 0);
            const categoryName = transaction.categoryName || transaction.category || "Khác";
            const currentDay = result[day] ?? {
                amount: 0,
                categories: {},
                transactionCount: 0,
            };

            currentDay.amount += amount;
            currentDay.categories[categoryName] = (currentDay.categories[categoryName] ?? 0) + amount;
            currentDay.transactionCount += 1;
            result[day] = currentDay;
        }

        return result;
    }, {});
    return Array.from({ length: dayCount }, (_, index) => {
        const day = index + 1;
        const dayStats = totalsByDay[day] ?? {
            amount: 0,
            categories: {},
            transactionCount: 0,
        };
        const topCategory =
            Object.entries(dayStats.categories).sort(
                (firstCategory, secondCategory) => secondCategory[1] - firstCategory[1],
            )[0]?.[0] ?? "-";
        return {
            amount: dayStats.amount,
            day,
            topCategory,
            transactionCount: dayStats.transactionCount,
        };
    });
}

function getWeeklyExpenseRows(monthKey, dailyRows) {
    const [year, month] = String(monthKey ?? "")
        .split("-")
        .map(Number);

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
        return [];
    }

    const monthIndex = month - 1;
    const firstMonthDate = new Date(year, monthIndex, 1, 12);
    const lastMonthDate = new Date(year, month, 0, 12);
    const firstWeekDate = new Date(firstMonthDate);
    const mondayOffset = (firstWeekDate.getDay() + 6) % 7;
    const todayKey = getLocalDateKey(new Date());

    firstWeekDate.setDate(firstWeekDate.getDate() - mondayOffset);

    const weeks = [];
    const weekStartDate = new Date(firstWeekDate);

    while (weekStartDate <= lastMonthDate) {
        const days = Array.from({ length: 7 }, (_, dayIndex) => {
            const date = new Date(weekStartDate);
            date.setDate(weekStartDate.getDate() + dayIndex);

            const isInSelectedMonth = date.getFullYear() === year && date.getMonth() === monthIndex;
            const dayStats = isInSelectedMonth ? dailyRows[date.getDate() - 1] : null;
            const dateKey = getLocalDateKey(date);
            const dateLabel = getDateLabel(dateKey);

            return {
                amount: dayStats?.amount ?? 0,
                axisLabel: `${getReportWeekdayLabel(date)} ${dateLabel}`,
                dateKey,
                dateLabel,
                isInSelectedMonth,
                isToday: dateKey === todayKey,
                rangeLabel: isInSelectedMonth
                    ? `${dayStats?.transactionCount ?? 0} giao dịch · ${dayStats?.topCategory ?? "-"}`
                    : "Ngoài tháng đang xem",
                tooltipLabel: `${getReportWeekdayLabel(date)}, ${dateLabel}`,
                transactionCount: dayStats?.transactionCount ?? 0,
            };
        });
        const firstDay = days[0];
        const lastDay = days[days.length - 1];
        const weekNumber = weeks.length + 1;

        weeks.push({
            amount: days.reduce((total, day) => total + day.amount, 0),
            days,
            id: firstDay.dateKey,
            label: `Tuần ${weekNumber}`,
            rangeLabel: `${firstDay.dateLabel} - ${lastDay.dateLabel}`,
            tooltipLabel: `Tuần ${weekNumber}`,
        });
        weekStartDate.setDate(weekStartDate.getDate() + 7);
    }

    return weeks;
}

function getWalletRows(transactions, wallets) {
    const walletsById = new Map(wallets.map((wallet) => [wallet.id, wallet]));
    const totalsByWalletId = transactions.reduce((result, transaction) => {
        const walletId = transaction.walletId || "other";

        result[walletId] = (result[walletId] ?? 0) + Math.abs(transaction.amount ?? 0);

        return result;
    }, {});
    const total = Object.values(totalsByWalletId).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(totalsByWalletId)
        .map(([walletId, amount]) => {
            const wallet = walletsById.get(walletId);

            return {
                amount,
                color: wallet?.color ?? "#7567e8",
                id: walletId,
                name: wallet?.name ?? "Ví khác",
                percentage: getPercent(amount, total),
            };
        })
        .sort((firstWallet, secondWallet) => secondWallet.amount - firstWallet.amount);
}

function getWeekendInsight(transactions) {
    const weekendTotals = { amount: 0, days: new Set() };
    const weekdayTotals = { amount: 0, days: new Set() };

    transactions.forEach((transaction) => {
        const date = new Date(`${transaction.date}T00:00:00`);
        const dayOfWeek = date.getDay();
        const bucket = dayOfWeek === 0 || dayOfWeek === 6 ? weekendTotals : weekdayTotals;

        bucket.amount += Math.abs(transaction.amount ?? 0);
        bucket.days.add(transaction.date);
    });

    const weekendAverage = weekendTotals.amount / Math.max(weekendTotals.days.size, 1);
    const weekdayAverage = weekdayTotals.amount / Math.max(weekdayTotals.days.size, 1);

    return weekdayAverage > 0 ? Math.round((weekendAverage / weekdayAverage) * 10) / 10 : 0;
}

function ReportChartTooltip({ active, label, payload }) {
    if (!active || !payload?.length) {
        return null;
    }

    const point = payload[0]?.payload;

    return (
        <div className="expenses-chart-tooltip report-chart-tooltip">
            <strong>{point?.tooltipLabel ?? label}</strong>
            {payload.map((item) => (
                <span key={item.dataKey} style={{ "--tooltip-color": item.color }}>
                    {reportChartSeries[item.dataKey] ?? item.name}: <b>{formatCurrency(item.value ?? 0)}</b>
                </span>
            ))}
            {point?.rangeLabel ? <small>{point.rangeLabel}</small> : null}
        </div>
    );
}

function ReportLineChart({ months }) {
    const chartData = months.map((month) => ({
        ...month,
        label: getCompactMonthLabel(month.monthKey),
        tooltipLabel: getMonthLabel(month.monthKey),
    }));

    return (
        <div className="report-line-chart report-recharts">
            <ResponsiveContainer height="100%" width="100%">
                <LineChart data={chartData} margin={{ bottom: 4, left: 0, right: 42, top: 18 }}>
                    <CartesianGrid stroke="var(--expense-border)" strokeDasharray="4 6" vertical={false} />
                    <XAxis
                        axisLine={false}
                        dataKey="label"
                        interval={0}
                        padding={{ left: 18, right: 18 }}
                        tick={{ fill: "var(--expense-muted)", fontSize: 11, fontWeight: 800 }}
                        tickLine={false}
                    />
                    <YAxis
                        axisLine={false}
                        tick={{ fill: "var(--expense-muted)", fontSize: 11, fontWeight: 800 }}
                        tickFormatter={getShortMoney}
                        tickLine={false}
                        width={42}
                    />
                    <Tooltip
                        isAnimationActive={false}
                        content={<ReportChartTooltip />}
                        cursor={{ stroke: "var(--expense-border)", strokeDasharray: "4 4" }}
                    />
                    <Line
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        dataKey="income"
                        dot={{ r: 3, strokeWidth: 0 }}
                        name="Thu nhập"
                        stroke="#25c86f"
                        strokeLinecap="round"
                        strokeWidth={3}
                        type="monotone"
                    />
                    <Line
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        dataKey="expense"
                        dot={{ r: 3, strokeWidth: 0 }}
                        name="Chi tiêu"
                        stroke="#f4323d"
                        strokeLinecap="round"
                        strokeWidth={3}
                        type="monotone"
                    />
                    <Line
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        dataKey="average"
                        dot={{ r: 2.8, strokeWidth: 0 }}
                        name="Trung bình chi tiêu"
                        stroke="#f3a63b"
                        strokeDasharray="6 6"
                        strokeLinecap="round"
                        strokeWidth={2.5}
                        type="monotone"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

function renderBarValueLabel({ height, value, width, x, y }) {
    if (!value) {
        return null;
    }

    return (
        <text
            className="report-week-chart__value"
            textAnchor="middle"
            x={x + width / 2}
            y={Math.max(y - 8, height > 0 ? 12 : y)}
        >
            {getShortMoney(value)}
        </text>
    );
}

function ReportWeekBarShape({ onSelectWeek, payload, ...shapeProps }) {
    const selectWeek = () => {
        if (payload?.id) {
            onSelectWeek?.(payload.id);
        }
    };

    return (
        <Rectangle
            {...shapeProps}
            aria-label={`Xem chi tiết ${payload?.label ?? "tuần"}`}
            className="report-week-chart__bar"
            onClick={selectWeek}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectWeek();
                }
            }}
            role="button"
            tabIndex={0}
        />
    );
}

function ReportWeeklyBarChart({ onSelectWeek, weeks }) {
    const chartData = weeks.map((week) => ({
        ...week,
        tooltipLabel: week.label,
    }));

    return (
        <div className="report-week-chart report-recharts">
            <ResponsiveContainer height="100%" width="100%">
                <BarChart barCategoryGap="26%" data={chartData} margin={{ bottom: 6, left: 0, right: 12, top: 26 }}>
                    <CartesianGrid stroke="var(--expense-border)" strokeDasharray="4 6" vertical={false} />
                    <XAxis
                        axisLine={false}
                        dataKey="label"
                        interval={0}
                        tick={{ fill: "var(--expense-muted)", fontSize: 11, fontWeight: 800 }}
                        tickLine={false}
                    />
                    <YAxis
                        axisLine={false}
                        tick={{ fill: "var(--expense-muted)", fontSize: 11, fontWeight: 800 }}
                        tickFormatter={getShortMoney}
                        tickLine={false}
                        width={42}
                    />
                    <Tooltip
                        isAnimationActive={false}
                        content={<ReportChartTooltip />}
                        cursor={{ fill: "color-mix(in srgb, var(--expense-active-soft) 22%, transparent)" }}
                    />
                    <Bar
                        dataKey="amount"
                        fill="#f4323d"
                        maxBarSize={72}
                        name="Chi tiêu"
                        radius={[8, 8, 3, 3]}
                        shape={<ReportWeekBarShape onSelectWeek={onSelectWeek} />}
                    >
                        <LabelList content={renderBarValueLabel} dataKey="amount" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function ReportDailyBarChart({ days }) {
    return (
        <div className="report-week-chart report-recharts">
            <ResponsiveContainer height="100%" width="100%">
                <BarChart barCategoryGap="24%" data={days} margin={{ bottom: 6, left: 0, right: 12, top: 26 }}>
                    <CartesianGrid stroke="var(--expense-border)" strokeDasharray="4 6" vertical={false} />
                    <XAxis
                        axisLine={false}
                        dataKey="axisLabel"
                        interval={0}
                        tick={{ fill: "var(--expense-muted)", fontSize: 11, fontWeight: 800 }}
                        tickLine={false}
                    />
                    <YAxis
                        axisLine={false}
                        tick={{ fill: "var(--expense-muted)", fontSize: 11, fontWeight: 800 }}
                        tickFormatter={getShortMoney}
                        tickLine={false}
                        width={42}
                    />
                    <Tooltip
                        isAnimationActive={false}
                        content={<ReportChartTooltip />}
                        cursor={{ fill: "color-mix(in srgb, var(--expense-active-soft) 22%, transparent)" }}
                    />
                    <Bar dataKey="amount" maxBarSize={72} name="Chi tiêu" radius={[8, 8, 3, 3]}>
                        {days.map((day) => (
                            <Cell
                                fill={day.isInSelectedMonth ? "#f4323d" : "var(--expense-border)"}
                                key={day.dateKey}
                            />
                        ))}
                        <LabelList content={renderBarValueLabel} dataKey="amount" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function ReportInsightCard({ label, tone, value }) {
    return (
        <article className={`report-insight-card report-insight-card--${tone}`}>
            <i aria-hidden="true">
                <ReportIcon size={18} />
            </i>
            <div>
                <strong>{label}</strong>
                <p>{value}</p>
                {/* <button type="button">Xem chi tiết →</button> */}
            </div>
        </article>
    );
}

function getCategoryComparisonChangeText(row) {
    if (row.absoluteChange === 0) {
        return formatCurrency(0);
    }

    return `${row.change > 0 ? "+" : "-"}${formatCurrency(row.absoluteChange)}`;
}

function getCategoryComparisonChartGroups(rows) {
    const decreases = rows
        .filter((row) => row.change < 0)
        .sort((firstRow, secondRow) => secondRow.absoluteChange - firstRow.absoluteChange)
        .slice(0, reportCategoryComparisonLimit);
    const increases = rows
        .filter((row) => row.change > 0)
        .sort((firstRow, secondRow) => secondRow.absoluteChange - firstRow.absoluteChange)
        .slice(0, reportCategoryComparisonLimit);

    return { decreases, increases };
}

function CategoryComparisonBars({ rows, tone }) {
    const maxChange = Math.max(...rows.map((row) => row.absoluteChange), 1);

    return (
        <div className="report-category-comparison-chart__rows">
            {rows.length ? (
                rows.map((row) => (
                    <div className="report-category-comparison-chart__row" key={row.id}>
                        <div className="report-category-comparison-chart__row-head">
                            <strong>{row.name}</strong>
                            <span>{getCategoryComparisonChangeText(row)}</span>
                        </div>
                        <div className="report-category-comparison-chart__track" aria-hidden="true">
                            <i
                                style={{
                                    "--bar-width": `${Math.max(Math.round((row.absoluteChange / maxChange) * 100), 6)}%`,
                                }}
                            />
                        </div>
                        <small>
                            Tháng này {formatCurrency(row.currentAmount)} · Tháng trước{" "}
                            {formatCurrency(row.previousAmount)}
                        </small>
                    </div>
                ))
            ) : (
                <ExpenseStateMessage className="report-page__empty">
                    Không có danh mục {tone === "increase" ? "tăng chi" : "giảm chi"}.
                </ExpenseStateMessage>
            )}
        </div>
    );
}

function ReportCategoryComparison({ rows }) {
    const { decreases, increases } = getCategoryComparisonChartGroups(rows);

    if (!decreases.length && !increases.length) {
        return <ExpenseStateMessage className="report-page__empty" message="Chưa có dữ liệu danh mục để so sánh." />;
    }

    return (
        <div className="report-category-comparison-chart">
            <section className="report-category-comparison-chart__group report-category-comparison-chart__group--decrease">
                <header>
                    <span>Giảm chi</span>
                    <b>{decreases.length}</b>
                </header>
                <CategoryComparisonBars rows={decreases} tone="decrease" />
            </section>
            <section className="report-category-comparison-chart__group report-category-comparison-chart__group--increase">
                <header>
                    <span>Tăng chi</span>
                    <b>{increases.length}</b>
                </header>
                <CategoryComparisonBars rows={increases} tone="increase" />
            </section>
        </div>
    );
}

function ReportWorkspace({
    categories: controlledCategories,
    mode = "mobile",
    monthOptions: controlledMonthOptions,
    onNavigate,
    onSelectedMonthChange,
    selectedMonth: controlledSelectedMonth,
    wallets: controlledWallets,
}) {
    const uid = useAuthSessionStore(selectAuthUid);
    const storeCategories = useExpenseDataStore(selectExpenseCategories);
    const storeWallets = useExpenseDataStore(selectExpenseWallets);
    const budgetLimitsByMonth = useExpenseDataStore(selectExpenseBudgetLimitsByMonth);
    const monthlyStatsByMonth = useExpenseDataStore(selectExpenseMonthlyStatsByMonth);
    const monthOptionsByYear = useExpenseDataStore(selectExpenseMonthOptionsByYear);
    const loadExpenseBudgets = useExpenseDataStore((state) => state.loadExpenseBudgets);
    const loadExpenseMonthlyStats = useExpenseDataStore((state) => state.loadExpenseMonthlyStats);
    const loadExpenseMonthOptions = useExpenseDataStore((state) => state.loadExpenseMonthOptions);
    const currentMonthKey = getCurrentMonthKey();
    const currentYear = getCurrentYear();
    const monthOptionsCacheKey = getExpenseMonthOptionsCacheKey(uid, currentYear);
    const categories = controlledCategories ?? storeCategories;
    const wallets = controlledWallets ?? storeWallets;
    const isDesktopMode = mode === "desktop";
    const isMobileMode = mode === "mobile";
    const isMonthOptionsControlled = Array.isArray(controlledMonthOptions);
    const isSelectedMonthControlled = controlledSelectedMonth !== undefined;
    const [internalSelectedMonth, setInternalSelectedMonth] = useState(currentMonthKey);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [selectedWeekId, setSelectedWeekId] = useState("");
    const [trendView, setTrendView] = useState(expenseReportTrendViews.WEEKLY);
    const selectedMonth = isSelectedMonthControlled ? controlledSelectedMonth : internalSelectedMonth;
    const previousMonthKey = getPreviousMonthKey(selectedMonth);
    const trendMonthKeys = useMemo(() => getTrailingMonthKeys(selectedMonth), [selectedMonth]);
    const monthlyStats = monthlyStatsByMonth[selectedMonth] ?? getEmptyMonthlyStats(selectedMonth);
    const previousMonthlyStats = monthlyStatsByMonth[previousMonthKey] ?? getEmptyMonthlyStats(previousMonthKey);
    const trendStats = useMemo(
        () => trendMonthKeys.map((monthKey) => monthlyStatsByMonth[monthKey] ?? getEmptyMonthlyStats(monthKey)),
        [monthlyStatsByMonth, trendMonthKeys],
    );
    const budgets = useMemo(() => budgetLimitsByMonth[selectedMonth] ?? [], [budgetLimitsByMonth, selectedMonth]);
    const monthOptions = useMemo(
        () =>
            isMonthOptionsControlled
                ? controlledMonthOptions
                : (monthOptionsByYear[monthOptionsCacheKey] ?? [currentMonthKey]),
        [controlledMonthOptions, currentMonthKey, isMonthOptionsControlled, monthOptionsByYear, monthOptionsCacheKey],
    );
    const setSelectedMonth = useCallback(
        (nextMonth) => {
            if (!isSelectedMonthControlled) {
                setInternalSelectedMonth(nextMonth);
            }

            setSelectedWeekId("");
            setTrendView(expenseReportTrendViews.WEEKLY);
            onSelectedMonthChange?.(nextMonth);
        },
        [isSelectedMonthControlled, onSelectedMonthChange],
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
                    setTransactions([]);
                    setIsLoading(false);
                }
            });

            return () => {
                isCancelled = true;
            };
        }

        import("../api/transactionsRepository")
            .then(({ getExpenseTransactionsPage }) =>
                Promise.all([
                    loadExpenseMonthlyStats(uid, selectedMonth),
                    loadExpenseMonthlyStats(uid, previousMonthKey),
                    Promise.all(trendMonthKeys.map((monthKey) => loadExpenseMonthlyStats(uid, monthKey))),
                    loadExpenseBudgets(uid, selectedMonth),
                    getExpenseTransactionsPage(uid, {
                        monthKey: selectedMonth,
                        pageSize: 50,
                        type: transactionTypes.EXPENSE,
                    }),
                ]),
            )
            .then(([, , , , nextTransactionsPage]) => {
                if (!isCancelled) {
                    setTransactions(nextTransactionsPage.transactions);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setTransactions([]);
                    setLoadError("Không thể tải báo cáo. Vui lòng thử lại.");
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
    }, [loadExpenseBudgets, loadExpenseMonthlyStats, previousMonthKey, selectedMonth, trendMonthKeys, uid]);

    const income = monthlyStats.incomeMinor ?? 0;
    const expense = monthlyStats.expenseMinor ?? 0;
    const net = monthlyStats.netMinor ?? income - expense;
    const previousIncome = previousMonthlyStats.incomeMinor ?? 0;
    const previousExpense = previousMonthlyStats.expenseMinor ?? 0;
    const previousNet = previousMonthlyStats.netMinor ?? previousIncome - previousExpense;
    const savingRate = income > 0 ? Math.round((net / income) * 1000) / 10 : 0;
    const previousSavingRate = previousIncome > 0 ? Math.round((previousNet / previousIncome) * 1000) / 10 : 0;
    const categorySpending = useMemo(
        () =>
            getCategorySpendingByMonth({
                categories,
                monthKey: selectedMonth,
                monthlyStats,
            }).sort((firstCategory, secondCategory) => secondCategory.amount - firstCategory.amount),
        [categories, monthlyStats, selectedMonth],
    );
    const budgetRows = useMemo(
        () => getBudgetRows(budgets, categories, monthlyStats),
        [budgets, categories, monthlyStats],
    );
    const categoryComparisonRows = useMemo(
        () => getCategoryComparisonRows(categories, monthlyStats, previousMonthlyStats),
        [categories, monthlyStats, previousMonthlyStats],
    );
    const overBudgetCount = budgetRows.filter((budget) => budget.amount > budget.limitMinor).length;
    const dailyRows = useMemo(() => getDailyExpenseRows(selectedMonth, transactions), [selectedMonth, transactions]);
    const weeklyRows = useMemo(() => getWeeklyExpenseRows(selectedMonth, dailyRows), [dailyRows, selectedMonth]);
    const defaultSelectedWeek = weeklyRows.find((week) => week.days.some((day) => day.isToday)) ?? weeklyRows.at(-1);
    const selectedWeek = weeklyRows.find((week) => week.id === selectedWeekId) ?? defaultSelectedWeek;
    const walletRows = useMemo(() => getWalletRows(transactions, wallets), [transactions, wallets]);
    const topTransactions = useMemo(
        () =>
            [...transactions]
                .sort((first, second) => Math.abs(second.amount) - Math.abs(first.amount))
                .slice(0, reportTopTransactionLimit),
        [transactions],
    );
    const lineMonths = trendStats.map((stat) => {
        const statIncome = stat.incomeMinor ?? 0;
        const statExpense = stat.expenseMinor ?? 0;

        return {
            average: stat.transactionCount ? Math.round(statExpense / Math.max(getMonthDayCount(stat.monthKey), 1)) : 0,
            expense: statExpense,
            income: statIncome,
            monthKey: stat.monthKey,
            net: stat.netMinor ?? statIncome - statExpense,
            savingRate: statIncome > 0 ? getPercent(stat.netMinor ?? statIncome - statExpense, statIncome) : 0,
        };
    });
    const comparisonRows = lineMonths.slice(-reportComparisonMonthCount).reverse();
    const expenseTrend = calculateTrend(expense, previousExpense);
    const incomeTrend = calculateTrend(income, previousIncome);
    const netTrend = calculateTrend(net, previousNet);
    const savingTrend = Math.round((savingRate - previousSavingRate) * 10) / 10;
    const reportSummaryItems = [
        {
            emphasizeValue: true,
            icon: ArrowUpIcon,
            iconSize: 20,
            id: "income",
            label: "Tổng thu nhập",
            tone: "green",
            trend: incomeTrend,
            value: income,
        },
        {
            emphasizeValue: true,
            icon: ArrowDownIcon,
            iconSize: 20,
            id: "expense",
            label: "Tổng chi tiêu",
            tone: "red",
            trend: expenseTrend,
            value: expense,
        },
        {
            emphasizeValue: true,
            icon: ReportIcon,
            iconSize: 20,
            id: "net",
            label: "Dòng tiền (Thu - Chi)",
            tone: "green",
            trend: netTrend,
            value: net,
        },
        {
            emphasizeValue: true,
            icon: BudgetIcon,
            iconSize: 20,
            id: "saving",
            label: "Tỷ lệ tiết kiệm",
            tone: "purple",
            trend: savingTrend,
            value: `${savingRate}%`,
            valueType: "text",
        },
    ];
    const topCategory = categorySpending[0];
    const weekendRatio = getWeekendInsight(transactions);
    const topTransaction = topTransactions[0];
    const insights = [
        {
            label: "Chi tiêu tăng cao",
            tone: "red",
            value:
                expenseTrend > 0
                    ? `Chi tiêu của bạn cao hơn ${expenseTrend}% so với tháng trước.`
                    : "Chi tiêu đang thấp hơn tháng trước.",
        },
        {
            label: topCategory ? `${topCategory.name} chiếm nhiều nhất` : "Chưa có danh mục nổi bật",
            tone: "orange",
            value: topCategory
                ? `Bạn đã chi ${formatCurrency(topCategory.amount)} cho ${topCategory.name}, chiếm ${topCategory.percentage}% tổng chi tiêu.`
                : "Tháng này chưa có dữ liệu chi tiêu.",
        },
        {
            label: "Cuối tuần chi nhiều hơn",
            tone: "green",
            value: weekendRatio
                ? `Chi tiêu cuối tuần cao gấp ${weekendRatio} lần ngày thường.`
                : "Chưa đủ dữ liệu cuối tuần.",
        },
        {
            label: "Vượt ngân sách",
            tone: "blue",
            value: overBudgetCount
                ? `Bạn đã vượt ${overBudgetCount} ngân sách trong ${getMonthLabel(selectedMonth).toLowerCase()}.`
                : "Các ngân sách vẫn trong tầm kiểm soát.",
        },
    ];
    const handleViewTransactions = () => {
        onNavigate?.("transactions");
    };
    const handleViewCategories = () => {
        onNavigate?.("categories");
    };
    const handleSelectWeek = (weekId) => {
        setSelectedWeekId(weekId);
        setTrendView(expenseReportTrendViews.DAILY);
    };
    const handleTrendViewChange = (nextView) => {
        if (nextView === expenseReportTrendViews.DAILY && !selectedWeek) {
            return;
        }

        setTrendView(nextView);
    };

    const reportContent = (
        <div className={`report-page report-page--${mode}`}>
            {!isDesktopMode ? (
                <section className="report-page__topbar">
                    <div className="report-page__title">
                        <h1>Báo cáo chi tiêu</h1>
                        <p>Phân tích và tổng hợp tình hình tài chính của bạn</p>
                    </div>
                    <div className="report-page__filters">
                        <label className="report-page__filter-control report-page__select-control">
                            <span className="sr-only">Chọn tháng báo cáo</span>
                            <select onChange={(event) => setSelectedMonth(event.target.value)} value={selectedMonth}>
                                {monthOptions.map((monthKey) => (
                                    <option key={monthKey} value={monthKey}>
                                        {getMonthLabel(monthKey)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </section>
            ) : null}

            {loadError ? <p className="report-page__notice">{loadError}</p> : null}

            <SummaryCardList
                ariaLabel="Chỉ số báo cáo"
                cardVariant="report"
                className="report-page__stats"
                items={reportSummaryItems}
                variant="report"
            />

            <section className="report-panel report-panel--insights">
                <header className="report-panel__header">
                    <div>
                        <h2>Thông tin nổi bật</h2>
                    </div>
                </header>
                <div className="report-insight-grid">
                    {insights.map((insight) => (
                        <ReportInsightCard key={insight.label} {...insight} />
                    ))}
                </div>
            </section>

            <section className="report-page__primary-grid">
                <article className="report-panel report-panel--trend">
                    <header className="report-panel__header">
                        <div>
                            <h2>Xu hướng thu chi</h2>
                            <span>6 tháng gần nhất</span>
                        </div>
                    </header>
                    {isLoading ? (
                        <ExpenseStateMessage
                            className="report-page__empty"
                            message={expenseUiText.status.LOADING_DATA}
                        />
                    ) : (
                        <ReportLineChart months={lineMonths} />
                    )}
                    <div className="report-chart-legend">
                        <span className="report-chart-legend__item report-chart-legend__item--income">Thu nhập</span>
                        <span className="report-chart-legend__item report-chart-legend__item--expense">Chi tiêu</span>
                        <span className="report-chart-legend__item report-chart-legend__item--average">
                            Trung bình chi tiêu
                        </span>
                    </div>
                    <div className="report-callout">
                        <ReportIcon size={18} />
                        <span>
                            Chi tiêu tháng {getCompactMonthLabel(selectedMonth)} {expenseTrend >= 0 ? "tăng" : "giảm"}{" "}
                            {Math.abs(expenseTrend)}% ({formatCurrency(Math.abs(expense - previousExpense))}) so với
                            tháng trước.
                        </span>
                        <b>›</b>
                    </div>
                </article>
                <article className="report-panel report-panel--weekly-trend">
                    <header className="report-panel__header">
                        <div>
                            <h2>
                                {trendView === expenseReportTrendViews.WEEKLY
                                    ? "Xu hướng chi tiêu theo tuần"
                                    : "Chi tiêu theo ngày"}
                            </h2>
                            <span>
                                {trendView === expenseReportTrendViews.WEEKLY
                                    ? getMonthLabel(selectedMonth)
                                    : `${selectedWeek?.label ?? "Tuần"} · ${selectedWeek?.rangeLabel ?? ""}`}
                            </span>
                        </div>
                        <div aria-label="Kiểu hiển thị xu hướng chi tiêu" className="report-trend-toggle" role="group">
                            <ExpenseButton
                                aria-pressed={trendView === expenseReportTrendViews.WEEKLY}
                                className={trendView === expenseReportTrendViews.WEEKLY ? "is-active" : ""}
                                label={expenseUiText.report.WEEKLY_VIEW}
                                onClick={() => handleTrendViewChange(expenseReportTrendViews.WEEKLY)}
                            />
                            <ExpenseButton
                                aria-pressed={trendView === expenseReportTrendViews.DAILY}
                                className={trendView === expenseReportTrendViews.DAILY ? "is-active" : ""}
                                disabled={!selectedWeek}
                                label={expenseUiText.report.DAILY_VIEW}
                                onClick={() => handleTrendViewChange(expenseReportTrendViews.DAILY)}
                            />
                        </div>
                    </header>
                    {isLoading ? (
                        <ExpenseStateMessage
                            className="report-page__empty"
                            message={expenseUiText.status.LOADING_DATA}
                        />
                    ) : trendView === expenseReportTrendViews.WEEKLY ? (
                        <>
                            <ReportWeeklyBarChart onSelectWeek={handleSelectWeek} weeks={weeklyRows} />
                            <p className="report-panel__muted">{expenseUiText.report.SELECT_WEEK_HINT}</p>
                        </>
                    ) : selectedWeek ? (
                        <>
                            <ReportDailyBarChart days={selectedWeek.days} />
                            <p className="report-panel__muted">
                                Tổng {selectedWeek.label.toLowerCase()}: {formatCurrency(selectedWeek.amount)}
                            </p>
                        </>
                    ) : (
                        <ExpenseStateMessage className="report-page__empty" message="Chưa có dữ liệu theo ngày." />
                    )}
                </article>
            </section>

            <section className="report-panel report-panel--category-comparison">
                <header className="report-panel__header">
                    <div>
                        <h2>So sánh danh mục với tháng trước</h2>
                        <span>
                            {getMonthLabel(selectedMonth)} so với {getMonthLabel(previousMonthKey)}
                        </span>
                    </div>
                    <ExpenseButton className="report-panel__link" onClick={handleViewCategories}>
                        Xem chi tiết danh mục <span>›</span>
                    </ExpenseButton>
                </header>
                {isLoading ? (
                    <ExpenseStateMessage className="report-page__empty" message={expenseUiText.status.LOADING_DATA} />
                ) : (
                    <ReportCategoryComparison rows={categoryComparisonRows} />
                )}
            </section>

            <section className="report-page__secondary-grid">
                <article className="report-panel report-panel--top-transactions">
                    <header className="report-panel__header">
                        <div>
                            <h2>Top 5 giao dịch lớn nhất</h2>
                        </div>
                    </header>
                    <div className="report-transaction-list">
                        {topTransactions.length ? (
                            topTransactions.map((transaction) => (
                                <div className="report-transaction" key={transaction.id}>
                                    <i style={{ "--transaction-color": transaction.categoryColor || "#8aa2ff" }}>
                                        <TransactionListIcon size={17} />
                                    </i>
                                    <div>
                                        <strong>{transaction.title}</strong>
                                        <span>{transaction.walletName || transaction.categoryName || "Ví"}</span>
                                    </div>
                                    <b>
                                        <AmountText amount={Math.abs(transaction.amount)} />
                                        <small>{getDateLabel(transaction.date)}</small>
                                    </b>
                                </div>
                            ))
                        ) : (
                            <ExpenseStateMessage className="report-page__empty" message="Chưa có giao dịch chi tiêu." />
                        )}
                    </div>
                    <ExpenseButton className="report-panel__link" onClick={handleViewTransactions}>
                        Xem tất cả giao dịch <span>›</span>
                    </ExpenseButton>
                </article>

                <article className="report-panel report-panel--wallet-breakdown">
                    <header className="report-panel__header">
                        <div>
                            <h2>Chi tiêu theo ví</h2>
                        </div>
                    </header>
                    <div className="report-wallet-list">
                        {walletRows.length ? (
                            walletRows.map((wallet) => (
                                <div className="report-wallet-row" key={wallet.id}>
                                    <div>
                                        <strong>{wallet.name}</strong>
                                        <span>
                                            <AmountText amount={wallet.amount} />
                                            <small>{wallet.percentage}%</small>
                                        </span>
                                    </div>
                                    <ProgressBar color={wallet.color} max={100} value={wallet.percentage} />
                                </div>
                            ))
                        ) : (
                            <ExpenseStateMessage className="report-page__empty" message="Chưa có chi tiêu theo ví." />
                        )}
                    </div>
                    {/* <button className="report-panel__link" type="button">
                        Xem chi tiết theo ví <span>›</span>
                    </button> */}
                </article>
            </section>

            <section className="report-page__bottom-grid">
                <article className="report-panel report-panel--comparison">
                    <header className="report-panel__header">
                        <div>
                            <h2>So sánh theo tháng</h2>
                            <span>5 tháng gần nhất</span>
                        </div>
                    </header>
                    <div className="report-table">
                        <div className="report-table__head">
                            <span>Tháng</span>
                            <span>Thu nhập</span>
                            <span>Chi tiêu</span>
                            <span>Dòng tiền</span>
                            <span>Tỷ lệ tiết kiệm</span>
                        </div>
                        {comparisonRows.map((month) => (
                            <div className="report-table__row" key={month.monthKey}>
                                <strong>{getCompactMonthLabel(month.monthKey)}</strong>
                                <span>{formatCurrency(month.income)}</span>
                                <span className="is-danger">{formatCurrency(month.expense)}</span>
                                <span className={month.net >= 0 ? "is-good" : "is-danger"}>
                                    {formatCurrency(month.net)}
                                </span>
                                <span className="report-table__saving">
                                    <i
                                        style={{ "--saving-width": `${Math.max(Math.min(month.savingRate, 100), 0)}%` }}
                                    />
                                    <small>{month.savingRate}%</small>
                                </span>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="report-panel report-panel--forecast"></article>
            </section>

            {topTransaction ? null : <span className="sr-only">Không có giao dịch lớn nhất</span>}
        </div>
    );

    if (isMobileMode) {
        return (
            <main className="mobile-report-page">
                <MobilePageHeader subtitle={getMonthLabel(selectedMonth)} title="Báo cáo chi tiêu" />
                {reportContent}
            </main>
        );
    }

    return reportContent;
}

export default function ReportPage(props) {
    return <ReportWorkspace {...props} />;
}
