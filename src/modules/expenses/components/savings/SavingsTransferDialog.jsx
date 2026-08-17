import { useState } from "react";
import { savingsTransferKinds } from "../../constants/expenseMetadata";
import { formatCurrencyInput, parseCurrencyInput } from "../../utils/formatCurrency";
import { getSavingWallets, getSpendableWallets } from "../../utils/savingsUtils";
import { getLocalDateValue, getLocalTimeValue } from "../../utils/transactionFormUtils";
import { getWalletDisplayName } from "../../utils/walletUtils";
import ExpenseButton from "../shared/ExpenseButton";
import ExpenseDialog from "../shared/ExpenseDialog";
import ExpenseField from "../shared/ExpenseField";
import ExpenseStateMessage from "../shared/ExpenseStateMessage";

export default function SavingsTransferDialog({ kind, onCancel, onSubmit, wallets = [] }) {
    const isDeposit = kind === savingsTransferKinds.DEPOSIT;
    const savingWallets = getSavingWallets(wallets);
    const spendableWallets = getSpendableWallets(wallets);
    const sourceWallets = isDeposit ? spendableWallets : savingWallets;
    const destinationWallets = isDeposit ? savingWallets : spendableWallets;
    const defaultSourceWallet = sourceWallets.find((wallet) => wallet.isDefaultWallet) ?? sourceWallets[0];
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(getLocalDateValue);
    const [time, setTime] = useState(getLocalTimeValue);
    const [note, setNote] = useState("");
    const [fromWalletId, setFromWalletId] = useState(defaultSourceWallet?.id ?? "");
    const [toWalletId, setToWalletId] = useState(destinationWallets[0]?.id ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const numericAmount = parseCurrencyInput(amount);
    const selectedSourceWallet = sourceWallets.find((wallet) => wallet.id === fromWalletId);
    const compatibleDestinationWallets = destinationWallets.filter(
        (wallet) => (wallet.currency ?? "VND") === (selectedSourceWallet?.currency ?? "VND"),
    );
    const selectedToWalletId = compatibleDestinationWallets.some((wallet) => wallet.id === toWalletId)
        ? toWalletId
        : (compatibleDestinationWallets[0]?.id ?? "");
    const canSubmit = Boolean(
        numericAmount > 0
        && fromWalletId
        && selectedToWalletId
        && (selectedSourceWallet?.balance ?? 0) >= numericAmount,
    );
    const title = isDeposit ? "Nạp tiền tiết kiệm" : "Rút tiền tiết kiệm";

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!canSubmit) {
            setSubmitError("Vui lòng nhập số tiền hợp lệ và kiểm tra số dư ví nguồn.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await onSubmit?.({
                amount: numericAmount,
                date,
                fromWalletId,
                note: note.trim(),
                savingsTransferKind: kind,
                time,
                toWalletId: selectedToWalletId,
            });
            onCancel?.();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : `Không thể ${title.toLocaleLowerCase("vi")}.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ExpenseDialog
            backdropClassName="desktop-form-dialog__backdrop savings-transfer-dialog__backdrop"
            closeButtonClassName="desktop-form-dialog__close"
            eyebrow="Ví được bảo vệ"
            headerClassName="desktop-form-dialog__header"
            headingId="savings-transfer-dialog-title"
            onClose={onCancel}
            panelClassName="desktop-form-dialog savings-transfer-dialog"
            title={title}
        >
            <form className="savings-transfer-form" onSubmit={handleSubmit}>
                <ExpenseField label="Số tiền">
                    <span className="savings-transfer-form__amount-control">
                        <input
                            autoFocus
                            inputMode="numeric"
                            onChange={(event) => setAmount(formatCurrencyInput(event.target.value))}
                            placeholder="0"
                            required
                            type="text"
                            value={amount}
                        />
                        <span aria-hidden="true">₫</span>
                    </span>
                </ExpenseField>

                <ExpenseField label={isDeposit ? "Nạp từ ví chi tiêu" : "Rút từ ví Tiết kiệm"}>
                    <select
                        disabled={!sourceWallets.length}
                        onChange={(event) => setFromWalletId(event.target.value)}
                        required
                        value={fromWalletId}
                    >
                        {sourceWallets.map((wallet) => (
                            <option key={wallet.id} value={wallet.id}>
                                {getWalletDisplayName(wallet)}
                            </option>
                        ))}
                    </select>
                </ExpenseField>

                <ExpenseField label={isDeposit ? "Đưa vào ví Tiết kiệm" : "Nhận vào ví chi tiêu"}>
                    <select
                        disabled={!destinationWallets.length}
                        onChange={(event) => setToWalletId(event.target.value)}
                        required
                        value={selectedToWalletId}
                    >
                        {compatibleDestinationWallets.map((wallet) => (
                            <option key={wallet.id} value={wallet.id}>
                                {getWalletDisplayName(wallet)}
                            </option>
                        ))}
                    </select>
                </ExpenseField>

                <div className="savings-transfer-form__date-row">
                    <ExpenseField label="Ngày">
                        <input onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
                    </ExpenseField>
                    <ExpenseField label="Giờ">
                        <input onChange={(event) => setTime(event.target.value)} required type="time" value={time} />
                    </ExpenseField>
                </div>

                <ExpenseField label="Ghi chú">
                    <textarea
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Không bắt buộc"
                        rows="2"
                        value={note}
                    />
                </ExpenseField>

                {!savingWallets.length ? (
                    <ExpenseStateMessage message="Bạn cần tạo ít nhất một ví loại Tiết kiệm trước." />
                ) : null}
                {!spendableWallets.length ? (
                    <ExpenseStateMessage message="Bạn cần ít nhất một ví chi tiêu để nạp hoặc nhận tiền rút." />
                ) : null}
                {numericAmount > 0 && selectedSourceWallet && (selectedSourceWallet.balance ?? 0) < numericAmount ? (
                    <ExpenseStateMessage message="Số dư ví nguồn không đủ." />
                ) : null}
                {submitError ? <ExpenseStateMessage message={submitError} /> : null}

                <div className="savings-transfer-form__actions">
                    <ExpenseButton label="Hủy" onClick={onCancel} />
                    <ExpenseButton
                        disabled={!canSubmit}
                        isLoading={isSubmitting}
                        label={title}
                        loadingLabel="Đang lưu..."
                        type="submit"
                    />
                </div>
            </form>
        </ExpenseDialog>
    );
}
