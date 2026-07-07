import { useState } from "react";
import BudgetForm from "../components/budget/BudgetForm";
import MobileBudgetFormSheet from "../components/budget/MobileBudgetFormSheet";
import MobilePageHeader from "../components/mobile/MobilePageHeader";
import AmountText from "../components/shared/AmountText";
import ExpenseIcon from "../components/shared/ExpenseEmoji";
import ProgressBar from "../components/shared/ProgressBar";
import { budgetStatusColors, budgetStatusLabels } from "../constant/expensesMetaData";
import { ChevronIcon } from "../icon/ExpenseIcons";
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

function getBudgetRowMeta(budget, selectedCategoryId) {
    const status = getBudgetUsageStatus(budget);

    return {
        isSelected: selectedCategoryId === budget.categoryId,
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
        remaining: totals.limit - totals.spent,
        status,
        statusColor: budgetStatusColors[status] ?? DEFAULT_BUDGET_COLOR,
    };
}

function BudgetMobileHeader({ monthKey, monthLabel, onBack }) {
    return (
        <MobilePageHeader
            actions={
                <button className="mobile-budget-page__header-action" onClick={onBack} type="button">
                    Tổng quan
                </button>
            }
            className="mobile-budget-page__header"
            subtitle={monthLabel ?? monthKey}
            title="Ngân sách"
        />
    );
}

function BudgetSummary({ budgetCount, totals }) {
    const { hasBudgetLimit, progress, remaining, status, statusColor } = getSummaryMeta(totals);

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
                    <span>{remaining >= 0 ? "Còn có thể chi" : "Đã vượt"}</span>
                    <strong>
                        <AmountText amount={Math.abs(remaining)} />
                    </strong>
                    <small>{hasBudgetLimit ? "Theo hạn mức đã đặt cho tháng này" : "Chưa có hạn mức để theo dõi"}</small>
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

function BudgetSectionHeading({ budgetCount, hasCategoryWithoutBudget, onCreate }) {
    return (
        <div className="budget-page__section-heading">
            <div>
                <h2>Danh mục ngân sách</h2>
                <p>{budgetCount} hạn mức trong tháng này</p>
            </div>
            <button onClick={onCreate} type="button">
                {hasCategoryWithoutBudget ? "Thêm" : "Sửa"}
            </button>
        </div>
    );
}

function BudgetRowIcon({ budget }) {
    return <ExpenseIcon appearance="emoji" color={budget.color} icon={budget.icon} label={budget.category} />;
}

function DesktopBudgetRow({ budget, isSelected, onSelect, status, statusColor, usagePercentage }) {
    return (
        <button
            aria-label={`Sửa ngân sách ${budget.category}`}
            aria-pressed={isSelected}
            className={`budget-item-row budget-item-row--${status}${isSelected ? " is-selected" : ""}`}
            onClick={() => onSelect(budget.categoryId)}
            style={{ "--budget-color": budget.color }}
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
                    <span>{usagePercentage}% ngân sách</span>
                </div>
                <ProgressBar color={statusColor} max={budget.limit} value={budget.amount} />
                <div className="budget-item-row__footer">
                    <span className="budget-item-row__amounts">
                        Đã chi <AmountText amount={budget.amount} />
                    </span>
                    <strong className="budget-item-row__limit">
                        <AmountText amount={budget.limit} />
                    </strong>
                </div>
            </div>
            <span className="budget-item-row__chevron" aria-hidden="true">
                <ChevronIcon size={20} />
            </span>
        </button>
    );
}

function MobileBudgetRow({ budget, isSelected, onSelect, status, statusColor, usagePercentage }) {
    const rowClassName = `budget-item-row budget-item-row--compact budget-item-row--${status}${
        isSelected ? " is-selected" : ""
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
                </span>
                <ProgressBar color={statusColor} max={budget.limit} value={budget.amount} />
            </span>
            <span className="budget-item-row__percentage">{usagePercentage}%</span>
        </button>
    );
}

function BudgetRow({ budget, isDesktopMode, onSelect, selectedCategoryId }) {
    const rowMeta = getBudgetRowMeta(budget, selectedCategoryId);
    const RowComponent = isDesktopMode ? DesktopBudgetRow : MobileBudgetRow;

    return <RowComponent budget={budget} onSelect={onSelect} {...rowMeta} />;
}

function BudgetEmptyState({ onCreate }) {
    return (
        <div className="budget-page__empty section-card">
            <strong>Chưa có ngân sách</strong>
            <p>Đặt hạn mức cho từng danh mục để theo dõi mức chi trong tháng.</p>
            <button onClick={onCreate} type="button">
                Tạo ngân sách
            </button>
        </div>
    );
}

function BudgetList({ budgets, isDesktopMode, onCreate, onSelect, selectedCategoryId }) {
    if (!budgets.length) {
        return <BudgetEmptyState onCreate={onCreate} />;
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
                />
            ))}
        </div>
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
    onBack,
    onCloseEditor,
    onDeleteBudget,
    onSaveBudget,
}) {
    const expenseCategories = getExpenseCategories(categories);
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
    const [isFormOpen, setIsFormOpen] = useState(Boolean(initialCategoryId));
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

            <BudgetSummary budgetCount={budgets.length} totals={totals} />

            <div className={workspaceClassName}>
                <section className="budget-page__section">
                    <BudgetSectionHeading
                        budgetCount={budgets.length}
                        hasCategoryWithoutBudget={hasCategoryWithoutBudget}
                        onCreate={openCreateForm}
                    />
                    <BudgetList
                        budgets={budgets}
                        isDesktopMode={isDesktopMode}
                        onCreate={openCreateForm}
                        onSelect={openEditForm}
                        selectedCategoryId={selectedCategoryId}
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
