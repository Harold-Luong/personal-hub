import { useId } from "react";
import ExpenseIcon from "../../icon/ExpenseIcon";
import { getWalletDisplayName } from "../../utils/walletUtils";
import AmountText from "../shared/AmountText";
import ExpenseField from "../shared/ExpenseField";

export default function WalletTransferFields({
    sourceWallets, destinationWallets, fromWalletId, toWalletId,
    onFromChange, onToChange, sourceLabel = "Từ ví", destinationLabel = "Đến ví",
}) {
    const id = useId();
    const source = sourceWallets.find((wallet) => wallet.id === fromWalletId);
    const currency = source?.currency ?? "VND";
    return <div className="wallet-transfer-fields">
        <div className="wallet-transfer-fields__wallet">
            <ExpenseField label={sourceLabel}>
                <select aria-describedby={`${id}-balance`} disabled={!sourceWallets.length} onChange={(event) => onFromChange(event.target.value)} required value={fromWalletId}>
                    {!sourceWallets.length && <option value="">Chưa có ví phù hợp</option>}
                    {sourceWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{getWalletDisplayName(wallet)}</option>)}
                </select>
            </ExpenseField>
            <small id={`${id}-balance`}>Số dư: <AmountText amount={source?.balance ?? 0} currency={currency} /></small>
        </div>
        <ExpenseIcon appearance="base" bare className="wallet-transfer-fields__direction" icon="arrow-right" size={20} />
        <div className="wallet-transfer-fields__wallet">
            <ExpenseField label={destinationLabel}>
                <select aria-describedby={`${id}-destination`} disabled={!destinationWallets.length} onChange={(event) => onToChange(event.target.value)} required value={toWalletId}>
                    {!destinationWallets.length && <option value="">Chưa có ví phù hợp</option>}
                    {destinationWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{getWalletDisplayName(wallet)}</option>)}
                </select>
            </ExpenseField>
            <small id={`${id}-destination`}>Cùng tiền tệ · {currency}</small>
        </div>
        {source && !destinationWallets.length && <p className="expense-form-notice" role="status">
            <ExpenseIcon appearance="base" bare icon="info" size={18} />
            <span>Chưa có ví nhận bằng {currency}. Chọn ví nguồn khác hoặc tạo ví nhận cùng tiền tệ.</span>
        </p>}
    </div>;
}
