import {
    HomeIcon,
    PlusIcon,
    ReportIcon,
    SettingsIcon,
    TransactionIcon,
} from "../../icon/ExpenseIcons";

const bottomNavIconMap = {
    dashboard: HomeIcon,
    transactions: TransactionIcon,
    report: ReportIcon,
    settings: SettingsIcon,
};

const bottomNavOrder = ["dashboard", "transactions", "report", "settings"];
const bottomNavLabelMap = {
    dashboard: "Tổng quan",
    transactions: "Giao dịch",
    report: "Báo cáo",
    settings: "Cài đặt",
};

export default function ExpenseBottomNav({
    items = [],
    activeId = "dashboard",
    onNavigate,
}) {
    const navItems = bottomNavOrder
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean);
    const leftItems = navItems.slice(0, 2);
    const rightItems = navItems.slice(2);

    const renderNavItem = (item) => {
        const Icon =
            bottomNavIconMap[item.id] ??
            bottomNavIconMap[item.icon] ??
            HomeIcon;

        return (
            <button
                aria-label={item.label || bottomNavLabelMap[item.id]}
                className={`expense-bottom-nav__item${item.id === activeId ? " is-active" : ""}`}
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                type="button"
            >
                <Icon size={22} />
                <span>{item.label}</span>
            </button>
        );
    };

    return (
        <nav className="expense-bottom-nav">
            {leftItems.map(renderNavItem)}
            <button
                aria-label="Them giao dich"
                className={`expense-bottom-nav__action${activeId === "add" ? " is-active" : ""}`}
                onClick={() => onNavigate?.("add")}
                type="button"
            >
                <PlusIcon size={30} />
            </button>
            {rightItems.map(renderNavItem)}
        </nav>
    );
}
