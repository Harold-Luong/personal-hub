import CategoryIcon from "../shared/CategoryIcon";

export default function ExpenseSidebar({ items = [], activeId = "dashboard", user }) {
    const accountName = user?.displayName || user?.email || "Tài khoản";
console.log(items)
    return (
        <aside className="expense-sidebar">
            <div className="expense-sidebar__brand">
                <span className="expense-sidebar__logo">MC</span>
                <strong>MoneyCare</strong>
            </div>
            <section className="expense-sidebar__profile">
                <span>Xin chào,</span>
                <strong>{accountName}</strong>
            
            </section>
            <nav>
                {items.map((item) => (
                    <button className={item.id === activeId ? "is-active" : ""} key={item.id} type="button">
                        <CategoryIcon icon={item.icon} label={item.label} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
}
