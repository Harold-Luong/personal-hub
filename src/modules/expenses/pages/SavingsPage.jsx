import { useMemo, useState } from "react";
import BudgetSavingsTransferDialog from "../components/budget/BudgetSavingsTransferDialog";
import PreviousBudgetSavingsCard from "../components/budget/PreviousBudgetSavingsCard";
import MobilePageHeader from "../components/mobile/MobilePageHeader";
import SavingsTransferDialog from "../components/savings/SavingsTransferDialog";
import AmountText from "../components/shared/AmountText";
import ExpenseButton from "../components/shared/ExpenseButton";
import SectionCard from "../components/shared/SectionCard";
import { savingsTransferKinds, transactionTypes } from "../constants/expenseMetadata";
import ExpenseIcon from "../icon/ExpenseIcon";
import {
    getSavingsSummary,
    getSavingsTransferKind,
    getSavingWallets,
} from "../utils/savingsUtils";
import { getWalletDisplayName } from "../utils/walletUtils";

function getSavingsActivity(transaction, wallets) {
    const kind = getSavingsTransferKind(transaction, wallets);
    const isInterest = transaction.type === transactionTypes.INCOME
        && transaction.categoryId === "interest";

    if (!kind && !isInterest) {
        return null;
    }

    if (isInterest) {
        return {
            amount: Math.abs(transaction.amountMinor ?? transaction.amount ?? 0),
            isInterest: true,
            label: "Lãi tiết kiệm",
            tone: "deposit",
        };
    }

    const isDeposit = kind === savingsTransferKinds.DEPOSIT;

    return {
        amount: Math.abs(transaction.amountMinor ?? transaction.amount ?? 0) * (isDeposit ? 1 : -1),
        label: transaction.budgetSavingsMonthKey
            ? "Nạp từ khoản dư ngân sách"
            : isDeposit
              ? "Nạp tiền tiết kiệm"
              : "Rút tiền tiết kiệm",
        tone: isDeposit ? "deposit" : "withdrawal",
    };
}

export default function SavingsPage({
    budgets = [],
    mode = "mobile",
    monthLabel,
    onBack,
    onManageWallet,
    onSave,
    onSaveTransfer,
    transactions = [],
    transfers = [],
    wallets = [],
}) {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [transferKind, setTransferKind] = useState(null);
    const isDesktopMode = mode === "desktop";
    const savingWallets = getSavingWallets(wallets);
    const summary = getSavingsSummary(wallets);
    const savingWalletIds = useMemo(
        () => new Set(savingWallets.map((wallet) => wallet.id)),
        [savingWallets],
    );
    const activities = transactions
        .filter((transaction) => (
            transaction.status !== "voided"
            && (
                savingWalletIds.has(transaction.walletId)
                || savingWalletIds.has(transaction.fromWalletId)
                || savingWalletIds.has(transaction.toWalletId)
            )
        ))
        .map((transaction) => ({
            activity: getSavingsActivity(transaction, wallets),
            transaction,
        }))
        .filter(({ activity }) => Boolean(activity))
        .slice(0, 6);
    const PageElement = isDesktopMode ? "div" : "main";
    const pageClassName = isDesktopMode
        ? "savings-page savings-page--desktop"
        : "savings-page savings-page--mobile mobile-savings-page";

    return (
        <PageElement className={pageClassName}>
            {!isDesktopMode ? (
                <MobilePageHeader
                    actions={(
                        <button className="mobile-savings-page__header-action" onClick={onBack} type="button">
                            Cài đặt
                        </button>
                    )}
                    className="mobile-savings-page__header"
                    subtitle="Tiền dành riêng, không dùng cho chi tiêu thường"
                    title="Tiết kiệm"
                    titleTag="h1"
                />
            ) : null}

            <section className="savings-page__overview">
                <div className="savings-page__hero">
                    <span>Tổng tiền tiết kiệm</span>
                    <strong><AmountText amount={summary.savingBalance} /></strong>
                    <small>Đã tách khỏi số dư có thể chi tiêu</small>
                    <div className="savings-page__hero-actions">
                        <ExpenseButton
                            disabled={!savingWallets.length}
                            label="Nạp thêm"
                            onClick={() => setTransferKind(savingsTransferKinds.DEPOSIT)}
                        />
                        <ExpenseButton
                            disabled={!savingWallets.length || summary.savingBalance <= 0}
                            label="Rút tiền"
                            onClick={() => setTransferKind(savingsTransferKinds.WITHDRAWAL)}
                        />
                    </div>
                </div>
                <div className="savings-page__metrics">
                    <span>
                        <small>Số dư có thể chi</small>
                        <strong><AmountText amount={summary.spendableBalance} /></strong>
                    </span>
                    <span>
                        <small>Ví tiết kiệm</small>
                        <strong>{summary.savingWalletCount}</strong>
                    </span>
                </div>
            </section>

            <div className="savings-page__grid">
                <SectionCard actionLabel={savingWallets.length ? "Quản lý ví" : "Tạo ví"} className="savings-page__wallets" onAction={onManageWallet} title="Ví Tiết kiệm">
                    {savingWallets.length ? (
                        <ul className="savings-page__wallet-list">
                            {savingWallets.map((wallet) => (
                                <li key={wallet.id}>
                                    <ExpenseIcon color={wallet.color} icon={wallet.icon ?? "saving"} />
                                    <span>
                                        <strong>{getWalletDisplayName(wallet)}</strong>
                                        <small>Chỉ Nạp/Rút qua trang Tiết kiệm</small>
                                    </span>
                                    <AmountText amount={wallet.balance ?? 0} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="savings-page__empty">Tạo một ví loại Tiết kiệm để bắt đầu tách tiền khỏi số dư chi tiêu.</p>
                    )}
                </SectionCard>

                <SectionCard actionLabel={null} className="savings-page__history" title="Hoạt động gần đây">
                    {activities.length ? (
                        <ul className="savings-page__history-list">
                            {activities.map(({ activity, transaction }) => (
                                <li key={transaction.id}>
                                    <span className={`savings-page__history-icon is-${activity.tone}`}>
                                        <ExpenseIcon bare icon={activity.tone === "withdrawal" ? "transfer" : "saving"} size={18} />
                                    </span>
                                    <span>
                                        <strong>{activity.label}</strong>
                                        <small>
                                            {transaction.date} · {activity.isInterest
                                                ? transaction.walletName
                                                : `${transaction.fromWalletName} → ${transaction.toWalletName}`}
                                        </small>
                                    </span>
                                    <AmountText amount={activity.amount} showSign />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="savings-page__empty">Chưa có hoạt động tiết kiệm trong các giao dịch gần đây.</p>
                    )}
                </SectionCard>
            </div>

            <PreviousBudgetSavingsCard
                budgets={budgets}
                monthLabel={monthLabel}
                onTransfer={setSelectedCandidate}
                transfers={transfers}
            />

            {selectedCandidate ? (
                <BudgetSavingsTransferDialog
                    candidate={selectedCandidate}
                    onCancel={() => setSelectedCandidate(null)}
                    onSubmit={onSave}
                    wallets={wallets}
                />
            ) : null}

            {transferKind ? (
                <SavingsTransferDialog
                    kind={transferKind}
                    onCancel={() => setTransferKind(null)}
                    onSubmit={onSaveTransfer}
                    wallets={wallets}
                />
            ) : null}
        </PageElement>
    );
}
