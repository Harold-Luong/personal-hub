import { useState } from "react";
import BudgetForm from "../components/budget/BudgetForm";
import CopyBudgetsForm from "../components/budget/CopyBudgetsForm";
import MobileBudgetFormSheet from "../components/budget/MobileBudgetFormSheet";
import MobilePageHeader from "../components/mobile/MobilePageHeader";
import AmountText from "../components/shared/AmountText";
import ExpenseIcon from "../icon/ExpenseIcon";
import ProgressBar from "../components/shared/ProgressBar";
import { budgetStatusColors, budgetStatusLabels } from "../constants/expenseMetadata";
import {
    calculateBudgetUsagePercentage,
    calculateMonthlyBudgetTotals,
    getBudgetUsageStatus,
} from "../utils/expenseCalculations";

const DEFAULT_BUDGET_COLOR = "var(--expense-active-strong)";

function getExpenseCategories(categories) {
    return categories.filter((category) => (category.type ?? "expense") === "expense");
}

function getFirstEditableCategoryId(categories, budgets) {
    const budgetCategoryIds = new Set(budgets.map((budget) => budget.categoryId));
    const categoryWithoutBudget = categories.find((category) => !budgetCategoryIds.has(category.id));

    return categoryWithoutBudget?.id ?? budgets[0]?.categoryId ?? categories[0]?.id ?? "";
}

function getBudgetRowMeta(budget, selectedCategoryId, spendingDays) {
    const status = getBudgetUsageStatus(budget);
    const remaining = budget.limit - budget.amount;

    return {
        dailyBudget: remaining > 0 && spendingDays > 0 ? Math.floor(remaining / spendingDays) : 0,
        isSelected: selectedCategoryId === budget.categoryId,
        remaining,
        status,
        statusColor: budgetStatusColors[status] ?? budget.color ?? DEFAULT_BUDGET_COLOR,
        usagePercentage: calculateBudgetUsagePercentage(budget),
    };
}

function getBudgetEditorTitle(budgets, categoryId) {
    return budgets.some((budget) => budget.categoryId === categoryId) ? "Sửa ngân sách" : "Tạo ngân sách";
}

function getSummaryMeta(totals) {
    const status = getBudgetUsageStatus({
        amount: totals.spent,
        limit: totals.limit,
    });

    return {
        hasBudgetLimit: totals.limit > 0,
        progress: `${Math.min(Math.max(totals.percentage, 0), 100)}%`,
        savingsVsPlan: totals.savingsVsPlan,
        status,
        statusColor: budgetStatusColors[status] ?? DEFAULT_BUDGET_COLOR,
    };
}

function getMonthTiming(monthKey) {
    const [year, month] = String(monthKey ?? "")
        .split("-")
        .map(Number);
    const now = new Date();
    const isValidMonth = Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12;
    const daysInMonth = isValidMonth ? new Date(year, month, 0).getDate() : 30;
    const isCurrentMonth = isValidMonth && year === now.getFullYear() && month === now.getMonth() + 1;
    const monthDate = isValidMonth ? new Date(year, month - 1, 1) : now;
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const remainingDays = isCurrentMonth
        ? Math.max(daysInMonth - now.getDate(), 0)
        : monthDate > currentMonthDate
            ? daysInMonth
            : 0;
    const spendingDays = isCurrentMonth ? remainingDays + 1 : remainingDays;

    return { remainingDays, spendingDays };
}

function BudgetMobileHeader({ monthKey, monthLabel, onBack }) {
    return (
        <MobilePageHeader
            actions={
                <button className="mobile-budget-page__header-action" onClick={onBack} type="button">
                    Cài đặt
                </button>
            }
            className="mobile-budget-page__header"
            subtitle={monthLabel ?? monthKey}
            title="Ngân sách"
        />
    );
}

