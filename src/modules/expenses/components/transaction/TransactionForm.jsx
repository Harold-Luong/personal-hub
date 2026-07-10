import { useState } from "react";
import {
    creditCardWalletTypeId,
    expenseWeekdayLabels,
    transactionFallbackCategoryOptions,
    transactionTypeOptions,
    transactionTypes,
} from "../../constant/expensesMetaData";
import { expenseUiText } from "../../constant/expensesUiMetaData";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "../../utils/formatCurrency";
import { getSignedTransactionAmount } from "../../utils/expenseCalculations";
import { getLocalDateValue, getLocalTimeValue } from "../../utils/transactionFormUtils";
import { getWalletDisplayName } from "../../utils/walletDisplayUtils";
import ExpenseButton from "../shared/ExpenseButton";
import ExpenseField from "../shared/ExpenseField";
import ExpenseStateMessage from "../shared/ExpenseStateMessage";
import SectionCard from "../shared/SectionCard";

function getCategoryOptions(type, categories) {
    if (type === transactionTypes.TRANSFER) {
        return transactionFallbackCategoryOptions[transactionTypes.TRANSFER];
    }

    const typedCategories = categories.filter(
        (category) => (category.type ?? transactionTypes.EXPENSE) === type,
    );

    return typedCategories.length > 0 ? typedCategories : [];
}

function isCreditCardWallet(wallet) {
    return wallet?.type === creditCardWalletTypeId;
}

function getWalletOptions(type, wallets) {
    if (type === transactionTypes.EXPENSE) {
        return wallets;
    }

    return wallets.filter((wallet) => !isCreditCardWallet(wallet));
}

function getTransactionSubtitle(date, time) {
    const dateValue = new Date(`${date}T00:00:00`);

    if (Number.isNaN(dateValue.getTime())) {
        return time;
    }

    const day = String(dateValue.getDate()).padStart(2, "0");
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const dateLabel = `${expenseWeekdayLabels[dateValue.getDay()]}, ${day}/${month}`;

    return [time, dateLabel].filter(Boolean).join(" ");
}

