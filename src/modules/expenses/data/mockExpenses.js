export const mockSummary = [
  {
    id: 'balance',
    label: 'Tong so du',
    value: 12450000,
    trend: 8.5,
    tone: 'positive',
    icon: 'eye',
  },
  {
    id: 'income',
    label: 'Tong thu nhap',
    value: 18000000,
    trend: 12.4,
    tone: 'positive',
    icon: 'wallet',
  },
  {
    id: 'expense',
    label: 'Tong chi tieu',
    value: 5550000,
    trend: -5.3,
    tone: 'danger',
    icon: 'card',
  },
  {
    id: 'saving',
    label: 'Tiet kiem',
    value: 6900000,
    trend: 15.8,
    tone: 'warning',
    icon: 'saving',
  },
]

export const mockCategories = [
  {
    id: 'food',
    name: 'An uong',
    amount: 2100000,
    percentage: 37,
    color: '#f4a340',
    icon: 'utensils',
  },
  {
    id: 'home',
    name: 'Nha cua',
    amount: 1200000,
    percentage: 21,
    color: '#4f93d7',
    icon: 'home',
  },
  {
    id: 'shopping',
    name: 'Mua sam',
    amount: 900000,
    percentage: 16,
    color: '#ef6f7e',
    icon: 'bag',
  },
  {
    id: 'transport',
    name: 'Di chuyen',
    amount: 850000,
    percentage: 15,
    color: '#56b879',
    icon: 'bus',
  },
  {
    id: 'fun',
    name: 'Giai tri',
    amount: 500000,
    percentage: 9,
    color: '#9b7bd8',
    icon: 'game',
  },
  {
    id: 'other',
    name: 'Khac',
    amount: 100000,
    percentage: 2,
    color: '#b8bec8',
    icon: 'more',
  },
]

export const mockTransactions = [
  {
    id: 'tx-1',
    title: 'Ca phe Highlands',
    subtitle: 'Hom nay, 08:30',
    category: 'food',
    amount: -45000,
    date: '2026-06-12',
    walletId: 'wallet-cash',
  },
  {
    id: 'tx-2',
    title: 'Luong thang 6',
    subtitle: 'Hom qua, 09:00',
    category: 'income',
    amount: 18000000,
    date: '2026-06-11',
    walletId: 'wallet-bank',
  },
  {
    id: 'tx-3',
    title: 'Sieu thi WinMart',
    subtitle: '12/06/2026',
    category: 'shopping',
    amount: -320000,
    date: '2026-06-12',
    walletId: 'wallet-bank',
  },
  {
    id: 'tx-4',
    title: 'Tien dien thang 6',
    subtitle: '10/06/2026',
    category: 'home',
    amount: -550000,
    date: '2026-06-10',
    walletId: 'wallet-bank',
  },
  {
    id: 'tx-5',
    title: 'Grab Bike',
    subtitle: '09/06/2026',
    category: 'transport',
    amount: -35000,
    date: '2026-06-09',
    walletId: 'wallet-cash',
  },
]

export const mockBudgets = [
  {
    id: 'budget-food',
    category: 'An uong',
    amount: 2100000,
    limit: 3000000,
    color: '#f4a340',
    icon: 'utensils',
  },
  {
    id: 'budget-home',
    category: 'Nha cua',
    amount: 1200000,
    limit: 2000000,
    color: '#4f93d7',
    icon: 'home',
  },
  {
    id: 'budget-shopping',
    category: 'Mua sam',
    amount: 900000,
    limit: 1500000,
    color: '#56b879',
    icon: 'bag',
  },
  {
    id: 'budget-fun',
    category: 'Giai tri',
    amount: 500000,
    limit: 1000000,
    color: '#9b7bd8',
    icon: 'game',
  },
]

export const mockWallets = [
  {
    id: 'wallet-cash',
    name: 'Vi tien mat',
    balance: 3200000,
    icon: 'wallet',
  },
  {
    id: 'wallet-bank',
    name: 'ACB Bank',
    balance: 7250000,
    icon: 'bank',
  },
  {
    id: 'wallet-momo',
    name: 'MOMO',
    balance: 2000000,
    icon: 'momo',
  },
]

export const expenseNavItems = [
  { id: 'dashboard', label: 'Tong quan', icon: 'home' },
  { id: 'transactions', label: 'Giao dich', icon: 'swap' },
  { id: 'budget', label: 'Ngan sach', icon: 'wallet' },
  { id: 'report', label: 'Bao cao', icon: 'chart' },
  { id: 'settings', label: 'Cai dat', icon: 'settings' },
]