function BudgetSummary({ budgetCount, totals }) {
    const { hasBudgetLimit, progress, savingsVsPlan, status, statusColor } = getSummaryMeta(totals);

    return (
        <section
            className={`budget-page__summary budget-page__summary--${status}`}
            style={{ "--summary-progress": progress }}
        >
            <div className="budget-page__summary-top">
                <div>
                    <span>Ngân sách tháng <strong>{budgetStatusLabels[status]}</strong></span>

                </div>
                <span className="budget-page__summary-badge">{budgetCount} danh mục</span>
            </div>

            <div className="budget-page__summary-main">
                <div className="budget-page__summary-ring">
                    <span>{totals.percentage}%</span>
                </div>
                <div className="budget-page__summary-copy">
                    <span>Tiết kiệm so với kế hoạch</span>
                    <strong>
                        <AmountText amount={savingsVsPlan} />
                    </strong>
                    <small>
                        {hasBudgetLimit
                            ? "Tạm tính trên các danh mục đã đặt ngân sách"
                            : "Chưa có hạn mức để theo dõi"}
                    </small>
                </div>
            </div>

            <ProgressBar color={statusColor} max={totals.limit} value={totals.spent} />

            <div className="budget-page__summary-metrics">
                <span>
                    <small>Đã chi</small>
                    <strong>
                        <AmountText amount={totals.spent} />
                    </strong>
                </span>
                <span>
                    <small>Hạn mức</small>
                    <strong>
                        <AmountText amount={totals.limit} />
                    </strong>
                </span>
            </div>
        </section>
    );
}

function DesktopBudgetSummary({ remainingDays, totals }) {
    const { progress, savingsVsPlan, status } = getSummaryMeta(totals);

    return (
        <section
            className={`budget-page__summary budget-page__summary--desktop budget-page__summary--${status}`}
            style={{ "--summary-progress": progress }}
        >
            <h2>Tổng quan ngân sách tháng</h2>
            <div className="budget-page__summary-metrics">
                <span>
                    <small>Đã chi</small>
                    <strong><AmountText amount={totals.spent} /></strong>
                </span>
                <span>
                    <small>Hạn mức</small>
                    <strong><AmountText amount={totals.limit} /></strong>
                </span>
            </div>
            <div className="budget-page__summary-ring" aria-label={`${totals.percentage}% đã sử dụng`}>
                <strong>{totals.percentage}%</strong>
                <span>đã sử dụng</span>
            </div>
            <div className="budget-page__summary-remaining">
                <span>Tiết kiệm so với kế hoạch</span>
                <strong><AmountText amount={savingsVsPlan} /></strong>
                <p>
                    {savingsVsPlan >= 0
                        ? "Chi tiêu đang thấp hơn tổng hạn mức đã đặt"
                        : "Chi tiêu đang cao hơn tổng hạn mức đã đặt"}
                </p>
                <div className="budget-page__daily-budget">
                    <ExpenseIcon bare icon="calendar" label="Thời gian còn lại" size={20} />
                    <span>
                        <strong>Còn {remainingDays} ngày nữa trong tháng</strong>
                        <small>Mức có thể chi mỗi ngày được tính riêng theo từng danh mục</small>
                    </span>
                </div>
            </div>
        </section>
    );
}

function BudgetStatusOverview({ budgets }) {
    const counts = budgets.reduce(
        (result, budget) => {
            const status = getBudgetUsageStatus(budget);
            return { ...result, [status]: result[status] + 1 };
        },
        { normal: 0, warning: 0, exceeded: 0 },
    );

    return (
        <section className="budget-page__status-overview" aria-label="Trạng thái ngân sách">
            <div className="budget-page__status budget-page__status--normal">
                <span aria-hidden="true">✓</span>
                <p><strong>Trong kế hoạch</strong><small>{counts.normal} danh mục</small></p>
            </div>
            <div className="budget-page__status budget-page__status--warning">
                <span aria-hidden="true">!</span>
                <p><strong>Gần vượt mức</strong><small>{counts.warning} danh mục</small></p>
            </div>
            <div className="budget-page__status budget-page__status--exceeded">
                <span aria-hidden="true">!</span>
                <p><strong>Vượt mức</strong><small>{counts.exceeded} danh mục</small></p>
            </div>
        </section>
    );
}

