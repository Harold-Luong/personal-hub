import { expenseDefaultCurrency } from "../../constant/expensesMetaData";
import { formatCurrency } from "../../utils/formatCurrency";

export default function AmountText({ amount = 0, currency = expenseDefaultCurrency, showSign = false }) {
    const value = showSign && amount > 0 ? `+${formatCurrency(amount, currency)}` : formatCurrency(amount, currency);

    return <span className={amount < 0 ? "amount-text is-negative" : "amount-text"}>{value}</span>;
}
