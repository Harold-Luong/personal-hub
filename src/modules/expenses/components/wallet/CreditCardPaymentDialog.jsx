import { useEffect, useState } from "react";
import { creditPaymentTransactionTypeId } from "../../constant/expensesMetaData";
import { XIcon } from "../../icon/ExpenseIcons";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "../../utils/formatCurrency";
import { getLocalDateValue, getLocalTimeValue } from "../../utils/transactionFormUtils";

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

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onCancel?.();
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onCancel]);

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
                type: creditPaymentTransactionTypeId,
                walletId: null,
            });
        } catch (error) {
            setSubmitError(error?.message || "Không thể thanh toán thẻ. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section
            aria-labelledby="credit-payment-dialog-title"
            aria-modal="true"
            className="credit-payment-dialog__backdrop"
            role="dialog"
        >
            <div className="credit-payment-dialog">
                <header className="credit-payment-dialog__header">
                    <div>
                        <p>Thanh toán thẻ</p>
                        <h2 id="credit-payment-dialog-title">{card?.name ?? "Thẻ tín dụng"}</h2>
                    </div>
                    <button aria-label="Đóng" onClick={onCancel} type="button">
                        <XIcon size={18} />
                    </button>
                </header>

                <section className="credit-payment-dialog__card-summary">
                    <span>Dư nợ hiện tại</span>
                    <strong>{formatCurrency(cardDebt)}</strong>
                </section>

                <form className="credit-payment-dialog__form" onSubmit={handleSubmit}>
                    <label>
                        <span>Thanh toán từ</span>
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
                    </label>

                    <label>
                        <span>Số tiền thanh toán</span>
                        <input
                            disabled={isSubmitting}
                            inputMode="numeric"
                            onChange={(event) => handleAmountChange(event.target.value)}
                            placeholder="0"
                            value={amount}
                        />
                    </label>

                    <div className="credit-payment-dialog__quick-actions">
                        <span>Gợi ý nhanh</span>
                        <button
                            disabled={isSubmitting || !cardDebt}
                            onClick={() => handleAmountChange(cardDebt)}
                            type="button"
                        >
                            Toàn bộ dư nợ
                        </button>
                        <button disabled={isSubmitting} onClick={() => handleAmountChange("")} type="button">
                            Số khác
                        </button>
                    </div>

                    <label>
                        <span>Ngày thanh toán</span>
                        <input
                            disabled={isSubmitting}
                            onChange={(event) => {
                                setPaymentDate(event.target.value);
                                setSubmitError("");
                            }}
                            type="date"
                            value={paymentDate}
                        />
                    </label>

                    <label>
                        <span>Ghi chú</span>
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
                    </label>

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

                    {submitError ? <p className="credit-payment-dialog__error">{submitError}</p> : null}

                    <footer className="credit-payment-dialog__actions">
                        <button disabled={isSubmitting} onClick={onCancel} type="button">
                            Hủy
                        </button>
                        <button disabled={isSubmitting || sourceWallets.length === 0} type="submit">
                            {isSubmitting ? "Đang thanh toán..." : "Thanh toán"}
                        </button>
                    </footer>
                </form>
            </div>
        </section>
    );
}