function BudgetSectionHeading({ budgetCount, hasCategoryWithoutBudget, isDesktopMode, onCopy, onCreate }) {
    return (
        <div className="budget-page__section-heading">
            <div>
                <h2>Danh mục ngân sách</h2>
                <p>{budgetCount} hạn mức trong tháng này</p>
            </div>
            <span className="budget-page__section-actions">
                {onCopy ? <button aria-haspopup="dialog" onClick={onCopy} type="button">Sao chép ngân sách</button> : null}
                <button onClick={onCreate} type="button">
                    {isDesktopMode ? <ExpenseIcon bare icon="add" size={18} /> : null}
                    {budgetCount === 0 || hasCategoryWithoutBudget ? "Tạo ngân sách" : "Sửa ngân sách"}
                </button>
                {isDesktopMode ? (
                    <button className="budget-page__filter" type="button" aria-label="Lọc danh mục ngân sách">
                        <ExpenseIcon bare icon="filter" size={18} />
                    </button>
                ) : null}
            </span>
        </div>
    );
}

function BudgetRowIcon({ budget }) {
    return <ExpenseIcon color={budget.color} icon={budget.icon} label={budget.category} />;
}

function BudgetDailyAllowance({ dailyBudget, remaining, spendingDays }) {
    if (spendingDays <= 0) {
        return <small className="budget-item-row__daily">Tháng đã kết thúc</small>;
    }

    if (remaining <= 0) {
        return <small className="budget-item-row__daily">Không còn mức chi</small>;
    }

    return (
        <small className="budget-item-row__daily">
            Có thể chi <AmountText amount={dailyBudget} />/ngày
        </small>
    );
}

function DesktopBudgetRow({ budget, dailyBudget, isSelected, onSelect, remaining, spendingDays, status, statusColor, usagePercentage }) {

    return (
        <button
            aria-label={`Sửa ngân sách ${budget.category}`}
            aria-pressed={isSelected}
            className={`budget-item-row budget-item-row--${status}${isSelected ? " is-selected" : ""}`}
            onClick={() => onSelect(budget.categoryId)}
            style={{ "--budget-color": budget.color, "--budget-status-color": statusColor }}
            type="button"
        >
            <BudgetRowIcon budget={budget} />
            <div className="budget-item-row__main">
                <div className="budget-item-row__heading">
                    <div className="budget-item-row__title">
                        <strong>{budget.category}</strong>
                        <span className={`budget-item-row__chip budget-item-row__chip--${status}`}>
                            {budgetStatusLabels[status]}
                        </span>
                    </div>
                </div>
                <div className="budget-item-row__amounts">
                    <strong><AmountText amount={budget.amount} /></strong>
                    <span>/</span>
                    <AmountText amount={budget.limit} />
                </div>
                <ProgressBar color={statusColor} max={budget.limit} value={budget.amount} />
                <small className="budget-item-row__percentage">{usagePercentage}% đã sử dụng</small>
            </div>
            <span className="budget-item-row__remaining">
                <small>{remaining >= 0 ? "Còn lại" : "Đã vượt"}</small>
                <strong><AmountText amount={Math.abs(remaining)} /></strong>
                <BudgetDailyAllowance dailyBudget={dailyBudget} remaining={remaining} spendingDays={spendingDays} />
            </span>
            <span className="budget-item-row__chevron" aria-hidden="true">
                <ExpenseIcon bare icon="chevron-right" size={20} />
            </span>
        </button>
    );
}

