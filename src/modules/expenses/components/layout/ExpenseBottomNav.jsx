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
                aria-current={item.id === activeId ? "page" : undefined}
                className={`expense-bottom-nav__item${item.id === activeId ? " is-active" : ""}`}
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                type="button"
            >
                <ExpenseIcon appearance="base" bare className="expense-bottom-nav__icon" icon={item.icon} size={22} />
                <span>{item.label}</span>
            </button>
        );
    };

    return (
        <nav aria-label="Điều hướng MoneyCare trên điện thoại" className="expense-bottom-nav">
            {leftItems.map(renderNavItem)}
            <button
                aria-label="Thêm giao dịch"
                aria-current={activeId === "add" ? "page" : undefined}
                className={`expense-bottom-nav__action${activeId === "add" ? " is-active" : ""}`}
                onClick={() => onNavigate?.("add")}
                type="button"
            >
                <ExpenseIcon appearance="base" bare icon="add" size={26} />
            </button>
            {rightItems.map(renderNavItem)}
        </nav>
    );
}