export default function TransactionForm({
    categories = [],
    initialTransaction,
    onCancel,
    onSubmit,
    submitLabel = "Lưu giao dịch",
    wallets = [],
}) {
    const initialType = initialTransaction?.type ?? transactionTypes.EXPENSE;
    const [type, setType] = useState(initialType);
    const [amount, setAmount] = useState(() =>
        initialTransaction ? formatCurrencyInput(initialTransaction.amountMinor ?? Math.abs(initialTransaction.amount)) : "",
    );
    const [title, setTitle] = useState(initialTransaction?.title ?? "");
    const [categoryId, setCategoryId] = useState(
        () => initialTransaction?.categoryId ?? initialTransaction?.category ?? getCategoryOptions(initialType, categories)[0]?.id ?? "",
    );
    const [walletId, setWalletId] = useState(initialTransaction?.walletId ?? initialTransaction?.fromWalletId ?? wallets[0]?.id ?? "");
    const [toWalletId, setToWalletId] = useState(initialTransaction?.toWalletId ?? wallets[1]?.id ?? "");
    const [date, setDate] = useState(initialTransaction?.date ?? getLocalDateValue);
    const [time, setTime] = useState(initialTransaction?.time ?? getLocalTimeValue);
    const [note, setNote] = useState(initialTransaction?.note ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const categoryOptions = getCategoryOptions(type, categories);
    const walletOptions = getWalletOptions(type, wallets);
    const isTransfer = type === transactionTypes.TRANSFER;
    const selectedCategoryId = categoryOptions.some((category) => category.id === categoryId)
        ? categoryId
        : (categoryOptions[0]?.id ?? "");
    const selectedWalletId = walletOptions.some((wallet) => wallet.id === walletId)
        ? walletId
        : (walletOptions[0]?.id ?? "");
    const selectedToWalletId = walletOptions.some((wallet) => wallet.id === toWalletId && wallet.id !== selectedWalletId)
        ? toWalletId
        : (walletOptions.find((wallet) => wallet.id !== selectedWalletId)?.id ?? "");
    const selectedTransactionType = transactionTypeOptions.find((transactionType) => transactionType.id === type);
    const selectedWallet = walletOptions.find((wallet) => wallet.id === selectedWalletId);
    const isSelectedCreditCard =
        type === transactionTypes.EXPENSE && isCreditCardWallet(selectedWallet);
    const isSelectedBalanceTemporary = Boolean(
        selectedWallet && !isSelectedCreditCard && !selectedWallet.isBalanceInitialized,
    );
    const numericAmount = parseCurrencyInput(amount);
    const currentWalletBalance = isSelectedCreditCard
        ? (selectedWallet?.outstandingDebt ?? 0)
        : (selectedWallet?.balance ?? 0);
    const previewBalance = isSelectedCreditCard
        ? currentWalletBalance + numericAmount
        : currentWalletBalance + getSignedTransactionAmount(numericAmount, type);
    const previewAvailableCredit = isSelectedCreditCard
        ? (selectedWallet?.availableCredit ?? 0) - numericAmount
        : null;

    const handleTypeChange = (nextType) => {
        const nextCategoryOptions = getCategoryOptions(nextType, categories);

        setType(nextType);
        setCategoryId(nextCategoryOptions[0]?.id ?? "");
        setSubmitError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const numericAmount = parseCurrencyInput(amount);
        const selectedCategory = categoryOptions.find((category) => category.id === selectedCategoryId);

        if (
            !numericAmount ||
            !title.trim() ||
            !selectedWalletId ||
            (!isTransfer && !selectedCategory) ||
            (isTransfer && (!selectedToWalletId || selectedToWalletId === selectedWalletId))
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
            setSubmitError("Không thể lưu giao dịch. Vui lòng kiểm tra kết nối và thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="transaction-form" onSubmit={handleSubmit}>
            <div className="transaction-form__content">
                <div aria-label="Loại giao dịch" className="transaction-form__type" role="group">
                    {transactionTypeOptions.map((transactionType) => (
                        <ExpenseButton
                            aria-pressed={type === transactionType.id}
                            className={type === transactionType.id ? "is-active" : ""}
                            key={transactionType.id}
                            label={transactionType.label}
                            onClick={() => handleTypeChange(transactionType.id)}
                        />
                    ))}
                </div>

                <SectionCard actionLabel={null} as="div" className="transaction-form__amount">
                    <ExpenseField
                        className="transaction-form__amount-label"
                        htmlFor="transaction-amount"
                        label="Số tiền"
                    />
                    <span className="transaction-form__amount-control">
                        <input
                            autoFocus
                            id="transaction-amount"
                            inputMode="numeric"
                            name="amount"
                            onChange={(event) => setAmount(formatCurrencyInput(event.target.value))}
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
                            <dt>{isTransfer ? "Ví chuyển" : "Ví"}</dt>
                            <dd>{getWalletDisplayName(selectedWallet) || "-"}</dd>
                        </div>
                        <div>
                            <dt>
                                {isSelectedCreditCard
                                    ? "Dư nợ hiện tại"
                                    : isSelectedBalanceTemporary
                                        ? "Số dư tạm tính"
                                        : "Số dư hiện tại"}
                            </dt>
                            <dd>{formatCurrency(currentWalletBalance)}</dd>
                        </div>
                        <div>
                            <dt>{isSelectedCreditCard ? "Dư nợ sau giao dịch" : "Số dư sau giao dịch"}</dt>
                            <dd className={previewBalance < 0 ? "is-negative" : "is-positive"}>
                                {formatCurrency(previewBalance)}
                            </dd>
                        </div>
                        {isSelectedCreditCard ? (
                            <div>
                                <dt>Hạn mức còn lại</dt>
                                <dd className={previewAvailableCredit < 0 ? "is-negative" : "is-positive"}>
                                    {formatCurrency(previewAvailableCredit)}
                                </dd>
                            </div>
                        ) : null}
                    </dl>
                </SectionCard>

                <SectionCard actionLabel={null} as="div" className="transaction-form__fields">
                    <ExpenseField className="transaction-form__field" label="Tên giao dịch">
                        <input
                            name="title"
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Ví dụ: Ăn trưa"
                            required
                            type="text"
                            value={title}
                        />
                    </ExpenseField>

                    {type !== transactionTypes.TRANSFER ? (
                        <ExpenseField className="transaction-form__field" label="Danh mục">
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
                        </ExpenseField>
                    ) : null}

                    <ExpenseField
                        className="transaction-form__field"
                        label={type === transactionTypes.TRANSFER ? "Ví chuyển" : "Ví"}
                    >
                        <select
                            name="wallet"
                            onChange={(event) => setWalletId(event.target.value)}
                            required
                            value={selectedWalletId}
                        >
                            {walletOptions.map((wallet) => (
                                <option key={wallet.id} value={wallet.id}>
                                    {getWalletDisplayName(wallet)}
                                </option>
                            ))}
                        </select>
                    </ExpenseField>

                    {type === transactionTypes.TRANSFER ? (
                        <ExpenseField className="transaction-form__field" label="Ví nhận">
                            <select
                                name="toWallet"
                                onChange={(event) => setToWalletId(event.target.value)}
                                required
                                value={selectedToWalletId}
                            >
                                {walletOptions
                                    .filter((wallet) => wallet.id !== selectedWalletId)
                                    .map((wallet) => (
                                        <option key={wallet.id} value={wallet.id}>
                                            {getWalletDisplayName(wallet)}
                                        </option>
                                    ))}
                            </select>
                        </ExpenseField>
                    ) : null}

                    <div className="transaction-form__field-row">
                        <ExpenseField className="transaction-form__field" label="Ngày">
                            <input
                                name="date"
                                onChange={(event) => setDate(event.target.value)}
                                required
                                type="date"
                                value={date}
                            />
                        </ExpenseField>
                        <ExpenseField className="transaction-form__field" label="Giờ">
                            <input
                                name="time"
                                onChange={(event) => setTime(event.target.value)}
                                required
                                type="time"
                                value={time}
                            />
                        </ExpenseField>
                    </div>

                    <ExpenseField className="transaction-form__field" label="Ghi chú">
                        <textarea
                            name="note"
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Thêm ghi chú (không bắt buộc)"
                            rows="2"
                            value={note}
                        />
                    </ExpenseField>
                </SectionCard>

                {submitError ? (
                    <ExpenseStateMessage
                        className="transaction-form__error"
                        message={submitError}
                    />
                ) : null}
            </div>

            <div className="transaction-form__actions">
                <div className="transaction-form__action-buttons">
                    {onCancel ? (
                        <ExpenseButton
                            className="transaction-form__cancel"
                            label={expenseUiText.actions.CANCEL}
                            onClick={onCancel}
                        />
                    ) : null}
                    <ExpenseButton
                        className="transaction-form__submit"
                        isLoading={isSubmitting}
                        label={submitLabel}
                        loadingLabel={expenseUiText.actions.SAVING}
                        type="submit"
                    />
                </div>
            </div>
        </form>
    );
}
