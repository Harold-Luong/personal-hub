# Personal Hub

React + Vite app for personal modules. The active module is `expenses`.

## Expenses Status

- Firebase Authentication session bootstrap is wired.
- Firestore settings init is wired at `users/{uid}/modules/expenses/settings/main`.
- Default expense data init currently creates the module root, one default wallet, and default expense/income categories.
- Categories and wallets are read from Firestore repositories.
- Transactions, budgets, monthly stats, and some dashboard aggregates still use mock/projection data while their repositories are being built.

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
