import { useState } from "react";
import {
    expenseCurrencyLabels,
    expenseCurrencySymbolByLabel,
    expenseDefaultCurrency,
    walletTypeOptions,
} from "../../constant/expensesMetaData";
import { formatCurrencyInput, parseCurrencyInput } from "../../utils/formatCurrency";

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

    return {
        balance: wallet?.balance ? formatCurrencyInput(wallet.balance) : "",
        color: wallet?.color ?? walletType.color,
        currency: wallet?.currency ?? expenseDefaultCurrency,
        icon: wallet?.icon ?? walletType.icon,
        isDefault: Boolean(wallet?.isDefault),
        name: wallet?.name ?? "",
        type: walletType.id,
    };
}

export default function WalletForm({ initialWalletId, onCancel, onDelete, onSubmit, wallets = [] }) {
    const [walletId, setWalletId] = useState(() => getInitialWalletId(wallets, initialWalletId));
    const selectedWallet = getWalletForId(wallets, walletId);
    const [formState, setFormState] = useState(() => getFormState(selectedWallet));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const isEditing = Boolean(selectedWallet);
    const isWorking = isSubmitting || isDeleting;
    const hasBalance = (selectedWallet?.balance ?? 0) !== 0;
    const canDelete = isEditing && wallets.length > 1 && !selectedWallet?.isDefault && !hasBalance;
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

        const wallet = {
            balance: parseCurrencyInput(formState.balance),
            color: formState.color,
            currency: formState.currency,
            icon: formState.icon,
            id: selectedWallet?.id,
            isDefault: selectedWallet?.isDefault || formState.isDefault,
            name: name,
            type: formState.type,
        };

        if (!isEditing) {
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
                <label className="wallet-form__field">
                    <span>Ví</span>
                    <select
                        disabled={isWorking}
                        name="walletId"
                        onChange={handleWalletChange}
                        value={selectedWallet?.id ?? ""}
                    >
                        <option value="">Tạo ví mới</option>
                        {wallets.map((wallet) => (
                            <option key={wallet.id} value={wallet.id}>
                                {wallet.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="wallet-form__field">
                    <span>Tên ví</span>
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
                </label>

                <div className="wallet-form__field-row">
                    <label className="wallet-form__field">
                        <span>Loại ví</span>
                        <select disabled={isWorking} name="type" onChange={handleTypeChange} value={formState.type}>
                            {walletTypeOptions.map((walletType) => (
                                <option key={walletType.id} value={walletType.id}>
                                    {walletType.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="wallet-form__field">
                        <span>Tiền tệ</span>
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
                    </label>
                </div>

                <label className="wallet-form__field wallet-form__field--amount">
                    <span>{isEditing ? "Số dư hiện tại" : "Số dư ban đầu"}</span>
                    <span className="wallet-form__amount-control">
                        <input
                            disabled={isWorking}
                            inputMode="numeric"
                            name="balance"
                            onChange={(event) =>
                                updateFormState({
                                    balance: formatCurrencyInput(event.target.value),
                                })
                            }
                            placeholder="0"
                            type="text"
                            value={formState.balance}
                        />
                        <span aria-hidden="true">{currencySymbol}</span>
                    </span>
                </label>

                <label className="wallet-form__field">
                    <span>Màu ví</span>
                    <input
                        disabled={isWorking}
                        name="color"
                        onChange={(event) => updateFormState({ color: event.target.value })}
                        type="color"
                        value={formState.color}
                    />
                </label>

                <label className="wallet-form__checkbox">
                    <input
                        checked={selectedWallet?.isDefault || formState.isDefault}
                        disabled={isWorking || selectedWallet?.isDefault}
                        onChange={(event) => updateFormState({ isDefault: event.target.checked })}
                        type="checkbox"
                    />
                    <span>Đặt làm ví mặc định</span>
                </label>

                <p className="wallet-form__hint">
                    {isEditing
                        ? "Nếu đổi số dư hiện tại, hệ thống sẽ tạo một giao dịch điều chỉnh để giữ lịch sử."
                        : "Ví mới sẽ dùng cho giao dịch thu, chi và chuyển khoản."}
                </p>

                {isEditing && !canDelete ? (
                    <p className="wallet-form__hint">
                        Chỉ có thể xóa ví không phải mặc định, không còn số dư và không phải ví active cuối cùng.
                    </p>
                ) : null}

                {submitError ? <p className="wallet-form__error">{submitError}</p> : null}
            </div>

            <div className="wallet-form__actions">
                {isEditing ? (
                    <button
                        className="wallet-form__delete"
                        disabled={isWorking || !canDelete}
                        onClick={handleDelete}
                        type="button"
                    >
                        {isDeleting ? "Đang xóa..." : "Xóa ví"}
                    </button>
                ) : null}
                <button className="wallet-form__cancel" disabled={isWorking} onClick={onCancel} type="button">
                    Hủy
                </button>
                <button className="wallet-form__submit" disabled={isWorking} type="submit">
                    {isSubmitting ? "Đang lưu..." : "Lưu ví"}
                </button>
            </div>
        </form>
    );
}
