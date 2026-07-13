import { useEffect, useState } from "react";
import AmountText from "../components/shared/AmountText";
import ExpenseDialog from "../components/shared/ExpenseDialog";
import SectionCard from "../components/shared/SectionCard";
import MobilePageHeader from "../components/mobile/MobilePageHeader";
import ExpenseIcon from "../components/shared/ExpenseIcon";
import DesktopWalletDialog from "../components/desktop/DesktopWalletDialog";
import WalletForm from "../components/wallet/WalletForm";
import { walletTypeLabels } from "../constants/expenseMetadata";
import { isCreditCardWallet } from "../utils/walletUtils";

function WalletItemMeta({ wallet }) {
    if (isCreditCardWallet(wallet)) {
        return (
            <small>
                Dư nợ · còn lại <AmountText amount={wallet.availableCredit ?? 0} />
            </small>
        );
    }

    if (!wallet.isBalanceInitialized) {
        return <small>Số dư tạm tính từ 0đ</small>;
    }

    return wallet.isDefault ? <small>Mặc định</small> : null;
}

export default function WalletPage({
    mode = "mobile",
    onBack,
    onDeleteWallet,
    onPayCreditCard,
    onSaveWallet,
    wallets = [],
}) {
    const [selectedWalletId, setSelectedWalletId] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const isDesktopMode = mode === "desktop";
    const totalBalance = wallets.reduce((total, wallet) => total + (wallet.balance ?? 0), 0);

    useEffect(() => {
        if (!isFormOpen || isDesktopMode) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isDesktopMode, isFormOpen]);

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
        <main className={`wallet-page wallet-page--${mode} mobile-wallet-page`}>
            {!isDesktopMode ? (
                <MobilePageHeader
                    actions={
                        <button className="mobile-wallet-page__header-action" onClick={onBack} type="button">
                            Cài đặt
                        </button>
                    }
                    className="mobile-wallet-page__header"
                    subtitle={`${wallets.length} ví đang hoạt động`}
                    title="Ví của tôi"
                />
            ) : null}

            <section className="mobile-wallet-page__summary">
                <span>{wallets.some((wallet) => !isCreditCardWallet(wallet) && !wallet.isBalanceInitialized) ? "Tổng số dư tạm tính" : "Tổng số dư"}</span>
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
                    <SectionCard actionLabel={null} as="div" className="mobile-wallet-page__list">
                        {wallets.map((wallet) => (
                            <article
                                className="mobile-wallet-item"
                                key={wallet.id}
                            >
                                <button
                                    className="mobile-wallet-item__edit"
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
                                        <WalletItemMeta wallet={wallet} />
                                        <AmountText amount={isCreditCardWallet(wallet) ? wallet.outstandingDebt : wallet.balance} />
                                    </span>
                                </button>
                                {isCreditCardWallet(wallet) && (wallet.outstandingDebt ?? 0) > 0 ? (
                                    <button
                                        aria-label={`Thanh toán thẻ tín dụng ${wallet.name}`}
                                        className="mobile-wallet-item__credit-payment"
                                        onClick={() => onPayCreditCard?.(wallet)}
                                        type="button"
                                    >
                                        Thanh toán
                                    </button>
                                ) : null}
                            </article>
                        ))}
                    </SectionCard>
                ) : (
                    <SectionCard actionLabel={null} as="div" className="mobile-wallet-page__empty">
                        <strong>Chưa có ví</strong>
                        <p>Tạo ví đầu tiên để ghi nhận thu, chi và chuyển khoản.</p>
                        <button onClick={openCreateForm} type="button">
                            Tạo ví
                        </button>
                    </SectionCard>
                )}
            </section>

            {isFormOpen && isDesktopMode ? (
                <DesktopWalletDialog
                    initialWalletId={selectedWalletId}
                    onCancel={closeForm}
                    onDelete={handleDeleteWallet}
                    onSubmit={handleSaveWallet}
                    wallets={wallets}
                />
            ) : null}

            {isFormOpen && !isDesktopMode ? (
                <ExpenseDialog
                    backdropClassName="mobile-wallet-page__sheet-backdrop"
                    headerClassName="mobile-wallet-page__sheet-header"
                    headingId="mobile-wallet-form-title"
                    onClose={closeForm}
                    panelClassName="mobile-wallet-page__sheet"
                    title={selectedWalletId ? "Sửa ví" : "Tạo ví"}
                >
                    <WalletForm
                        initialWalletId={selectedWalletId}
                        onCancel={closeForm}
                        onDelete={handleDeleteWallet}
                        onSubmit={handleSaveWallet}
                        wallets={wallets}
                    />
                </ExpenseDialog>
            ) : null}
        </main>
    );
}
