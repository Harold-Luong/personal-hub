import { useState } from "react";
import {
    creditCardWalletTypeId,
    expenseCurrencyLabels,
    expenseCurrencySymbolByLabel,
    expenseDefaultCurrency,
    walletTypeOptions,
} from "../../constants/expenseMetadata";
import {
    getWalletNameWithDefaultLabel,
    getWalletsDefaultFirst,
    normalizeWalletName,
} from "../../utils/walletUtils";
import { expenseUiText } from "../../constants/expenseUiMetadata";
import {
    formatCurrency,
    formatCurrencyInput,
    formatSignedCurrencyInput,
    parseCurrencyInput,
    parseSignedCurrencyInput,
} from "../../utils/formatCurrency";
import ExpenseButton from "../shared/ExpenseButton";
import ExpenseField from "../shared/ExpenseField";
import ExpenseStateMessage from "../shared/ExpenseStateMessage";

function getWalletType(type) {
    return walletTypeOptions.find((walletType) => walletType.id === type) ?? walletTypeOptions[0];
}

function getInitialWalletId(wallets, preferredWalletId) {
    if (preferredWalletId === null || preferredWalletId === "") {
        return "";
    }

    if (wallets.some((wallet) => wallet.id === preferredWalletId)) {
        return preferredWalletId;
    }

    return wallets[0]?.id ?? "";
}

function getWalletForId(wallets, walletId) {
    return wallets.find((wallet) => wallet.id === walletId);
}

function getFormState(wallet) {
    const walletType = getWalletType(wallet?.type);
    const isOpeningBalanceSetup = Boolean(
        wallet && wallet.type !== creditCardWalletTypeId && !wallet.isBalanceInitialized,
    );

    return {
        balance: isOpeningBalanceSetup
            ? (formatCurrencyInput(wallet.initialBalance ?? 0) || "0")
            : wallet?.balance
              ? formatSignedCurrencyInput(wallet.balance)
              : "",
        color: wallet?.color ?? walletType.color,
        creditLimit: wallet?.creditLimit ? formatCurrencyInput(wallet.creditLimit) : "",
        currency: wallet?.currency ?? expenseDefaultCurrency,
        icon: wallet?.icon ?? walletType.icon,
        name: wallet?.name ?? "",
        setAsDefault: Boolean(wallet?.isDefaultWallet),
        type: walletType.id,
    };
}

function findDuplicateWalletName(wallets, name, excludedWalletId) {
    const normalizedName = normalizeWalletName(name);

    return wallets.find(
        (wallet) =>
            wallet.id !== excludedWalletId &&
            !wallet.isArchived &&
            normalizeWalletName(wallet.name) === normalizedName,
    );
}