function MobileBudgetRow({ budget, dailyBudget, isSelected, onSelect, remaining, spendingDays, status, statusColor, usagePercentage }) {
    const rowClassName = `budget-item-row budget-item-row--compact budget-item-row--${status}${isSelected ? " is-selected" : ""
        }`;

    return (
        <button
            aria-label={`Sửa ngân sách ${budget.category}`}
            aria-pressed={isSelected}
            className={rowClassName}
            onClick={() => onSelect(budget.categoryId)}
            style={{ "--budget-color": budget.color }}
            type="button"
        >
            <BudgetRowIcon budget={budget} />
            <span className="budget-item-row__body">
                <span className="budget-item-row__copy">
                    <strong>{budget.category}</strong>
                    <span>
                        <AmountText amount={budget.amount} />
                        <small> / </small>
                        <AmountText amount={budget.limit} />
                    </span>
                    <BudgetDailyAllowance dailyBudget={dailyBudget} remaining={remaining} spendingDays={spendingDays} />
                </span>
                <ProgressBar color={statusColor} max={budget.limit} value={budget.amount} />
            </span>
            <span className="budget-item-row__percentage">{usagePercentage}%</span>
        </button>
    );
}

function BudgetRow({ budget, isDesktopMode, onSelect, selectedCategoryId, spendingDays }) {
    const rowMeta = getBudgetRowMeta(budget, selectedCategoryId, spendingDays);
    const RowComponent = isDesktopMode ? DesktopBudgetRow : MobileBudgetRow;

    return <RowComponent budget={budget} onSelect={onSelect} spendingDays={spendingDays} {...rowMeta} />;
}

function BudgetEmptyState() {
    return (
        <div className="budget-page__empty section-card">
            <strong>Chưa có ngân sách</strong>
            <p>Đặt hạn mức cho từng danh mục để theo dõi mức chi trong tháng.</p>
        </div>
    );
}

function BudgetList({ budgets, isDesktopMode, onSelect, selectedCategoryId, spendingDays }) {
    if (!budgets.length) {
        return <BudgetEmptyState />;
    }

    return (
        <div className="budget-page__list section-card">
            {budgets.map((budget) => (
                <BudgetRow
                    budget={budget}
                    isDesktopMode={isDesktopMode}
                    key={budget.id ?? budget.categoryId}
                    onSelect={onSelect}
                    selectedCategoryId={selectedCategoryId}
                    spendingDays={spendingDays}
                />
            ))}
        </div>
    );
}

function BudgetTip() {
    return (
        <aside className="budget-page__tip">
            <ExpenseIcon bare icon="tip" size={20} />
            <p><strong>Mẹo:</strong> Thiết lập ngân sách cho các danh mục chưa có ở trên để kiểm soát chi tiêu tốt hơn.</p>
        </aside>
    );
}

function DesktopBudgetEditor({
    budgets,
    categories,
    initialCategoryId,
    onCancel,
    onDelete,
    onSubmit,
    title,
}) {
    return (
        <section className="budget-page__editor section-card" aria-label={title}>
            <header className="budget-page__editor-header">
                <div>
                    <span>Thiết lập</span>
                    <h2>{title}</h2>
                </div>
                <button onClick={onCancel} type="button">
                    Đóng
                </button>
            </header>
            <BudgetForm
                key={initialCategoryId || "desktop-budget-form"}
                budgets={budgets}
                categories={categories}
                initialCategoryId={initialCategoryId}
                onCancel={onCancel}
                onDelete={onDelete}
                onSubmit={onSubmit}
            />
        </section>
    );
}

