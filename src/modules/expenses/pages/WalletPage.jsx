import { useEffect, useState } from "react";
import AmountText from "../components/shared/AmountText";
import MobilePageHeader from "../components/mobile/MobilePageHeader";
import ExpenseIcon from "../components/shared/ExpenseEmoji";
import WalletForm from "../components/wallet/WalletForm";
import { XIcon } from "../icon/ExpenseIcons";

const walletTypeLabels = {
    bank: "Ngân hàng",
    card: "Thẻ",
    cash: "Tiền mặt",
    eWallet: "Ví điện tử",
    other: "Khác",
    saving: "Tiết kiệm",
};

export default function WalletPage({
    onBack,
    onDeleteWallet,
    onSaveWallet,
    wallets = [],
}) {
    const [selectedWalletId, setSelectedWalletId] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const totalBalance = wallets.reduce(
        (total, wallet) => total + (wallet.balance ?? 0),
        0,
    );

    useEffect(() => {
        if (!isFormOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isFormOpen]);

    const closeForm = () => {
        setSelectedWalletId("");
        setIsFormOpen(false);
    };

    const openCreateForm = () => {
        setSelectedWalletId(null);
        setIsFormOpen(true);
    };

    const openEditForm = (walletId) => {
        setSelectedWalletId(walletId);
        setIsFormOpen(true);
    };

    const handleSaveWallet = async (wallet) => {
        await onSaveWallet?.(wallet);
        closeForm();
    };

    const handleDeleteWallet = async (wallet) => {
        await onDeleteWallet?.(wallet);
        closeForm();
    };

    return (
        <main className="mobile-wallet-page">
            <MobilePageHeader
                actions={
                    <button
                        className="mobile-wallet-page__header-action"
                        onClick={onBack}
                        type="button"
                    >
                        Cài đặt
                    </button>
                }
                className="mobile-wallet-page__header"
                subtitle={`${wallets.length} ví đang hoạt động`}
                title="Ví của tôi"
            />

            <section className="mobile-wallet-page__summary">
                <span>Tổng số dư</span>
                <strong>
                    <AmountText amount={totalBalance} />
                </strong>
            </section>

            <section className="mobile-wallet-page__section">
                <div className="mobile-wallet-page__section-heading">
                    <div>
                        <h2>Danh sách ví</h2>
                        <p>Quản lý số dư dùng cho giao dịch</p>
                    </div>
                    <button onClick={openCreateForm} type="button">
                        Thêm
                    </button>
                </div>

                {wallets.length ? (
                    <div className="mobile-wallet-page__list section-card">
                        {wallets.map((wallet) => (
                            <button
                                className="mobile-wallet-item"
                                key={wallet.id}
                                onClick={() => openEditForm(wallet.id)}
                                type="button"
                            >
                                <ExpenseIcon
                                    appearance="emoji"
                                    color={wallet.color}
                                    icon={wallet.icon}
                                    label={wallet.name}
                                />
                                <span className="mobile-wallet-item__copy">
                                    <strong>{wallet.name}</strong>
                                    <span>{walletTypeLabels[wallet.type] ?? wallet.type}</span>
                                </span>
                                <span className="mobile-wallet-item__meta">
                                    {wallet.isDefault ? <small>Mặc định</small> : null}
                                    <AmountText amount={wallet.balance} />
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="mobile-wallet-page__empty section-card">
                        <strong>Chưa có ví</strong>
                        <p>Tạo ví đầu tiên để ghi nhận thu, chi và chuyển khoản.</p>
                        <button onClick={openCreateForm} type="button">
                            Tạo ví
                        </button>
                    </div>
                )}
            </section>

            {isFormOpen ? (
                <section
                    aria-labelledby="mobile-wallet-form-title"
                    aria-modal="true"
                    className="mobile-wallet-page__sheet-backdrop"
                    role="dialog"
                >
                    <div className="mobile-wallet-page__sheet">
                        <header className="mobile-wallet-page__sheet-header">
                            <h2 id="mobile-wallet-form-title">
                                {selectedWalletId ? "Sửa ví" : "Tạo ví"}
                            </h2>
                            <button
                                aria-label="Đóng"
                                onClick={closeForm}
                                type="button"
                            >
                                <XIcon size={18} />
                            </button>
                        </header>
                        <WalletForm
                            initialWalletId={selectedWalletId}
                            onCancel={closeForm}
                            onDelete={handleDeleteWallet}
                            onSubmit={handleSaveWallet}
                            wallets={wallets}
                        />
                    </div>
                </section>
            ) : null}
        </main>
    );
}
