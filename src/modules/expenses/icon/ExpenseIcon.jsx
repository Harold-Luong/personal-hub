import { getCanonicalExpenseIconKey } from "./iconAliases";
import { selectExpenseIconSet, useExpensePreferencesStore } from "../../../stores/expensePreferencesStore";
import { expenseDefaultIconSet, expenseIconSetIds, expenseIconSets } from "./iconSets";

function getIconSetId(appearance, iconSet) {
    if (appearance === expenseIconSetIds.BASE || appearance === "icon" || appearance === "label") {
        return expenseIconSetIds.BASE;
    }

    if (appearance === expenseIconSetIds.EMOJI) {
        return expenseIconSetIds.EMOJI;
    }

    return iconSet;
}

export default function ExpenseIcon({
    appearance = "auto",
    bare = false,
    className = "",
    color,
    icon = "more",
    iconSet,
    label,
    size = 20,
}) {
    const preferredIconSet = useExpensePreferencesStore(selectExpenseIconSet);
    const resolvedIconSetId = getIconSetId(appearance, iconSet ?? preferredIconSet ?? expenseDefaultIconSet);
    const resolvedIconSet = expenseIconSets[resolvedIconSetId] ?? expenseIconSets[expenseIconSetIds.EMOJI];
    const iconKey = getCanonicalExpenseIconKey(icon);
    const resolvedIcon = resolvedIconSet[iconKey] ?? resolvedIconSet.more;
    const BaseIcon = resolvedIconSetId === expenseIconSetIds.BASE ? resolvedIcon : null;
    const accessibilityProps = label ? { "aria-label": label, role: "img" } : { "aria-hidden": true };
    const iconStyle = {
        ...(color ? { "--icon-color": color } : {}),
        ...(bare && resolvedIconSetId === expenseIconSetIds.EMOJI
            ? { "--expense-icon-size": `${size}px` }
            : {}),
    };
    const iconClassName = [
        "category-icon",
        `category-icon--${resolvedIconSetId}`,
        bare ? "category-icon--bare" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <span
            {...accessibilityProps}
            className={iconClassName}
            style={Object.keys(iconStyle).length ? iconStyle : undefined}
        >
            {BaseIcon ? <BaseIcon size={size} /> : resolvedIcon}
        </span>
    );
}
