import MobileTransactionsView from '../components/mobile/MobileTransactionsView'

export default function TransactionsPage({
  navItems,
  onNavigate,
  transactions,
}) {
  return (
    <MobileTransactionsView
      navItems={navItems}
      onNavigate={onNavigate}
      transactions={transactions}
    />
  )
}