export default function BudgetPage({
    budgets = [],
    categories = [],
    initialCategoryId = "",
    mode = "mobile",
    monthKey,
    monthLabel,
    monthOptions,
    onBack,
    onCloseEditor,
    onCopyBudgets,
    onDeleteBudget,
    onSaveBudget,
}) {
    const expenseCategories = getExpenseCategories(categories);
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
    const [isFormOpen, setIsFormOpen] = useState(Boolean(initialCategoryId));
    const [isCopyOpen, setIsCopyOpen] = useState(false);
    const isDesktopMode = mode === "desktop";
    const PageElement = isDesktopMode ? "div" : "main";
    const pageClassName = isDesktopMode
        ? "budget-page budget-page--desktop"
        : "budget-page budget-page--mobile mobile-budget-page";
    const workspaceClassName =
        isDesktopMode && isFormOpen
            ? "budget-page__workspace budget-page__workspace--with-editor"
            : "budget-page__workspace";
    const totals = calculateMonthlyBudgetTotals(budgets);
    const { remainingDays, spendingDays } = getMonthTiming(monthKey);
    const hasCategoryWithoutBudget = expenseCategories.some(
        (category) => !budgets.some((budget) => budget.categoryId === category.id),
    );
    const editorTitle = getBudgetEditorTitle(budgets, selectedCategoryId);

    const closeForm = () => {
        setIsFormOpen(false);
        setSelectedCategoryId("");
        onCloseEditor?.();
    };

    const openCreateForm = () => {
        setSelectedCategoryId(getFirstEditableCategoryId(expenseCategories, budgets));
        setIsFormOpen(true);
    };

    const openEditForm = (categoryId) => {
        setSelectedCategoryId(categoryId);
        setIsFormOpen(true);
    };

    const handleSaveBudget = async (budget) => {
        await onSaveBudget?.(budget);
        closeForm();
    };

    const handleDeleteBudget = async (budget) => {
        await onDeleteBudget?.(budget);
        closeForm();
    };

    return (
        <PageElement className={pageClassName}>
            {!isDesktopMode ? <BudgetMobileHeader monthKey={monthKey} monthLabel={monthLabel} onBack={onBack} /> : null}

            {isDesktopMode ? (
                <>
                    <DesktopBudgetSummary remainingDays={remainingDays} totals={totals} />
                    <BudgetStatusOverview budgets={budgets} />
                </>
            ) : (
                <BudgetSummary budgetCount={budgets.length} totals={totals} />
            )}

            <div className={workspaceClassName}>
                <section className="budget-page__section">
                    <BudgetSectionHeading
                        budgetCount={budgets.length}
                        hasCategoryWithoutBudget={hasCategoryWithoutBudget}
                        isDesktopMode={isDesktopMode}
                        onCopy={onCopyBudgets && monthKey ? () => setIsCopyOpen(true) : undefined}
                        onCreate={openCreateForm}
                    />
                    <BudgetList
                        budgets={budgets}
                        isDesktopMode={isDesktopMode}
                        onSelect={openEditForm}
                        selectedCategoryId={selectedCategoryId}
                        spendingDays={spendingDays}
                    />
                </section>

                {isFormOpen && isDesktopMode ? (
                    <DesktopBudgetEditor
                        budgets={budgets}
                        categories={categories}
                        initialCategoryId={selectedCategoryId}
                        onCancel={closeForm}
                        onDelete={handleDeleteBudget}
                        onSubmit={handleSaveBudget}
                        title={editorTitle}
                    />
                ) : null}
            </div>

            {isDesktopMode ? <BudgetTip /> : null}

            {isCopyOpen ? (
                <CopyBudgetsForm
                    key={monthKey}
                    isDesktopMode={isDesktopMode}
                    monthKey={monthKey}
                    monthOptions={monthOptions}
                    onCancel={() => setIsCopyOpen(false)}
                    onCopy={onCopyBudgets}
                />
            ) : null}

            {isFormOpen && !isDesktopMode ? (
                <MobileBudgetFormSheet
                    budgets={budgets}
                    categories={categories}
                    initialCategoryId={selectedCategoryId}
                    onCancel={closeForm}
                    onDelete={handleDeleteBudget}
                    onSubmit={handleSaveBudget}
                />
            ) : null}

        </PageElement>
    );
}
