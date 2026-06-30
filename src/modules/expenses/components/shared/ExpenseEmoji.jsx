const iconMap = {
    bank: "BN",
    bag: "SH",
    bus: "MV",
    card: "CR",
    chart: "BR",
    education: "ED",
    eye: "EY",
    family: "FM",
    finance: "FN",
    game: "GM",
    health: "HL",
    home: "HM",
    income: "IN",
    momo: "MO",
    more: "OT",
    saving: "SV",
    settings: "ST",
    swap: "TR",
    travel: "TV",
    utensils: "FD",
    wallet: "WL",
    work: "WK",
};

const emojiMap = {
    bank: "\u{1F3E6}",
    bag: "\u{1F6CD}\uFE0F",
    bus: "\u{1F68C}",
    card: "\u{1F4B3}",
    chart: "\u{1F4CA}",
    coffee: "\u2615",
    education: "\u{1F393}",
    eye: "\u{1F441}\uFE0F",
    family: "\u{1F46A}",
    finance: "\u{1F4B9}",
    food: "\u{1F37D}\uFE0F",
    fuel: "\u26FD",
    fun: "\u{1F3AE}",
    game: "\u{1F3AE}",
    health: "\u{1FA7A}",
    home: "\u{1F3E0}",
    income: "\u{1F4B0}",
    meal: "\u{1F372}",
    momo: "\u{1F4F1}",
    more: "\u{1F9FE}",
    movie: "\u{1F3AC}",
    saving: "\u{1FA99}",
    settings: "\u2699\uFE0F",
    shopping: "\u{1F6D2}",
    swap: "\u{1F501}",
    transfer: "\u2194\uFE0F",
    transport: "\u{1F68C}",
    travel: "\u2708\uFE0F",
    utensils: "\u{1F37D}\uFE0F",
    wallet: "\u{1F45B}",
    work: "\u{1F4BC}",
};

export default function ExpenseIcon({ appearance = "auto", className = "", icon = "more", label, color }) {
    const hasEmojiIcon = Object.hasOwn(emojiMap, icon);
    const resolvedAppearance = appearance === "auto" ? (hasEmojiIcon ? "emoji" : "label") : appearance;
    const icons = resolvedAppearance === "emoji" ? emojiMap : iconMap;

    return (
        <span
            className={`category-icon category-icon--${resolvedAppearance} ${className}`.trim()}
            aria-label={label}
            role="img"
            style={color ? { "--icon-color": color } : undefined}
        >
            {icons[icon] ?? icons.more}
        </span>
    );
}
