import { useState } from "react";
import MobileBudgetFormSheet from "../components/budget/MobileBudgetFormSheet";
import MobilePageHeader from "../components/mobile/MobilePageHeader";
import AmountText from "../components/shared/AmountText";
import ExpenseIcon from "../components/shared/ExpenseEmoji";
import ProgressBar from "../components/shared/ProgressBar";
import { budgetStatusColors, budgetStatusLabels } from "../constant/expensesMetaData";
import {
    calculateBudgetUsagePercentage,
    calculateMonthlyBudgetTotals,
    getBudgetUsageStatus,
} from "../utils/expenseCalculations";

function getExpenseCategories(categories) {
    return categories.filter((category) => (category.type ?? "expense") === "expense");
}

function getFirstEditableCategoryId(categories, budgets) {
    const budgetCategoryIds = new Set(budgets.map((budget) => budget.categoryId));
    const categoryWithoutBudget = categories.find((category) => !budgetCategoryIds.has(category.id));

    return categoryWithoutBudget?.id ?? budgets[0]?.categoryId ?? categories[0]?.id ?? "";
}

export default function BudgetPage({ budgets = [], categories = [], monthKey, onBack, onDeleteBudget, onSaveBudget }) {
    const expenseCategories = getExpenseCategories(categories);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const totals = calculateMonthlyBudgetTotals(budgets);
    const hasCategoryWithoutBudget = expenseCategories.some(
        (category) => !budgets.some((budget) => budget.categoryId === category.id),
    );
    const summaryStatus = getBudgetUsageStatus({
        amount: totals.spent,
        limit: totals.limit,
    });
    const summaryColor = budgetStatusColors[summaryStatus] ?? "var(--expense-active-strong)";
    const summaryProgress = `${Math.min(Math.max(totals.percentage, 0), 100)}%`;
    const remainingBudget = totals.limit - totals.spent;
    const hasBudgetLimit = totals.limit > 0;

    const closeForm = () => {
        setIsFormOpen(false);
        setSelectedCategoryId("");
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
        <main className="mobile-budget-page">
            <MobilePageHeader
                actions={
                    <button className="mobile-budget-page__header-action" onClick={onBack} type="button">
                        Tổng quan
                    </button>
                }
                className="mobile-budget-page__header"
                subtitle={monthKey}
                title="Ngân sách"
            />

            <section
                className={`mobile-budget-page__summary mobile-budget-page__summary--${summaryStatus}`}
                style={{ "--summary-progress": summaryProgress }}
            >
                <div className="mobile-budget-page__summary-top">
                    <div>
                        <span>Ngân sách tháng</span>
                        <strong>{budgetStatusLabels[summaryStatus]}</strong>
                    </div>
                    <span className="mobile-budget-page__summary-badge">{budgets.length} danh mục</span>
                </div>

                <div className="mobile-budget-page__summary-main">
                    <div className="mobile-budget-page__summary-ring">
                        <span>{totals.percentage}%</span>
                    </div>
                    <div className="mobile-budget-page__summary-copy">
                        <span>{remainingBudget >= 0 ? "Còn có thể chi" : "Đã vượt"}</span>
                        <strong>
                            <AmountText amount={Math.abs(remainingBudget)} />
                        </strong>
                        <small>
                            {hasBudgetLimit ? "Theo hạn mức đã đặt cho tháng này" : "Chưa có hạn mức để theo dõi"}
                        </small>
                    </div>
                </div>

                <ProgressBar color={summaryColor} max={totals.limit} value={totals.spent} />

                <div className="mobile-budget-page__summary-metrics">
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

            <section className="mobile-budget-page__section">
                <div className="mobile-budget-page__section-heading">
                    <div>
                        <h2>Danh mục ngân sách</h2>
                        <p>{budgets.length} hạn mức trong tháng này</p>
                    </div>
                    <button onClick={openCreateForm} type="button">
                        {hasCategoryWithoutBudget ? "Thêm" : "Sửa"}
                    </button>
                </div>

                {budgets.length ? (
                    <div className="mobile-budget-page__list section-card">
                        {budgets.map((budget) => {
                            const status = getBudgetUsageStatus(budget);
                            const statusColor = budgetStatusColors[status] ?? budget.color;

                            return (
                                <button
                                    className={`mobile-budget-item mobile-budget-item--${status}`}
                                    key={budget.id ?? budget.categoryId}
                                    onClick={() => openEditForm(budget.categoryId)}
                                    type="button"
                                >
                                    <ExpenseIcon
                                        appearance="emoji"
                                        color={budget.color}
                                        icon={budget.icon}
                                        label={budget.category}
                                    />
                                    <span className="mobile-budget-item__body">
                                        <span className="mobile-budget-item__copy">
                                            <strong>{budget.category}</strong>
                                            <span>
                                                <AmountText amount={budget.amount} />
                                                <small> / </small>
                                                <AmountText amount={budget.limit} />
                                            </span>
                                        </span>
                                        <ProgressBar color={statusColor} max={budget.limit} value={budget.amount} />
                                    </span>
                                    <span className="mobile-budget-item__percentage">
                                        {calculateBudgetUsagePercentage(budget)}%
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mobile-budget-page__empty section-card">
                        <strong>Chưa có ngân sách</strong>
                        <p>Đặt hạn mức cho từng danh mục để theo dõi mức chi trong tháng.</p>
                        <button onClick={openCreateForm} type="button">
                            Tạo ngân sách
                        </button>
                    </div>
                )}
            </section>

            {isFormOpen ? (
                <MobileBudgetFormSheet
                    budgets={budgets}
                    categories={categories}
                    initialCategoryId={selectedCategoryId}
                    onCancel={closeForm}
                    onDelete={handleDeleteBudget}
                    onSubmit={handleSaveBudget}
                />
            ) : null}
        </main>
    );
}
