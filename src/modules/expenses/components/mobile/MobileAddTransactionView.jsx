import { expenseUiText } from "../../constant/expensesUiMetaData";
import ExpenseButton from "../shared/ExpenseButton";
import MobilePageHeader from "./MobilePageHeader";
import TransactionForm from "../transaction/TransactionForm";

export default function MobileAddTransactionView({ categories, onCancel, onSubmit, wallets }) {
    return (
        <main className="mobile-add-transaction-view">
            <MobilePageHeader
                actions={
                    <ExpenseButton
                        label={expenseUiText.actions.CANCEL}
                        onClick={onCancel}
                    />
                }
                className="mobile-add-transaction-view__header"
                title="Thêm giao dịch"
                titleTag="h1"
            />

            <TransactionForm categories={categories} onSubmit={onSubmit} wallets={wallets} />
        </main>
    );
}
