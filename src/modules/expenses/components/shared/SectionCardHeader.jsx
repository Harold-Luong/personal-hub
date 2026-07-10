import { expenseUiText } from "../../constant/expensesUiMetaData";
import ExpenseButton from "./ExpenseButton";

export default function SectionCardHeader({
    actionLabel = expenseUiText.actions.VIEW_ALL,
    className = "section-card__header",
    monthLabel,
    onAction,
    title,
    titleClassName = "section-card__title",
    titleTag: TitleTag = "h2",
}) {
    if (!title && !actionLabel) {
        return null;
    }

    return (
        <header className={className}>
            {title ? (
                <div className={titleClassName}>
                    <TitleTag>{title}</TitleTag>
                    {monthLabel ? <span>({monthLabel})</span> : null}
                </div>
            ) : (
                <span />
            )}
            {actionLabel ? (
                <ExpenseButton label={actionLabel} onClick={onAction} />
            ) : null}
        </header>
    );
}
