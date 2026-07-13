import ExpenseIcon from "../../icon/ExpenseIcon";
import { expenseBottomNavOrder } from "../../constants/expenseMetadata";

export default function ExpenseBottomNav({ items = [], activeId = "dashboard", onNavigate }) {
    const navItems = expenseBottomNavOrder.map((id) => items.find((item) => item.id === id)).filter(Boolean);
    const leftItems = navItems.slice(0, 2);
    const rightItems = navItems.slice(2);

    const renderNavItem = (item) => {
        return (
            <button
                aria-label={item.label}
                className={`expense-bottom-nav__item${item.id === activeId ? " is-active" : ""}`}
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                type="button"
            >
                <ExpenseIcon bare className="expense-bottom-nav__icon" icon={item.icon} label={item.label} size={22} />
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
                <ExpenseIcon bare icon="add" label="Thêm giao dịch" size={30} />
            </button>
            {rightItems.map(renderNavItem)}
        </nav>
    );
}
