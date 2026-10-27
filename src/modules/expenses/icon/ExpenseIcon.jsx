import { getCanonicalExpenseIconKey } from "./iconAliases";
import { selectExpenseIconSet, useExpensePreferencesStore } from "../../../stores/expensePreferencesStore";
import { expenseControlIconKeys, expenseDefaultIconSet, expenseIconSetIds, expenseIconSets } from "./iconSets";

function getIconSetId(appearance, iconSet) {
    if (appearance === expenseIconSetIds.BASE || appearance === "icon" || appearance === "label") {
        return expenseIconSetIds.BASE;
    }

    if (appearance === expenseIconSetIds.DUOTONE || appearance === "duotone") {
        return expenseIconSetIds.DUOTONE;
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
    const iconKey = getCanonicalExpenseIconKey(icon);
    const requestedSetId = getIconSetId(appearance,
        appearance === "auto" && !iconSet && expenseControlIconKeys.has(iconKey)
            ? expenseIconSetIds.BASE : (iconSet ?? preferredIconSet ?? expenseDefaultIconSet));
    const resolvedIconSetId = Object.hasOwn(expenseIconSets, requestedSetId) ? requestedSetId : expenseDefaultIconSet;
    const resolvedIconSet = expenseIconSets[resolvedIconSetId];
    const resolvedIcon = Object.hasOwn(resolvedIconSet, iconKey) ? resolvedIconSet[iconKey] : resolvedIconSet.more;
    const Icon = resolvedIcon;
    const isDuotone = resolvedIconSetId === expenseIconSetIds.DUOTONE;
    const accessibilityProps = label ? { "aria-label": label, role: "img" } : { "aria-hidden": true };
    const iconStyle = {
        ...(color ? { "--icon-color": color } : {}),
        "--expense-icon-size": `${size}px`,
    };
    const iconClassName = [
        "category-icon",
        `category-icon--${isDuotone ? "duotone" : "base"}`,
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
            <Icon aria-hidden="true" focusable="false" size={size}
                {...(isDuotone ? { weight: "duotone" } : { strokeWidth: 1.8 })} />
        </span>
    );
}
