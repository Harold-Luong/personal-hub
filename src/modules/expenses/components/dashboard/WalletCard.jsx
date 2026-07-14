import AmountText from "../shared/AmountText";
import ExpenseIcon from "../../icon/ExpenseIcon";
import SectionCard from "../shared/SectionCard";
import { expenseUiText } from "../../constants/expenseUiMetadata";
import {
    getWalletNameWithDefaultLabel,
    getWalletsDefaultFirst,
    isCreditCardWallet,
} from "../../utils/walletUtils";

function getWalletMeta(wallet) {
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

    return null;
}

export default function WalletCard({ onManageWallet, onPayCreditCard, wallets = [] }) {
    const orderedWallets = getWalletsDefaultFirst(wallets);

    return (
        <SectionCard
            actionLabel={wallets.length ? expenseUiText.actions.MANAGE : expenseUiText.actions.CREATE_WALLET}
            className="wallet-card"
            onAction={onManageWallet}
            title="Ví của tôi"
        >
            {orderedWallets.length ? (
                orderedWallets.map((wallet) => (
                    <article className="wallet-item" key={wallet.id}>
                        <ExpenseIcon color={wallet.color} icon={wallet.icon} label={getWalletNameWithDefaultLabel(wallet)} />
                        <span>
                            <strong>{getWalletNameWithDefaultLabel(wallet)}</strong>
                            {getWalletMeta(wallet)}
                        </span>
                        <strong>
                            <AmountText amount={isCreditCardWallet(wallet) ? wallet.outstandingDebt : wallet.balance} />
                        </strong>
                        {isCreditCardWallet(wallet) && (wallet.outstandingDebt ?? 0) > 0 ? (
                            <button
                                aria-label={`Thanh toán thẻ tín dụng ${getWalletNameWithDefaultLabel(wallet)}`}
                                className="wallet-item__credit-payment"
                                onClick={() => onPayCreditCard?.(wallet)}
                                type="button"
                            >
                                Thanh toán
                            </button>
                        ) : null}
                    </article>
                ))
            ) : (
                <p className="wallet-card__empty">Chưa có ví nào để ghi nhận giao dịch.</p>
            )}
        </SectionCard>
    );
}
