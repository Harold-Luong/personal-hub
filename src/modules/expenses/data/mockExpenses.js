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
    trend: 5.3,
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

export const mockCategorySpendingStats = {
  food: { amount: 1500000, percentage: 27 },
  home: { amount: 1100000, percentage: 20 },
  transport: { amount: 650000, percentage: 12 },
  shopping: { amount: 550000, percentage: 10 },
  health: { amount: 400000, percentage: 7 },
  education: { amount: 300000, percentage: 5 },
  fun: { amount: 350000, percentage: 6 },
  family: { amount: 250000, percentage: 4 },
  finance: { amount: 200000, percentage: 4 },
  work: { amount: 100000, percentage: 2 },
  travel: { amount: 100000, percentage: 2 },
  other: { amount: 50000, percentage: 1 },
}

export const mockTransactions = [
  {
    id: 'tx-1',
    title: 'Cafe sáng',
    subtitle: '08:30',
    category: 'food',
    icon: 'coffee',
    amount: -45000,
    date: '2026-06-08',
    time: '08:30',
    walletId: 'wallet-cash',
  },
  {
    id: 'tx-2',
    title: 'Ăn trưa',
    subtitle: '12:15',
    category: 'food',
    icon: 'meal',
    amount: -150000,
    date: '2026-06-08',
    time: '12:15',
    walletId: 'wallet-cash',
  },
  {
    id: 'tx-3',
    title: 'Xăng xe',
    subtitle: '18:20',
    category: 'transport',
    icon: 'fuel',
    amount: -100000,
    date: '2026-06-07',
    time: '18:20',
    walletId: 'wallet-cash',
  },
  {
    id: 'tx-4',
    title: 'Lương tháng 6',
    subtitle: '09:00',
    category: 'salary',
    icon: 'wallet',
    amount: 10000000,
    date: '2026-06-07',
    time: '09:00',
    walletId: 'wallet-bank',
  },
  {
    id: 'tx-5',
    title: 'Mua sắm',
    subtitle: '20:30',
    category: 'shopping',
    icon: 'shopping',
    amount: -200000,
    date: '2026-06-06',
    time: '20:30',
    walletId: 'wallet-bank',
  },
  {
    id: 'tx-6',
    title: 'Xem phim',
    subtitle: '19:00',
    category: 'fun',
    icon: 'movie',
    amount: -120000,
    date: '2026-06-06',
    time: '19:00',
    walletId: 'wallet-bank',
  },
  {
    id: 'tx-7',
    title: 'Ăn tối',
    subtitle: '20:15',
    category: 'food',
    icon: 'meal',
    amount: -80000,
    date: '2026-06-05',
    time: '20:15',
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

export const expenseNavItems = [
  { id: 'dashboard', label: '', icon: 'home' },
  { id: 'transactions', label: '', icon: 'swap' },
  { id: 'budget', label: '', icon: 'wallet' },
  { id: 'report', label: '', icon: 'chart' },
  { id: 'settings', label: '', icon: 'settings' },
]

export const scandinavianCategoryColors = [
  '#6B8F71', // sage green
  '#8FA6AC', // blue gray
  '#D9A441', // muted mustard
  '#C97964', // soft terracotta
  '#9B8FB8', // dusty lavender
  '#7E9F90', // eucalyptus
  '#B8A88A', // warm taupe
  '#E0B88A', // soft sand orange
  '#8797B2', // muted Nordic blue
  '#A7B89A', // moss light
  '#D08C7A', // salmon clay
  '#A8A29E', // stone gray
]

export const scandinavianCategoryColorPairs = [
  { color: '#6B8F71', background: '#EEF4EE' },
  { color: '#8FA6AC', background: '#EEF3F4' },
  { color: '#D9A441', background: '#FAF3E2' },
  { color: '#C97964', background: '#F8ECE8' },
  { color: '#9B8FB8', background: '#F2EFF7' },
  { color: '#7E9F90', background: '#EDF4F0' },
  { color: '#B8A88A', background: '#F5F1EA' },
  { color: '#E0B88A', background: '#FAF0E3' },
  { color: '#8797B2', background: '#EEF1F6' },
  { color: '#A7B89A', background: '#F0F5ED' },
  { color: '#D08C7A', background: '#F8EDEA' },
  { color: '#A8A29E', background: '#F3F2F1' },
]
