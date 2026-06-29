import { useState } from "react";
import {
    formatCurrencyInput,
    parseCurrencyInput,
} from "../../utils/formatCurrency";

const walletTypes = [
    { id: "cash", label: "Tiền mặt", icon: "wallet", color: "#56b879" },
    { id: "bank", label: "Ngân hàng", icon: "bank", color: "#4f93d7" },
    { id: "card", label: "Thẻ", icon: "card", color: "#9b7bd8" },
    { id: "eWallet", label: "Ví điện tử", icon: "momo", color: "#d77fa1" },
    { id: "saving", label: "Tiết kiệm", icon: "saving", color: "#d9a441" },
    { id: "other", label: "Khác", icon: "more", color: "#b8bec8" },
];

const walletCurrencies = ["VND", "USD"];
const createWalletId = "__new_wallet__";

function getWalletType(type) {
    return walletTypes.find((walletType) => walletType.id === type) ?? walletTypes[0];
}

function getInitialWalletId(wallets, preferredWalletId) {
    if (preferredWalletId === null || preferredWalletId === createWalletId) {
        return createWalletId;
    }

    if (wallets.some((wallet) => wallet.id === preferredWalletId)) {
        return preferredWalletId;
    }

    return wallets[0]?.id ?? createWalletId;
}

function getWalletForId(wallets, walletId) {
    return wallets.find((wallet) => wallet.id === walletId);
}

function getFormState(wallet) {
    const walletType = getWalletType(wallet?.type);

    return {
        balance: wallet?.balance ? formatCurrencyInput(wallet.balance) : "",
        color: wallet?.color ?? walletType.color,
        currency: wallet?.currency ?? "VND",
        icon: wallet?.icon ?? walletType.icon,
        isDefault: Boolean(wallet?.isDefault),
        name: wallet?.name ?? "",
        type: walletType.id,
    };
}

export default function WalletForm({
    initialWalletId,
    onCancel,
    onDelete,
    onSubmit,
    wallets = [],
}) {
    const [walletId, setWalletId] = useState(() =>
        getInitialWalletId(wallets, initialWalletId),
    );
    const selectedWallet = getWalletForId(wallets, walletId);
    const [formState, setFormState] = useState(() => getFormState(selectedWallet));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const isEditing = Boolean(selectedWallet);
    const isWorking = isSubmitting || isDeleting;
    const canDelete = isEditing && wallets.length > 1;

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
            color: formState.color,
            currency: formState.currency,
            icon: formState.icon,
            id: selectedWallet?.id,
            isDefault: selectedWallet?.isDefault || formState.isDefault,
            name,
            type: formState.type,
        };

        if (!isEditing) {
            const balance = parseCurrencyInput(formState.balance);

            wallet.balance = balance;
            wallet.initialBalance = balance;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            await onSubmit?.(wallet);
        } catch {
            setSubmitError(
                "Không thể lưu ví. Vui lòng kiểm tra kết nối và thử lại.",
            );
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
        } catch {
            setSubmitError(
                "Không thể xóa ví. Vui lòng kiểm tra kết nối và thử lại.",
            );
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
                        value={selectedWallet?.id ?? createWalletId}
                    >
                        <option value={createWalletId}>Tạo ví mới</option>
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
                        onChange={(event) =>
                            updateFormState({ name: event.target.value })
                        }
                        placeholder="Ví tiền mặt"
                        required
                        type="text"
                        value={formState.name}
                    />
                </label>

                <div className="wallet-form__field-row">
                    <label className="wallet-form__field">
                        <span>Loại ví</span>
                        <select
                            disabled={isWorking}
                            name="type"
                            onChange={handleTypeChange}
                            value={formState.type}
                        >
                            {walletTypes.map((walletType) => (
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
                            onChange={(event) =>
                                updateFormState({ currency: event.target.value })
                            }
                            value={formState.currency}
                        >
                            {walletCurrencies.map((currency) => (
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
                            readOnly={isEditing}
                            type="text"
                            value={formState.balance}
                        />
                        <span aria-hidden="true">₫</span>
                    </span>
                </label>

                <label className="wallet-form__field">
                    <span>Màu ví</span>
                    <input
                        disabled={isWorking}
                        name="color"
                        onChange={(event) =>
                            updateFormState({ color: event.target.value })
                        }
                        type="color"
                        value={formState.color}
                    />
                </label>

                <label className="wallet-form__checkbox">
                    <input
                        checked={selectedWallet?.isDefault || formState.isDefault}
                        disabled={isWorking || selectedWallet?.isDefault}
                        onChange={(event) =>
                            updateFormState({ isDefault: event.target.checked })
                        }
                        type="checkbox"
                    />
                    <span>Đặt làm ví mặc định</span>
                </label>

                <p className="wallet-form__hint">
                    {isEditing
                        ? "Cập nhật tên, loại ví, màu sắc hoặc tiền tệ. Số dư hiện tại chỉ để xem."
                        : "Ví mới sẽ dùng cho giao dịch thu, chi và chuyển khoản."}
                </p>

                {submitError ? (
                    <p className="wallet-form__error">{submitError}</p>
                ) : null}
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
                <button
                    className="wallet-form__cancel"
                    disabled={isWorking}
                    onClick={onCancel}
                    type="button"
                >
                    Hủy
                </button>
                <button
                    className="wallet-form__submit"
                    disabled={isWorking}
                    type="submit"
                >
                    {isSubmitting ? "Đang lưu..." : "Lưu ví"}
                </button>
            </div>
        </form>
    );
}
