# Personal Hub

React + Vite app for personal modules. The active module is `expenses`.

## Expenses Status

- Firebase Authentication session bootstrap is wired.
- Firestore settings init is wired at `users/{uid}/modules/expenses/settings/main`.
- Default expense data init creates the module root, one default cash wallet, and default expense/income categories.
- Categories, wallets, budgets, transactions, monthly stats, and dashboard aggregates are read from Firestore repositories.
- Transaction create/edit/void updates wallet balances and monthly stats.
- Credit card payments use transaction type `creditPayment`: subtract the source wallet, reduce credit-card debt, restore available credit, and do not add monthly expense.
- Wallet balance edits use the current business flow: first setup updates opening balance, later balance changes create adjustment transactions.
- Budget documents store monthly limits only; budget spending is derived from monthly stats.

## Development

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

More details for the expenses data model live in `src/modules/expenses/README.md`.
