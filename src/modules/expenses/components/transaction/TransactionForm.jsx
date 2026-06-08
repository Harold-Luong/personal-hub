export default function TransactionForm({ onSubmit }) {
  return (
    <form className="transaction-form" onSubmit={onSubmit}>
      <input name="title" type="text" placeholder="Title" />
      <input name="amount" type="number" placeholder="Amount" />
      <button type="submit">Save</button>
    </form>
  )
}
