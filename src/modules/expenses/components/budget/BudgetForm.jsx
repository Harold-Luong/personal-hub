import { useState } from "react";
import { formatCurrencyInput, parseCurrencyInput } from "../../utils/formatCurrency";

function getExpenseCategories(categories) {
    return categories.filter((category) => (category.type ?? "expense") === "expense");
}

function getInitialCategoryId(categories, budgets, preferredCategoryId) {
    if (categories.some((category) => category.id === preferredCategoryId)) {
        return preferredCategoryId;
    }

    const budgetCategoryIds = new Set(budgets.map((budget) => budget.categoryId));
    const categoryWithoutBudget = categories.find((category) => !budgetCategoryIds.has(category.id));

    if (categoryWithoutBudget) {
        return categoryWithoutBudget.id;
    }

    const budgetCategory = budgets.find((budget) => categories.some((category) => category.id === budget.categoryId));

    return budgetCategory?.categoryId ?? categories[0]?.id ?? "";
}

function getBudgetForCategory(budgets, categoryId) {
    return budgets.find((budget) => budget.categoryId === categoryId);
}

function getCategoryName(categories, categoryId) {
    return categories.find((category) => category.id === categoryId)?.name ?? "danh mục này";
}

export default function BudgetForm({
    budgets = [],
    categories = [],
    initialCategoryId: preferredCategoryId,
    onCancel,
    onDelete,
    onSubmit,
}) {
    const expenseCategories = getExpenseCategories(categories);
    const initialCategoryId = getInitialCategoryId(expenseCategories, budgets, preferredCategoryId);
    const initialBudget = getBudgetForCategory(budgets, initialCategoryId);
    const [categoryId, setCategoryId] = useState(initialCategoryId);
    const [limit, setLimit] = useState(() => (initialBudget?.limit ? formatCurrencyInput(initialBudget.limit) : ""));
    const [alertThreshold, setAlertThreshold] = useState(String(initialBudget?.alertThreshold ?? 80));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const selectedBudget = getBudgetForCategory(budgets, categoryId);
    const selectedCategoryName = selectedBudget?.category ?? getCategoryName(expenseCategories, categoryId);
    const isEditing = Boolean(selectedBudget);
    const hasCategories = expenseCategories.length > 0;
    const isWorking = isSubmitting || isDeleting;

    const handleCategoryChange = (event) => {
        const nextCategoryId = event.target.value;
        const nextBudget = getBudgetForCategory(budgets, nextCategoryId);

        setCategoryId(nextCategoryId);
        setLimit(nextBudget?.limit ? formatCurrencyInput(nextBudget.limit) : "");
        setAlertThreshold(String(nextBudget?.alertThreshold ?? 80));
        setSubmitError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const limitMinor = parseCurrencyInput(limit);
        const thresholdValue = Number(alertThreshold);

        if (!categoryId || !limitMinor || thresholdValue < 1 || thresholdValue > 100) {
            setSubmitError("Vui lòng nhập đủ hạn mức và ngưỡng cảnh báo hợp lệ.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await onSubmit?.({
                alertThreshold: Math.round(thresholdValue),
                categoryId,
                limitMinor,
            });
        } catch {
            setSubmitError("Không thể lưu ngân sách. Vui lòng kiểm tra kết nối và thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBudget) {
            return;
        }

        const shouldDelete = window.confirm(`Xóa ngân sách cho "${selectedCategoryName}"?`);

        if (!shouldDelete) {
            return;
        }

        setIsDeleting(true);
        setSubmitError("");

        try {
            await onDelete?.({
                categoryId: selectedBudget.categoryId,
            });
        } catch {
            setSubmitError("Không thể xóa ngân sách. Vui lòng kiểm tra kết nối và thử lại.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <form className="budget-form" onSubmit={handleSubmit}>
            <div className="budget-form__content">
                <label className="budget-form__field">
                    <span>Danh mục</span>
                    {isEditing ? (
                        <input
                            name="categoryName"
                            readOnly
                            type="text"
                            value={selectedCategoryName}
                        />
                    ) : (
                        <select
                            disabled={!hasCategories || isWorking}
                            name="categoryId"
                            onChange={handleCategoryChange}
                            required
                            value={categoryId}
                        >
                            {expenseCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    )}
                </label>

                <label className="budget-form__field budget-form__field--amount">
                    <span>Hạn mức tháng</span>
                    <span className="budget-form__amount-control">
                        <input
                            autoFocus
                            disabled={isWorking}
                            inputMode="numeric"
                            name="limit"
                            onChange={(event) => setLimit(formatCurrencyInput(event.target.value))}
                            placeholder="0"
                            required
                            type="text"
                            value={limit}
                        />
                        <span aria-hidden="true">₫</span>
                    </span>
                </label>

                <label className="budget-form__field">
                    <span>Ngưỡng cảnh báo (%)</span>
                    <input
                        disabled={isWorking}
                        max="100"
                        min="1"
                        name="alertThreshold"
                        onChange={(event) => setAlertThreshold(event.target.value)}
                        required
                        type="number"
                        value={alertThreshold}
                    />
                </label>

                <p className="budget-form__hint">
                    {isEditing
                        ? "Danh mục này đã có ngân sách. Lưu sẽ cập nhật hạn mức hiện tại."
                        : "Ngân sách là hạn mức đặt trước cho một danh mục trong tháng hiện tại."}
                </p>

                {submitError ? <p className="budget-form__error">{submitError}</p> : null}
            </div>

            <div className="budget-form__actions">
                {isEditing ? (
                    <button className="budget-form__delete" disabled={isWorking} onClick={handleDelete} type="button">
                        {isDeleting ? "Đang xóa..." : "Xóa ngân sách"}
                    </button>
                ) : null}
                <button className="budget-form__cancel" disabled={isWorking} onClick={onCancel} type="button">
                    Hủy
                </button>
                <button className="budget-form__submit" disabled={isWorking || !hasCategories} type="submit">
                    {isSubmitting ? "Đang lưu..." : "Lưu ngân sách"}
                </button>
            </div>
        </form>
    );
}
