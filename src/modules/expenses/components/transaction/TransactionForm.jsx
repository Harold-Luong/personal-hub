import { useState } from "react";
import {
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

function getCategoryOptions(type, categories) {
    if (type === "transfer") {
        return fallbackCategoryOptions.transfer;
    }

    const typedCategories = categories.filter(
        (category) => (category.type ?? "expense") === type,
    );

    return typedCategories.length > 0 ? typedCategories : [];
}

export default function TransactionForm({
    categories = [],
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
    const [date, setDate] = useState(getLocalDateValue);
    const [time, setTime] = useState(getLocalTimeValue);
    const [note, setNote] = useState("");

    const categoryOptions = getCategoryOptions(type, categories);
    const selectedCategoryId = categoryOptions.some(
        (category) => category.id === categoryId,
    )
        ? categoryId
        : (categoryOptions[0]?.id ?? "");
    const selectedWalletId = wallets.some((wallet) => wallet.id === walletId)
        ? walletId
        : (wallets[0]?.id ?? "");

    const handleTypeChange = (nextType) => {
        const nextCategoryOptions = getCategoryOptions(nextType, categories);

        setType(nextType);
        setCategoryId(nextCategoryOptions[0]?.id ?? "");
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const numericAmount = parseCurrencyInput(amount);
        const selectedCategory = categoryOptions.find(
            (category) => category.id === selectedCategoryId,
        );

        if (
            !numericAmount ||
            !title.trim() ||
            !selectedCategory ||
            !selectedWalletId
        ) {
            return;
        }

        onSubmit?.({
            id: `tx-${Date.now()}`,
            amount: getSignedTransactionAmount(numericAmount, type),
            category: selectedCategory.id,
            date,
            icon: selectedCategory.icon,
            note: note.trim(),
            subtitle: time,
            time,
            title: title.trim(),
            type,
            walletId: selectedWalletId,
        });
    };

    return (
        <form className="transaction-form" onSubmit={handleSubmit}>
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

            <label className="transaction-form__amount section-card">
                <span>Số tiền</span>
                <span className="transaction-form__amount-control">
                    <input
                        autoFocus
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
            </label>

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

                <label className="transaction-form__field">
                    <span>Danh mục</span>
                    <select
                        name="category"
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

                <label className="transaction-form__field">
                    <span>Ví</span>
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
                        rows="3"
                        value={note}
                    />
                </label>
            </div>

            <button className="transaction-form__submit" type="submit">
                Lưu giao dịch
            </button>
        </form>
    );
}
