import { useState } from "react";
import {
    formatCurrency,
    formatCurrencyInput,
    parseCurrencyInput,
} from "../../utils/formatCurrency";
import { getSignedTransactionAmount } from "../../utils/expenseCalculations";
import {
    getLocalDateValue,
    getLocalTimeValue,
} from "../../utils/transactionFormUtils";

const transactionTypes = [
    { id: "expense", label: "Chi tiêu" },
    { id: "income", label: "Thu nhập" },
    { id: "transfer", label: "Chuyển khoản" },
];

const fallbackCategoryOptions = {
    transfer: [{ id: "transfer", name: "Chuyển khoản", icon: "transfer" }],
};
const weekdays = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
];

function getCategoryOptions(type, categories) {
    if (type === "transfer") {
        return fallbackCategoryOptions.transfer;
    }

    const typedCategories = categories.filter(
        (category) => (category.type ?? "expense") === type,
    );

    return typedCategories.length > 0 ? typedCategories : [];
}

function getTransactionSubtitle(date, time) {
    const dateValue = new Date(`${date}T00:00:00`);

    if (Number.isNaN(dateValue.getTime())) {
        return time;
    }

    const day = String(dateValue.getDate()).padStart(2, "0");
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const dateLabel = `${weekdays[dateValue.getDay()]}, ${day}/${month}`;

    return [time, dateLabel].filter(Boolean).join(" ");
}

