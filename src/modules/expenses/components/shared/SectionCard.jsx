import { expenseUiText } from "../../constants/expenseUiMetadata";
import SectionCardHeader from "./SectionCardHeader";

export default function SectionCard({
    actionLabel = expenseUiText.actions.VIEW_ALL,
    as: Component = "section",
    children,
    className = "",
    monthLabel,
    onAction,
    title,
    ...sectionProps
}) {
    return (
        <Component {...sectionProps} className={`section-card ${className}`.trim()}>
            <SectionCardHeader
                actionLabel={actionLabel}
                monthLabel={monthLabel}
                onAction={onAction}
                title={title}
            />
            {children}
        </Component>
    );
}
