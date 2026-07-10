import { useState } from "react";
import { transactionTypes } from "../../constant/expensesMetaData";
import { expenseUiText } from "../../constant/expensesUiMetaData";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "../../utils/formatCurrency";
import { getLocalDateValue, getLocalTimeValue } from "../../utils/transactionFormUtils";
import ExpenseButton from "../shared/ExpenseButton";
import ExpenseDialog from "../shared/ExpenseDialog";
import ExpenseField from "../shared/ExpenseField";
import ExpenseStateMessage from "../shared/ExpenseStateMessage";

const defaultPaymentNote = "Thanh toán dư nợ thẻ";
const defaultPaymentTitle = "Thanh toán thẻ tín dụng";

function getCardDebt(card) {
    return card?.outstandingDebt ?? card?.outstandingBalance ?? 0;
}

function getSelectedWallet(sourceWallets, selectedWalletId) {
    return sourceWallets.find((wallet) => wallet.id === selectedWalletId) ?? sourceWallets[0];
}

export default function CreditCardPaymentDialog({
    card,
    initialWalletId,
    onCancel,
    onSubmit,
    sourceWallets = [],
}) {
    const cardDebt = getCardDebt(card);
    const [selectedWalletId, setSelectedWalletId] = useState(() => initialWalletId ?? sourceWallets[0]?.id ?? "");
    const [amount, setAmount] = useState(() => formatCurrencyInput(cardDebt));
    const [paymentDate, setPaymentDate] = useState(getLocalDateValue);
    const [note, setNote] = useState(defaultPaymentNote);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const selectedWallet = getSelectedWallet(sourceWallets, selectedWalletId);
    const resolvedWalletId = selectedWallet?.id ?? "";
    const numericAmount = parseCurrencyInput(amount);
    const nextSourceBalance = selectedWallet ? (selectedWallet.balance ?? 0) - numericAmount : 0;
    const nextDebt = Math.max(cardDebt - numericAmount, 0);

    const handleAmountChange = (nextAmount) => {
        setAmount(formatCurrencyInput(nextAmount));
        setSubmitError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!card?.id || !resolvedWalletId || !numericAmount || !paymentDate) {
            setSubmitError("Vui lòng nhập đủ thông tin thanh toán.");
            return;
        }

        if (numericAmount > cardDebt) {
            setSubmitError("Số tiền thanh toán không được lớn hơn dư nợ thẻ tín dụng.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await onSubmit?.({
                amount: numericAmount,
                categoryId: null,
                date: paymentDate,
                fromWalletId: resolvedWalletId,
                icon: "card",
                note: note.trim() || defaultPaymentNote,
                time: getLocalTimeValue(),
                title: defaultPaymentTitle,
                toWalletId: card.id,
                type: transactionTypes.CREDIT_PAYMENT,
                walletId: null,
            });
        } catch (error) {
            setSubmitError(error?.message || "Không thể thanh toán thẻ. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ExpenseDialog
            backdropClassName="credit-payment-dialog__backdrop"
            eyebrow="Thanh toán thẻ"
            headerClassName="credit-payment-dialog__header"
            headingId="credit-payment-dialog-title"
            onClose={onCancel}
            panelClassName="credit-payment-dialog"
            title={card?.name ?? "Thẻ tín dụng"}
        >
            <section className="credit-payment-dialog__card-summary">
                <span>Dư nợ hiện tại</span>
                <strong>{formatCurrency(cardDebt)}</strong>
            </section>

            <form className="credit-payment-dialog__form" onSubmit={handleSubmit}>
                    <ExpenseField label="Thanh toán từ">
                        <select
                            disabled={isSubmitting || sourceWallets.length === 0}
                            onChange={(event) => {
                                setSelectedWalletId(event.target.value);
                                setSubmitError("");
                            }}
                            value={resolvedWalletId}
                        >
                            {sourceWallets.map((wallet) => (
                                <option key={wallet.id} value={wallet.id}>
                                    {wallet.name}
                                </option>
                            ))}
                        </select>
                    </ExpenseField>

                    <ExpenseField label="Số tiền thanh toán">
                        <input
                            disabled={isSubmitting}
                            inputMode="numeric"
                            onChange={(event) => handleAmountChange(event.target.value)}
                            placeholder="0"
                            value={amount}
                        />
                    </ExpenseField>

                    <div className="credit-payment-dialog__quick-actions">
                        <span>Gợi ý nhanh</span>
                        <ExpenseButton
                            disabled={isSubmitting || !cardDebt}
                            label="Toàn bộ dư nợ"
                            onClick={() => handleAmountChange(cardDebt)}
                        />
                        <ExpenseButton
                            disabled={isSubmitting}
                            label="Số khác"
                            onClick={() => handleAmountChange("")}
                        />
                    </div>

                    <ExpenseField label="Ngày thanh toán">
                        <input
                            disabled={isSubmitting}
                            onChange={(event) => {
                                setPaymentDate(event.target.value);
                                setSubmitError("");
                            }}
                            type="date"
                            value={paymentDate}
                        />
                    </ExpenseField>

                    <ExpenseField label="Ghi chú">
                        <textarea
                            disabled={isSubmitting}
                            onChange={(event) => {
                                setNote(event.target.value);
                                setSubmitError("");
                            }}
                            placeholder={defaultPaymentNote}
                            rows="2"
                            value={note}
                        />
                    </ExpenseField>

                    <section className="credit-payment-dialog__preview">
                        <p>
                            <span>{selectedWallet?.name ?? "Ví nguồn"} sau thanh toán</span>
                            <strong>{formatCurrency(nextSourceBalance)}</strong>
                        </p>
                        <p>
                            <span>Dư nợ còn lại</span>
                            <strong>{formatCurrency(nextDebt)}</strong>
                        </p>
                    </section>

                    {submitError ? (
                        <ExpenseStateMessage
                            className="credit-payment-dialog__error"
                            message={submitError}
                        />
                    ) : null}

                    <footer className="credit-payment-dialog__actions">
                        <ExpenseButton
                            disabled={isSubmitting}
                            label={expenseUiText.actions.CANCEL}
                            onClick={onCancel}
                        />
                        <ExpenseButton
                            disabled={sourceWallets.length === 0}
                            isLoading={isSubmitting}
                            label="Thanh toán"
                            loadingLabel="Đang thanh toán..."
                            type="submit"
                        />
                    </footer>
            </form>
        </ExpenseDialog>
    );
}