export default function TransactionForm({
    categories = [],
    onCancel,
    onSubmit,
    wallets = [],
}) {
    const [type, setType] = useState("expense");
    const [amount, setAmount] = useState("");
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState(
        () => getCategoryOptions("expense", categories)[0]?.id ?? "",
    );
    const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
    const [toWalletId, setToWalletId] = useState(wallets[1]?.id ?? "");
    const [date, setDate] = useState(getLocalDateValue);
    const [time, setTime] = useState(getLocalTimeValue);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const categoryOptions = getCategoryOptions(type, categories);
    const selectedCategoryId = categoryOptions.some(
        (category) => category.id === categoryId,
    )
        ? categoryId
        : (categoryOptions[0]?.id ?? "");
    const selectedWalletId = wallets.some((wallet) => wallet.id === walletId)
        ? walletId
        : (wallets[0]?.id ?? "");
    const selectedToWalletId = wallets.some(
        (wallet) => wallet.id === toWalletId && wallet.id !== selectedWalletId,
    )
        ? toWalletId
        : (wallets.find((wallet) => wallet.id !== selectedWalletId)?.id ?? "");
    const selectedTransactionType = transactionTypes.find(
        (transactionType) => transactionType.id === type,
    );
    const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId);
    const numericAmount = parseCurrencyInput(amount);
    const currentWalletBalance = selectedWallet?.balance ?? 0;
    const previewBalance = currentWalletBalance
        + getSignedTransactionAmount(numericAmount, type);

    const handleTypeChange = (nextType) => {
        const nextCategoryOptions = getCategoryOptions(nextType, categories);

        setType(nextType);
        setCategoryId(nextCategoryOptions[0]?.id ?? "");
        setSubmitError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const numericAmount = parseCurrencyInput(amount);
        const selectedCategory = categoryOptions.find(
            (category) => category.id === selectedCategoryId,
        );
        const isTransfer = type === "transfer";

        if (
            !numericAmount ||
            !title.trim() ||
            !selectedWalletId ||
            (!isTransfer && !selectedCategory) ||
            (isTransfer
                && (!selectedToWalletId
                    || selectedToWalletId === selectedWalletId))
        ) {
            setSubmitError("Vui lòng nhập đủ thông tin giao dịch.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await onSubmit?.({
                amount: getSignedTransactionAmount(numericAmount, type),
                categoryId: isTransfer ? null : selectedCategory.id,
                date,
                fromWalletId: isTransfer ? selectedWalletId : null,
                icon: isTransfer ? "transfer" : selectedCategory.icon,
                note: note.trim(),
                subtitle: getTransactionSubtitle(date, time),
                time,
                title: title.trim(),
                toWalletId: isTransfer ? selectedToWalletId : null,
                type,
                walletId: isTransfer ? null : selectedWalletId,
            });
        } catch {
            setSubmitError(
                "Không thể lưu giao dịch. Vui lòng kiểm tra kết nối và thử lại.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="transaction-form" onSubmit={handleSubmit}>
            <div className="transaction-form__content">
                <div
                    aria-label="Loại giao dịch"
                    className="transaction-form__type"
                    role="group"
                >
                    {transactionTypes.map((transactionType) => (
                        <button
                            aria-pressed={type === transactionType.id}
                            className={
                                type === transactionType.id ? "is-active" : ""
                            }
                            key={transactionType.id}
                            onClick={() => handleTypeChange(transactionType.id)}
                            type="button"
                        >
                            {transactionType.label}
                        </button>
                    ))}
                </div>

                <div className="transaction-form__amount section-card">
                    <label
                        className="transaction-form__amount-label"
                        htmlFor="transaction-amount"
                    >
                        Số tiền
                    </label>
                    <span className="transaction-form__amount-control">
                        <input
                            autoFocus
                            id="transaction-amount"
                            inputMode="numeric"
                            name="amount"
                            onChange={(event) =>
                                setAmount(formatCurrencyInput(event.target.value))
                            }
                            placeholder="0"
                            required
                            type="text"
                            value={amount}
                        />
                        <span aria-hidden="true">₫</span>
                    </span>
                    <dl className="transaction-form__balance-preview">
                        <div>
                            <dt>Loại giao dịch</dt>
                            <dd>{selectedTransactionType?.label ?? "-"}</dd>
                        </div>
                        <div>
                            <dt>Ví</dt>
                            <dd>{selectedWallet?.name ?? "-"}</dd>
                        </div>
                        <div>
                            <dt>Số dư hiện tại</dt>
                            <dd>{formatCurrency(currentWalletBalance)}</dd>
                        </div>
                        <div>
                            <dt>Số dư sau giao dịch</dt>
                            <dd
                                className={
                                    previewBalance < 0
                                        ? "is-negative"
                                        : "is-positive"
                                }
                            >
                                {formatCurrency(previewBalance)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="transaction-form__fields section-card">
                    <label className="transaction-form__field">
                        <span>Tên giao dịch</span>
                        <input
                            name="title"
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Ví dụ: Ăn trưa"
                            required
                            type="text"
                            value={title}
                        />
                    </label>

                    {type !== "transfer" ? (
                        <label className="transaction-form__field">
                            <span>Danh mục</span>
                            <select
                                name="categoryId"
                                onChange={(event) => setCategoryId(event.target.value)}
                                required
                                value={selectedCategoryId}
                            >
                                {categoryOptions.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : null}

                    <label className="transaction-form__field">
                        <span>{type === "transfer" ? "Ví chuyển" : "Ví"}</span>
                        <select
                            name="wallet"
                            onChange={(event) => setWalletId(event.target.value)}
                            required
                            value={selectedWalletId}
                        >
                            {wallets.map((wallet) => (
                                <option key={wallet.id} value={wallet.id}>
                                    {wallet.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {type === "transfer" ? (
                        <label className="transaction-form__field">
                            <span>Ví nhận</span>
                            <select
                                name="toWallet"
                                onChange={(event) => setToWalletId(event.target.value)}
                                required
                                value={selectedToWalletId}
                            >
                                {wallets
                                    .filter((wallet) => wallet.id !== selectedWalletId)
                                    .map((wallet) => (
                                        <option key={wallet.id} value={wallet.id}>
                                            {wallet.name}
                                        </option>
                                    ))}
                            </select>
                        </label>
                    ) : null}

                    <div className="transaction-form__field-row">
                        <label className="transaction-form__field">
                            <span>Ngày</span>
                            <input
                                name="date"
                                onChange={(event) => setDate(event.target.value)}
                                required
                                type="date"
                                value={date}
                            />
                        </label>
                        <label className="transaction-form__field">
                            <span>Giờ</span>
                            <input
                                name="time"
                                onChange={(event) => setTime(event.target.value)}
                                required
                                type="time"
                                value={time}
                            />
                        </label>
                    </div>

                    <label className="transaction-form__field">
                        <span>Ghi chú</span>
                        <textarea
                            name="note"
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Thêm ghi chú (không bắt buộc)"
                            rows="2"
                            value={note}
                        />
                    </label>
                </div>

                {submitError ? (
                    <p className="transaction-form__error">{submitError}</p>
                ) : null}
            </div>

            <div className="transaction-form__actions">
                <div className="transaction-form__action-buttons">
                    {onCancel ? (
                        <button
                            className="transaction-form__cancel"
                            onClick={onCancel}
                            type="button"
                        >
                            Hủy
                        </button>
                    ) : null}
                    <button
                        className="transaction-form__submit"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? "Đang lưu..." : "Lưu giao dịch"}
                    </button>
                </div>
            </div>
        </form>
    );
}
