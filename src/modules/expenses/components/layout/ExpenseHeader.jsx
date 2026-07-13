import { expenseUiText } from "../../constants/expenseUiMetadata";
import { PlusIcon } from "../../icon/ExpenseIcons";
import ExpenseButton from "../shared/ExpenseButton";

export default function ExpenseHeader({
    className = "",
    onAddTransactionClick,
    pageActions,
    subtitle,
    title,
}) {
    const headerClassName = ["expense-header", className].filter(Boolean).join(" ");

    return (
        <header className={headerClassName}>
            {title ? (
                <div className="expense-header__title">
                    <h1>{title}</h1>
                    {subtitle ? <p>{subtitle}</p> : null}
                </div>
            ) : null}
            {pageActions ? <div className="expense-header__page-actions">{pageActions}</div> : null}
            {onAddTransactionClick ? (
                <div className="expense-header__actions">
                    <ExpenseButton
                        ariaLabel={expenseUiText.actions.ADD_TRANSACTION}
                        className="expense-header__add"
                        icon={PlusIcon}
                        iconSize={17}
                        label={expenseUiText.actions.ADD_TRANSACTION}
                        labelTag="span"
                        onClick={onAddTransactionClick}
                    />
                </div>
            ) : null}
        </header>
    );
}