export default function WalletForm({ initialWalletId, isInitialSetup = false, onCancel, onDelete, onSubmit, wallets = [] }) {
    const orderedWallets = getWalletsDefaultFirst(wallets);
    const [walletId, setWalletId] = useState(() => getInitialWalletId(orderedWallets, initialWalletId));
    const selectedWallet = getWalletForId(wallets, walletId);
    const [formState, setFormState] = useState(() => getFormState(selectedWallet));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const isEditing = Boolean(selectedWallet);
    const isCreditCard = formState.type === creditCardWalletTypeId;
    const selectedWalletIsCreditCard = selectedWallet?.type === creditCardWalletTypeId;
    const isOpeningBalanceSetup = Boolean(
        selectedWallet && !selectedWalletIsCreditCard && !selectedWallet.isBalanceInitialized,
    );
    const usesSignedBalanceInput = isEditing && !isCreditCard && !isOpeningBalanceSetup;
    const isWorking = isSubmitting || isDeleting;
    const hasBalance = selectedWalletIsCreditCard
        ? (selectedWallet?.outstandingDebt ?? 0) !== 0
        : (selectedWallet?.balance ?? 0) !== 0;
    const canDelete = isEditing && wallets.length > 1 && !selectedWallet?.isDefaultWallet && !hasBalance;
    const currencySymbol = expenseCurrencySymbolByLabel[formState.currency] ?? formState.currency;

    const updateFormState = (nextState) => {
        setFormState((currentState) => ({
            ...currentState,
            ...nextState,
        }));
        setSubmitError("");
    };

    const handleWalletChange = (event) => {
        const nextWalletId = event.target.value;
        const nextWallet = getWalletForId(wallets, nextWalletId);

        setWalletId(nextWalletId);
        setFormState(getFormState(nextWallet));
        setSubmitError("");
    };

    const handleTypeChange = (event) => {
        const nextType = getWalletType(event.target.value);

        updateFormState({
            color: nextType.color,
            icon: nextType.icon,
            type: nextType.id,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const name = formState.name.trim();

        if (!name) {
            setSubmitError("Vui lòng nhập tên ví.");
            return;
        }

        if (findDuplicateWalletName(wallets, name, selectedWallet?.id)) {
            setSubmitError(`Tên ví "${name}" đã tồn tại. Vui lòng chọn tên khác.`);
            return;
        }

        if (selectedWallet && selectedWalletIsCreditCard !== isCreditCard) {
            setSubmitError("Không thể đổi qua lại giữa ví thường và thẻ tín dụng. Vui lòng tạo ví mới.");
            return;
        }

        const creditLimit = parseCurrencyInput(formState.creditLimit);

        if (isCreditCard && !creditLimit) {
            setSubmitError("Vui lòng nhập hạn mức thẻ tín dụng.");
            return;
        }

        const wallet = {
            color: formState.color,
            currency: formState.currency,
            icon: formState.icon,
            id: selectedWallet?.id,
            name: name,
            setAsDefault: selectedWallet?.isDefaultWallet || formState.setAsDefault,
            type: formState.type,
        };

        if (isCreditCard) {
            wallet.balance = 0;
            wallet.creditLimit = creditLimit;
            wallet.initialBalance = 0;
        } else {
            const balance = usesSignedBalanceInput
                ? parseSignedCurrencyInput(formState.balance)
                : parseCurrencyInput(formState.balance);

            if (isInitialSetup && balance <= 0) {
                setSubmitError("Số dư ban đầu phải lớn hơn 0.");
                return;
            }

            if (isOpeningBalanceSetup) {
                wallet.initialBalance = balance;
            } else {
                wallet.balance = balance;
            }
        }

        if (!isEditing && !isCreditCard) {
            wallet.initialBalance = wallet.balance;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await onSubmit?.(wallet);
        } catch (error) {
            setSubmitError(error?.message || "Không thể lưu ví. Vui lòng kiểm tra kết nối và thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedWallet) {
            return;
        }

        const shouldDelete = window.confirm(`Xóa ví "${selectedWallet.name}"?`);

        if (!shouldDelete) {
            return;
        }

        setIsDeleting(true);
        setSubmitError("");

        try {
            await onDelete?.({ id: selectedWallet.id });
        } catch (error) {
            setSubmitError(error?.message || "Không thể xóa ví. Vui lòng kiểm tra kết nối và thử lại.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <form className="wallet-form" onSubmit={handleSubmit}>
            <div className="wallet-form__content">
                {!isInitialSetup ? (
                    <ExpenseField className="wallet-form__field" label="Ví">
                        <select
                            disabled={isWorking}
                            name="walletId"
                            onChange={handleWalletChange}
                            value={selectedWallet?.id ?? ""}
                        >
                            <option value="">Tạo ví mới</option>
                            {orderedWallets.map((wallet) => (
                                <option key={wallet.id} value={wallet.id}>
                                    {getWalletNameWithDefaultLabel(wallet)}
                                </option>
                            ))}
                        </select>
                    </ExpenseField>
                ) : null}

                <ExpenseField className="wallet-form__field" label="Tên ví">
                    <input
                        autoFocus
                        disabled={isWorking}
                        name="name"
                        onChange={(event) => updateFormState({ name: event.target.value })}
                        placeholder="Ví tiền mặt"
                        required
                        type="text"
                        value={formState.name}
                    />
                </ExpenseField>

                <div className="wallet-form__field-row">
                    <ExpenseField className="wallet-form__field" label="Loại ví">
                        <select disabled={isWorking} name="type" onChange={handleTypeChange} value={formState.type}>
                            {walletTypeOptions
                                .filter((walletType) => !isInitialSetup || walletType.id !== creditCardWalletTypeId)
                                .map((walletType) => (
                                <option key={walletType.id} value={walletType.id}>
                                    {walletType.label}
                                </option>
                                ))}
                        </select>
                    </ExpenseField>

                    <ExpenseField className="wallet-form__field" label="Tiền tệ">
                        <select
                            disabled={isWorking}
                            name="currency"
                            onChange={(event) => updateFormState({ currency: event.target.value })}
                            value={formState.currency}
                        >
                            {expenseCurrencyLabels.map((currency) => (
                                <option key={currency} value={currency}>
                                    {currency}
                                </option>
                            ))}
                        </select>
                    </ExpenseField>
                </div>

                <ExpenseField
                    className="wallet-form__field wallet-form__field--amount"
                    label={
                        isCreditCard
                            ? "Hạn mức thẻ"
                            : isOpeningBalanceSetup || !isEditing
                              ? "Số dư ban đầu"
                              : "Số dư thực tế hiện tại"
                    }
                >
                    <span className="wallet-form__amount-control">
                        <input
                            disabled={isWorking}
                            inputMode={usesSignedBalanceInput ? "text" : "numeric"}
                            name={isCreditCard ? "creditLimit" : "balance"}
                            onChange={(event) =>
                                updateFormState({
                                    [isCreditCard ? "creditLimit" : "balance"]:
                                        isCreditCard || !usesSignedBalanceInput
                                            ? formatCurrencyInput(event.target.value)
                                            : formatSignedCurrencyInput(event.target.value),
                                })
                            }
                            placeholder="0"
                            required={isCreditCard || isInitialSetup}
                            type="text"
                            value={isCreditCard ? formState.creditLimit : formState.balance}
                        />
                        <span aria-hidden="true">{currencySymbol}</span>
                    </span>
                </ExpenseField>

                {isCreditCard && selectedWallet ? (
                    <p className="wallet-form__hint">
                        Dư nợ hiện tại: {formatCurrency(selectedWallet.outstandingDebt ?? 0, formState.currency)}.
                        Hạn mức còn lại: {formatCurrency(selectedWallet.availableCredit ?? 0, formState.currency)}.
                    </p>
                ) : null}

                {isOpeningBalanceSetup ? (
                    <p className="wallet-form__hint">
                        Nhập số dư có trước các giao dịch đã ghi. Hệ thống sẽ tự tính số dư hiện tại theo lịch sử,
                        không tạo giao dịch điều chỉnh.
                    </p>
                ) : null}

                <ExpenseField className="wallet-form__field" label="Màu ví">
                    <input
                        disabled={isWorking}
                        name="color"
                        onChange={(event) => updateFormState({ color: event.target.value })}
                        type="color"
                        value={formState.color}
                    />
                </ExpenseField>

                <label className="wallet-form__checkbox">
                    <input
                        checked={selectedWallet?.isDefaultWallet || formState.setAsDefault}
                        disabled={isWorking || selectedWallet?.isDefaultWallet}
                        onChange={(event) => updateFormState({ setAsDefault: event.target.checked })}
                        type="checkbox"
                    />
                    <span>Đặt làm ví mặc định</span>
                </label>

                <p className="wallet-form__hint">
                    {isCreditCard
                        ? "Chi tiêu bằng thẻ tín dụng sẽ tăng dư nợ và giảm hạn mức còn lại, không trừ tiền ngân hàng ngay."
                        : isOpeningBalanceSetup
                        ? "Sau khi lưu, số dư hiện tại sẽ bằng số dư ban đầu cộng các giao dịch đã ghi."
                        : isEditing
                        ? "Nếu đổi số dư hiện tại, hệ thống sẽ tạo một giao dịch điều chỉnh để giữ lịch sử."
                        : "Ví mới sẽ dùng cho giao dịch thu, chi và chuyển khoản."}
                </p>

                {isEditing && !canDelete ? (
                    <p className="wallet-form__hint">
                        Chỉ có thể xóa ví không phải mặc định, không còn số dư/dư nợ và không phải ví active cuối cùng.
                    </p>
                ) : null}

                {submitError ? (
                    <ExpenseStateMessage
                        className="wallet-form__error"
                        message={submitError}
                    />
                ) : null}
            </div>

            <div className="wallet-form__actions">
                {isEditing ? (
                    <ExpenseButton
                        className="wallet-form__delete"
                        disabled={isWorking || !canDelete}
                        isLoading={isDeleting}
                        label="Xóa ví"
                        loadingLabel={expenseUiText.actions.DELETING}
                        onClick={handleDelete}
                    />
                ) : null}
                {!isInitialSetup ? (
                    <ExpenseButton
                        className="wallet-form__cancel"
                        disabled={isWorking}
                        label={expenseUiText.actions.CANCEL}
                        onClick={onCancel}
                    />
                ) : null}
                <ExpenseButton
                    className="wallet-form__submit"
                    disabled={isWorking}
                    isLoading={isSubmitting}
                    label="Lưu ví"
                    loadingLabel={expenseUiText.actions.SAVING}
                    type="submit"
                />
            </div>
        </form>
    );
}
