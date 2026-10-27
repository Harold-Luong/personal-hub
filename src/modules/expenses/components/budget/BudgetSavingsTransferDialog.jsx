import { getLocalDateValue, getLocalTimeValue } from "../../utils/transactionFormUtils";
import useTransactionSubmission from "../../hooks/useTransactionSubmission";
import { useState } from "react";
import { creditCardWalletTypeId, savingWalletTypeId } from "../../constants/expenseMetadata";
import WalletTransferFields from "../wallet/WalletTransferFields";
import AmountText from "../shared/AmountText";
import ExpenseButton from "../shared/ExpenseButton";
import ExpenseDialog from "../shared/ExpenseDialog";
import ExpenseStateMessage from "../shared/ExpenseStateMessage";

export default function BudgetSavingsTransferDialog({ candidate, onCancel, onSubmit, wallets = [] }) {
    const sourceWallets = wallets.filter(
        (wallet) =>
            wallet.type !== creditCardWalletTypeId
            && wallet.type !== savingWalletTypeId
            && (wallet.balance ?? 0) >= (candidate?.savingsAmount ?? 0),
    );
    const savingWallets = wallets.filter((wallet) => wallet.type === savingWalletTypeId);
    const defaultSourceWallet = sourceWallets.find((wallet) => wallet.isDefaultWallet) ?? sourceWallets[0];
    const [fromWalletId, setFromWalletId] = useState(defaultSourceWallet?.id ?? "");
    const [toWalletId, setToWalletId] = useState(savingWallets[0]?.id ?? "");
    const submitTransaction = useTransactionSubmission(onSubmit);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [date] = useState(getLocalDateValue);
    const [time] = useState(getLocalTimeValue);
    const sourceCurrency = sourceWallets.find((wallet) => wallet.id === fromWalletId)?.currency ?? "VND";
    const destinations = savingWallets.filter((wallet) => (wallet.currency ?? "VND") === sourceCurrency);
    const selectedToWalletId = destinations.some((wallet) => wallet.id === toWalletId) ? toWalletId : (destinations[0]?.id ?? "");
    const canSubmit = Boolean(candidate?.savingsAmount > 0 && sourceWallets.some((wallet) => wallet.id === fromWalletId) && selectedToWalletId);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!canSubmit) {
            setSubmitError("Vui lòng chọn đủ ví chuyển và ví tiết kiệm.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await submitTransaction({ candidate, fromWalletId, toWalletId: selectedToWalletId, date, time });
            onCancel?.();
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : "Không thể đưa khoản dư vào ví tiết kiệm.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ExpenseDialog
            backdropClassName="desktop-form-dialog__backdrop budget-savings-transfer-dialog__backdrop"
            closeButtonClassName="desktop-form-dialog__close"
            eyebrow="Ngân sách tháng trước"
            headerClassName="desktop-form-dialog__header"
            headingId="budget-savings-transfer-dialog-title"
            onClose={onCancel}
            panelClassName="desktop-form-dialog budget-savings-transfer-dialog"
            title="Đưa khoản dư vào tiết kiệm"
        >
            <form className="budget-savings-transfer-form" onSubmit={handleSubmit}>
                <div className="budget-savings-transfer-form__summary">
                    <span>{candidate.category}</span>
                    <strong><AmountText amount={candidate.savingsAmount} /></strong>
                    <small>Khoản dư được tính từ hạn mức trừ chi tiêu của danh mục.</small>
                </div>

                <WalletTransferFields
                    sourceWallets={sourceWallets}
                    destinationWallets={destinations}
                    fromWalletId={fromWalletId}
                    toWalletId={selectedToWalletId}
                    onFromChange={setFromWalletId}
                    onToChange={setToWalletId}
                    destinationLabel="Đến ví tiết kiệm"
                />

                {!savingWallets.length ? (
                    <ExpenseStateMessage
                        className="budget-savings-transfer-form__notice"
                        message="Bạn cần tạo ít nhất một ví loại Tiết kiệm trước khi sử dụng tính năng này."
                    />
                ) : null}
                {!sourceWallets.length ? (
                    <ExpenseStateMessage
                        className="budget-savings-transfer-form__notice"
                        message="Không có ví nguồn phù hợp hoặc đủ số dư để chuyển khoản."
                    />
                ) : null}
                {submitError ? (
                    <ExpenseStateMessage
                        className="budget-savings-transfer-form__error"
                        message={submitError}
                    />
                ) : null}

                <div className="budget-savings-transfer-form__actions">
                    <ExpenseButton label="Hủy" onClick={onCancel} />
                    <ExpenseButton
                        disabled={!canSubmit}
                        isLoading={isSubmitting}
                        label="Đưa vào tiết kiệm"
                        loadingLabel="Đang chuyển..."
                        type="submit"
                    />
                </div>
            </form>
        </ExpenseDialog>
    );
}
