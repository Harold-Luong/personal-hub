import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import MobileDashboardSurface from "../../src/modules/expenses/components/mobile/MobileDashboardSurface";
import ExpenseSidebar from "../../src/modules/expenses/components/layout/ExpenseSidebar";
import ExpenseBottomNav from "../../src/modules/expenses/components/layout/ExpenseBottomNav";
import ExpenseHeader from "../../src/modules/expenses/components/layout/ExpenseHeader";
import SummaryCardList from "../../src/modules/expenses/components/shared/SummaryCardList";
import WalletCard from "../../src/modules/expenses/components/dashboard/WalletCard";
import DesktopTransactionDialog from "../../src/modules/expenses/components/desktop/DesktopTransactionDialog";
import SavingsTransferDialog from "../../src/modules/expenses/components/savings/SavingsTransferDialog";
import ExpenseButton from "../../src/modules/expenses/components/shared/ExpenseButton";
import CreditCardPaymentDialog from "../../src/modules/expenses/components/wallet/CreditCardPaymentDialog";
import { expenseNavItems } from "../../src/modules/expenses/constants/expenseMetadata";
import { useExpensePreferencesStore } from "../../src/stores/expensePreferencesStore";
import "../../src/index.css";
import "../../src/modules/expenses/styles/expenses.scss";

const wallets = [
    { id: "cash", name: "Tiền mặt", type: "cash", currency: "VND", balance: 2500000, icon: "cash", isBalanceInitialized: true },
    { id: "bank", name: "Tài khoản thanh toán", type: "bank", currency: "VND", balance: 18000000, icon: "bank", isBalanceInitialized: true },
    { id: "usd", name: "Ví USD", type: "bank", currency: "USD", balance: 1000, icon: "bank", isBalanceInitialized: true },
    { id: "saving", name: "Quỹ dự phòng", type: "saving", currency: "VND", balance: 12000000, icon: "saving", isBalanceInitialized: true },
];
const categories = [{ id: "food", name: "Ăn uống", type: "expense", icon: "food" }];
const summary = [
    { id: "balance", label: "Tổng số dư", value: 32500000, icon: "wallet" },
    { id: "income", label: "Thu nhập tháng này", value: 25000000, icon: "income", trend: 5 },
    { id: "expense", label: "Chi tiêu tháng này", value: 8500000, icon: "card", tone: "expense", trend: -12 },
];

export default function ExpensesFixture() {
    const [dialog, setDialog] = useState("");
    const [activeId, setActiveId] = useState("dashboard");
    const [theme, setTheme] = useState("sage");
    const [submitted, setSubmitted] = useState(null);
    const openTransaction = () => setDialog("transaction");
    const navigate = (id) => id === "add" ? openTransaction() : setActiveId(id);
    const content = <>
        <ExpenseHeader title="Tổng quan" subtitle="Tháng 10, 2026" onAddTransactionClick={openTransaction} />
        <SummaryCardList items={summary} />
        <WalletCard wallets={wallets} onManageWallet={() => setActiveId("wallets")} />
        <ExpenseButton className="expense-header__add" icon="saving" label="Nạp tiền tiết kiệm" onClick={() => setDialog("saving")} />
        <ExpenseButton label="Đổi bộ icon" onClick={() => useExpensePreferencesStore.getState().updateExpensePreference("iconSet", "base")} />
        <ExpenseButton label="Thanh toán thẻ EUR" onClick={() => setDialog("credit")} />
        <ExpenseButton label="Sửa giao dịch múi giờ Việt Nam" onClick={() => setDialog("edit")} />
        <output aria-label="Dữ liệu gửi">{submitted ? JSON.stringify(submitted) : ""}</output>
    </>;
    const onSubmit = async (input) => { setSubmitted(input); setDialog(""); };
    return <div className="expenses-page" data-theme={theme} data-active-page={activeId}>
        <div className="desktop-dashboard-surface">
            <ExpenseSidebar items={expenseNavItems} activeId={activeId} onNavigate={navigate} theme={theme}
                onToggleTheme={() => setTheme(theme === "sage" ? "fjord" : "sage")} />
            <main className="desktop-dashboard-surface__main">{content}</main>
        </div>
        <MobileDashboardSurface summary={summary} wallets={wallets} budgets={[]} transactions={[]}
            monthLabel="Tháng 10" onManageWallet={() => setActiveId("wallets")}
            onManageBudget={() => setActiveId("budgets")} onManageSavings={() => setDialog("saving")}
            onViewTransactions={() => setActiveId("transactions")} />
        <ExpenseBottomNav items={expenseNavItems} activeId={activeId} onNavigate={navigate} />
        {dialog === "transaction" && <DesktopTransactionDialog categories={categories} wallets={wallets} onCancel={() => setDialog("")} onSubmit={onSubmit} />}
        {dialog === "edit" && <DesktopTransactionDialog categories={categories} wallets={wallets}
            initialTransaction={{ id: "existing", type: "expense", amountMinor: 100, title: "Ăn sáng", categoryId: "food",
                walletId: "cash", date: "2026-10-23", time: "08:00", timezone: "Asia/Ho_Chi_Minh" }}
            onCancel={() => setDialog("")} onSubmit={onSubmit} />}
        {dialog === "saving" && <SavingsTransferDialog kind="deposit" wallets={wallets} onCancel={() => setDialog("")} onSubmit={onSubmit} />}
        {dialog === "credit" && <CreditCardPaymentDialog card={{ id: "card", name: "Thẻ du lịch", currency: "EUR", outstandingDebt: 100 }}
            sourceWallets={wallets.filter((wallet) => wallet.type !== "saving")} onCancel={() => setDialog("")} onSubmit={onSubmit} />}
    </div>;
}
createRoot(document.getElementById("root")).render(<StrictMode><ExpensesFixture /></StrictMode>);
