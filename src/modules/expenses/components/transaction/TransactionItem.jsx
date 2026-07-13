import AmountText from "../shared/AmountText";
import ExpenseIcon from "../../icon/ExpenseIcon";

export default function TransactionItem({ transaction }) {
    if (!transaction) {
        return null;
    }

    return (
        <article className="transaction-item">
            <ExpenseIcon icon={transaction.icon ?? transaction.category} label={transaction.title} />
            <div>
                <strong>{transaction.title}</strong>
                <p>{transaction.subtitle}</p>
            </div>
            <AmountText amount={transaction.amount} showSign />
        </article>
    );
}
