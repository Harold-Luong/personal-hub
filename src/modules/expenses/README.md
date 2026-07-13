# Expenses Module - Firestore Data Design

## 1. Mục tiêu

Tài liệu này mô tả thiết kế dữ liệu và các luồng nghiệp vụ cho module
`expenses` khi chuyển từ mock data sang Firebase Authentication và Cloud
Firestore.

Trạng thái hiện tại không còn chỉ là thiết kế. App đã có Firebase SDK,
Firestore Security Rules, init settings/categories/wallet mặc định và các
repository đọc categories/wallets/budgets/transactions/monthlyStats từ
Firestore. Add transaction đã ghi dữ liệu thật và cập nhật số dư ví. Dashboard
không còn dùng mock financial data trong runtime; dữ liệu tổng hợp vẫn được
dựng từ projection để đọc nhanh.

Mục tiêu của thiết kế:

- Dữ liệu tài chính được tách riêng theo từng người dùng.
- Transaction là nguồn dữ liệu gốc duy nhất cho thu, chi, chuyển khoản và điều
  chỉnh số dư.
- Dashboard đọc nhanh mà không phải tải toàn bộ lịch sử giao dịch.
- Các thay đổi liên quan đến số dư và thống kê được cập nhật nguyên tử.
- Dữ liệu vẫn nhất quán khi tạo, sửa hoặc hủy giao dịch.
- Theme và tùy chọn giao diện được đồng bộ giữa các thiết bị.
- Settings desktop/mobile dùng chung xử lý cho định dạng, danh mục, ví và CSV.
- Tên hiển thị được đồng bộ giữa Firebase Authentication và user profile.
- Có thể mở rộng thêm báo cáo, ngân sách, tìm kiếm và nhiều loại tiền tệ.

## 2. Hiện trạng

`DashboardPage` đọc categories, wallets, budgets, monthlyStats và transactions
từ Firestore, giữ view model trong local state và truyền dữ liệu thật xuống các
view mobile và desktop qua props.

Các nhóm đã chuyển sang Firestore:

- `settings/main`
- `wallets`
- `categories`
- `budgets`
- `monthlyStats`
- `transactions`

Một số dữ liệu hiện vẫn là dữ liệu dẫn xuất/projection:

- Category spending trên dashboard được tính từ `monthlyStats.categoryExpenseMinor`.
- `budget.amount` là số tiền đã chi, không phải cấu hình ngân sách.
  Các giá trị dẫn xuất này không được coi là nguồn sự thật.

### 2.1 Bản đồ nghiệp vụ hiện tại

Module expenses đang dùng các nguồn dữ liệu chính sau:

- `wallets`: metadata ví và projection `balance`.
- `transactions`: lịch sử thay đổi tiền; đây là nguồn sự thật cho thu, chi,
  chuyển khoản và điều chỉnh số dư.
- `monthlyStats`: projection theo tháng để dashboard/report đọc nhanh.
- `budgets`: cấu hình hạn mức theo tháng và expense category.
- `categories`: metadata danh mục, được snapshot vào transaction khi tạo/sửa.
- `settings/main`: theme, currency, timezone, default wallet và tùy chọn UI.

Quan hệ nghiệp vụ quan trọng:

- Một expense/income transaction tham chiếu một wallet qua `walletId` và một
  category qua `categoryId`.
- Một transfer transaction tham chiếu hai wallet qua `fromWalletId` và
  `toWalletId`.
- Một `creditPayment` transaction cũng tham chiếu hai wallet qua `fromWalletId`
  và `toWalletId`, nhưng `toWalletId` phải là wallet `credit-card`.
- Một adjustment transaction tham chiếu một wallet qua `walletId`, có
  `adjustmentDirection` để xác định tăng hoặc giảm số dư.
- `walletIds` là mảng denormalized để query lịch sử theo ví, bao gồm cả
  transfer, `creditPayment` và adjustment.
- Transaction lưu snapshot wallet/category để lịch sử vẫn hiển thị đúng sau khi
  wallet/category đổi tên, đổi màu hoặc bị archive.
- Budget không giữ số đã chi. UI ghép `budgets.limitMinor` với
  `monthlyStats.categoryExpenseMinor[categoryId]` để tính phần trăm sử dụng.

Luồng tiền hiện tại:

1. Lần đăng nhập đầu tiên: sau khi tải ví thành công, UI bắt buộc hoàn tất ví
   mặc định placeholder; số dư ban đầu phải lớn hơn `0` và được lưu trực tiếp
   vào `initialBalance`/`balance`, không tạo transaction.
2. Tạo expense: tạo transaction, tăng `monthlyStats.expenseMinor`, tăng
   spending của category. Nếu dùng wallet thường thì trừ `wallet.balance`; nếu
   dùng `credit-card` thì tăng `outstandingDebt` và giảm `availableCredit`.
3. Tạo income: tạo transaction, cộng `wallet.balance`, tăng
   `monthlyStats.incomeMinor`, tăng income của category.
4. Tạo transfer: tạo transaction, trừ ví nguồn, cộng ví đích, không đổi
   income/expense report.
5. Tạo `creditPayment`: tạo transaction "Thanh toán thẻ tín dụng", trừ
   `fromWalletId`, giảm `outstandingDebt` của credit-card ở `toWalletId`, tăng
   `availableCredit`, không tăng `monthlyStats.expenseMinor` hoặc budget spent vì
   khoản chi đã được ghi lúc quẹt thẻ.
6. Sửa transaction: đảo toàn bộ tác động cũ, áp tác động mới, cập nhật wallet và
   monthlyStats liên quan.
7. Xóa transaction: không xóa document; chuyển `status` sang `voided` và đảo tác
   động tài chính.
8. Sửa số dư ví chưa có active transaction: cập nhật `initialBalance` và
   `balance`, không tạo transaction.
9. Sửa số dư ví đã có active transaction: tạo transaction `adjustment`, cập nhật
   `wallet.balance`, không đổi `monthlyStats`.
10. Archive wallet: chỉ cho archive ví không phải default, không phải ví active
   cuối cùng và không còn `balance`/`outstandingDebt`.

## 3. Các quyết định chính

### 3.1 Phạm vi dữ liệu theo user

Mỗi người dùng được xác định bằng Firebase Authentication `uid`.

Toàn bộ dữ liệu expenses của một người dùng nằm dưới:

```text
users/{uid}
```

Thiết kế này giúp Security Rules đơn giản, tránh query lẫn dữ liệu giữa các
user và phù hợp với ứng dụng quản lý tài chính cá nhân.

### 3.2 Transaction là nguồn sự thật

Transactions là nguồn dữ liệu gốc cho:

- Số dư ví.
- Tổng thu nhập.
- Tổng chi tiêu.
- Chi tiêu theo danh mục.
- Mức sử dụng ngân sách.
- Báo cáo theo ngày, tháng và năm.
- Adjustment số dư cần audit nhưng không thuộc income/expense report.

`wallet.balance` và `monthlyStats` là projection được lưu để tăng
tốc độ đọc. Hai loại dữ liệu này phải có khả năng rebuild từ transactions.

### 3.3 Tiền được lưu bằng số nguyên

Không dùng số thực cho tiền.

```js
amountMinor: 150000;
```

Với VND, `amountMinor` chính là số tiền VND. Tên field vẫn có hậu tố `Minor`
để tương thích nếu sau này hỗ trợ currency có phần thập phân như USD.

Quy ước:

- `amountMinor` luôn là số nguyên dương.
- Chiều tăng hoặc giảm được xác định bằng `type`.
- Không dùng số âm để phân biệt income và expense trong Firestore.
- UI adapter có thể chuyển expense thành số âm để tương thích component cũ.

### 3.4 Không hard-delete dữ liệu đã được tham chiếu

Wallet và category đã được sử dụng trong transaction chỉ được archive.

Transaction không bị xóa vật lý trong flow thông thường. Khi người dùng xóa,
transaction chuyển sang trạng thái `voided` và tác động tài chính được đảo
ngược.

### 3.5 Các thay đổi tài chính phải nguyên tử

Tạo, sửa hoặc hủy transaction phải cập nhật cùng lúc:

- Transaction document.
- Số dư wallet liên quan.
- Monthly statistics liên quan nếu transaction thuộc income/expense/transfer/
  `creditPayment`; `creditPayment` chỉ được tính vào transaction count, không
  tăng income/expense/category aggregate.

Implementation hiện tại thực hiện các thao tác này trong repository client bằng
Firestore `runTransaction`/batch và được ràng buộc bởi Firestore Security Rules.
Nếu chuyển sang backend/Callable Function sau này, contract nghiệp vụ vẫn giữ
nguyên.

## 4. Cấu trúc Firestore

```text
users/{uid}
├── displayName, email, photoURL, timestamps
└── modules/
    └── expenses
        ├── settings/
        │   └── main
        ├── wallets/{walletId}
        ├── categories/{categoryId}
        ├── transactions/{transactionId}
        ├── budgets/{budgetId}
        └── monthlyStats/{monthKey}
```

Ví dụ:

```text
users/abc123/modules/expenses/settings/main
users/abc123/modules/expenses/wallets/wallet-cash
users/abc123/modules/expenses/categories/food
users/abc123/modules/expenses/transactions/4K9x...
users/abc123/modules/expenses/budgets/2026-06_food
users/abc123/modules/expenses/monthlyStats/2026-06
```

Không dùng ID transaction tăng tuần tự như `tx-1`, `tx-2`. Sử dụng Firestore
auto ID hoặc UUID ngẫu nhiên.

## 5. Chi tiết entity

### 5.1 User profile

Đường dẫn:

```text
users/{uid}
```

Shape đề xuất:

```js
{
  displayName: "Đức Trọng",
  email: "user@example.com",
  photoURL: null,
  createdAt: Timestamp,
  initializedAt: Timestamp,
  updatedAt: Timestamp
}
```

Profile chứa thông tin chung của user. Các thiết lập riêng của expenses không
đặt trực tiếp trong document này.

Khi đổi tên trong Settings, client cập nhật Firebase Authentication trước, sau
đó cập nhật `users/{uid}.displayName` và `updatedAt`. Nếu Firestore write lỗi,
Auth profile được rollback về tên trước đó để tránh hai nguồn dữ liệu lệch nhau.
Security Rules chỉ cho owner thay đổi `displayName` và `updatedAt`; email,
photoURL và các timestamp khởi tạo phải được giữ nguyên.

### 5.2 Expense settings

Đường dẫn:

```text
users/{uid}/modules/expenses/settings/main
```

Shape đề xuất:

```js
{
  theme: "sage",
  iconSet: "emoji",
  currency: "VND",
  timezone: "Asia/Bangkok",
  hideBalance: false,
  notificationsEnabled: true,
  defaultWalletId: "wallet-cash",
  defaultCategoryId: "food",
  amountFormat: "standard",
  dateFormat: "dd/MM/yyyy",
  hiddenCategoryIds: [],
  hiddenWalletIds: [],
  updatedAt: Timestamp
}
```

Các giá trị theme hợp lệ ở phiên bản hiện tại:

```text
sage
fjord
clay
blossom
vintage
retro
```

Quy tắc:

- Theme là preference của user và nên được lưu trên Firestore.
- `iconSet` nhận `emoji` hoặc `base`; lựa chọn này áp dụng đồng bộ cho icon nội dung,
  điều hướng và thao tác, trong đó `base` là bộ SVG Scandinavian. Riêng thao tác
  đăng xuất luôn dùng base icon để giữ hình thức nhất quán và không dùng emoji cửa.
- Theme cũng được cache trong `localStorage` để tránh nháy giao diện lúc app
  khởi động.
- Khi chưa đăng nhập, theme chỉ được lưu trong `localStorage`.
- Khi đã đăng nhập, Firestore là nguồn sự thật và `localStorage` là cache.
- Client có thể cập nhật settings trực tiếp nếu Security Rules whitelist field
  và giá trị hợp lệ.
- `defaultCategoryId` chọn sẵn category expense khi mở form giao dịch mới.
- `defaultWalletId` kết hợp với `wallet.isDefault` để chọn sẵn ví trong form.
- `hiddenCategoryIds` và `hiddenWalletIds` chỉ điều khiển hiển thị; chúng không
  archive document và không làm mất lịch sử giao dịch.
- `amountFormat` nhận `standard` hoặc `compact`.
- `dateFormat` nhận `dd/MM/yyyy`, `MM/dd/yyyy` hoặc `yyyy-MM-dd`.

### 5.3 Wallet

Đường dẫn:

```text
users/{uid}/modules/expenses/wallets/{walletId}
```

Shape đề xuất:

```js
{
  name: "ACB Bank",
  type: "bank",
  icon: "bank",
  color: "#4f93d7",
  balance: 7250000,
  initialBalance: 5000000,
  currency: "VND",
  order: 20,
  isDefault: false,
  isArchived: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

`type` có thể nhận:

```text
cash
bank
eWallet
credit-card
saving
other
```

Quy tắc:

- `initialBalance` chỉ là số dư ban đầu khi tạo hoặc import wallet.
- `balance` là projection được cập nhật cùng transaction.
- Wallet `credit-card` không dùng số dư ban đầu; `balance` và `initialBalance`
  luôn bằng `0`, còn hạn mức và dư nợ được lưu bằng `creditLimit`,
  `outstandingDebt`, `availableCredit`.
- `color` là màu nhận diện của ví, không phụ thuộc trực tiếp vào theme.
- `icon` là key trong `CategoryIcon`, ví dụ `wallet`, `bank`, `momo`, `card`,
  `saving`, `more`.
- `order` dùng để sắp xếp ví trong UI.
- `isDefault` đánh dấu ví mặc định của user.
- `isBalanceInitialized` đánh dấu số dư ví thường đã được user neo theo số dư
  thực tế. Ví mặc định auto-init có thể bắt đầu bằng `false` và `balance = 0`.
- Tên wallet đang hoạt động phải là duy nhất theo user; `type` wallet được phép trùng.
- Transaction mới không được tham chiếu wallet đã archive.
- Wallet có transaction cũ không được hard-delete.
- Số dư tổng của user bằng tổng `balance` của các wallet đang hoạt
  động, tùy quy tắc có tính credit wallet hay không.

#### Wallet balance và archive policy

`wallet.balance` là projection hiện tại, không phải lịch sử. Code chỉ thay đổi
projection này qua các flow nghiệp vụ có kiểm soát:

- Tạo wallet mới: `balance = initialBalance`.
- Ví mặc định auto-init có thể bắt đầu với `balance = 0` và
  `isBalanceInitialized = false`; giao dịch vẫn được ghi bình thường và balance
  có thể âm/dương theo biến động từ mốc 0.
- Nếu user tạo ví mới khi ví active duy nhất là ví auto-init chưa initialized,
  chưa có giao dịch và `balance = 0`, ví mới sẽ tự trở thành ví default.
- Tạo credit-card wallet: nhập `creditLimit`, đặt `outstandingDebt = 0` và
  `availableCredit = creditLimit`; không tạo opening balance.
- Khi user lần đầu thiết lập số dư cho ví chưa initialized, form nhận
  `initialBalance`; repository tính `balance = initialBalance + netMovement(active
  transactions)`, đặt `isBalanceInitialized = true` và không tạo transaction
  `adjustment`.
- Sửa balance của wallet chưa có active transaction: cập nhật trực tiếp
  `initialBalance` và `balance`; đây là bước thiết lập số dư ban đầu.
- Sửa balance của wallet đã có active transaction: tạo transaction
  `adjustment` với `adjustmentDirection`, rồi cập nhật `balance`.
- Expense/income/transfer/creditPayment/void transaction: cập nhật balance hoặc
  credit-card projection bằng delta.

Archive wallet hiện tại có các điều kiện bắt buộc:

- Không phải wallet default.
- Không phải wallet active cuối cùng.
- `balance == 0`.
- Không hard-delete document; chỉ set `isArchived = true`.

Wallet đã archive không được dùng để tạo transaction mới hoặc update transaction
sang wallet đó. Transaction lịch sử vẫn giữ `walletId`, `walletIds`,
`walletSnapshot`, `fromWalletSnapshot` và `toWalletSnapshot` để audit, filter và
hiển thị lịch sử.

### 5.4 Category

Đường dẫn:

```text
users/{uid}/modules/expenses/categories/{categoryId}
```

Shape đề xuất:

```js
{
  name: "Ăn uống",
  type: "expense",
  icon: "utensils",
  color: "#f4a340",
  sortOrder: 10,
  isSystem: false,
  isArchived: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

`type` chỉ nhận:

```text
expense
income
```

Quy tắc:

- Transfer không sử dụng category.
- Category expense chỉ dùng cho expense transaction.
- Category income chỉ dùng cho income transaction.
- Không lưu `amount` hoặc `percentage` trong category.
- Category đã được sử dụng chỉ được archive.
- Tên category có thể thay đổi mà lịch sử vẫn hiển thị được nhờ
  `categorySnapshot` trong transaction.

### 5.5 Transaction

Đường dẫn:

```text
users/{uid}/modules/expenses/transactions/{transactionId}
```

Shape chung:

```js
{
  type: "expense",
  amountMinor: 150000,
  currency: "VND",

  title: "Ăn trưa",
  titleNormalized: "an trua",
  note: "",

  categoryId: "food",
  walletId: "wallet-cash",
  fromWalletId: null,
  toWalletId: null,
  walletIds: ["wallet-cash"],

  occurredAt: Timestamp,
  localDate: "2026-06-11",
  monthKey: "2026-06",
  timezone: "Asia/Bangkok",

  categorySnapshot: {
    name: "Ăn uống",
    icon: "utensils",
    color: "#f4a340"
  },
  walletSnapshot: {
    name: "Ví tiền mặt",
    icon: "wallet"
  },

  status: "active",
  idempotencyKey: "client-generated-uuid",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  voidedAt: null
}
```

Các loại transaction:

```text
expense
income
transfer
creditPayment
adjustment
```

#### Expense transaction

```js
{
  type: "expense",
  amountMinor: 150000,
  categoryId: "food",
  walletId: "wallet-cash",
  walletIds: ["wallet-cash"],
  fromWalletId: null,
  toWalletId: null
}
```

Tác động:

- Trừ `amountMinor` khỏi wallet.
- Tăng `monthlyStats.expenseMinor`.
- Tăng tổng chi của category trong tháng.

Nếu wallet là `credit-card`, transaction vẫn là expense và vẫn tính ngân sách,
nhưng không trừ tiền ngân hàng ngay. Repository tăng `outstandingDebt` của thẻ
và giảm `availableCredit`; flow thanh toán thẻ sẽ xử lý sau bằng một action riêng.

#### Income transaction

```js
{
  type: "income",
  amountMinor: 10000000,
  categoryId: "salary",
  walletId: "wallet-bank",
  walletIds: ["wallet-bank"],
  fromWalletId: null,
  toWalletId: null
}
```

Tác động:

- Cộng `amountMinor` vào wallet.
- Tăng `monthlyStats.incomeMinor`.
- Không tăng expense statistics.

#### Transfer transaction

```js
{
  type: "transfer",
  amountMinor: 2000000,
  categoryId: null,
  walletId: null,
  fromWalletId: "wallet-bank",
  toWalletId: "wallet-cash",
  walletIds: ["wallet-bank", "wallet-cash"]
}
```

Tác động:

- Trừ tiền khỏi `fromWalletId`.
- Cộng tiền vào `toWalletId`.
- Không tính là income hoặc expense.
- Không ảnh hưởng ngân sách.
- Hai wallet phải khác nhau và cùng currency trong phiên bản đầu.

#### Credit payment transaction

`creditPayment` là flow "Thanh toán thẻ tín dụng". Đây không phải expense mới vì
khoản chi đã được ghi ở transaction expense lúc dùng thẻ.

```js
{
  type: "creditPayment",
  amountMinor: 1500000,
  categoryId: null,
  walletId: null,
  fromWalletId: "wallet-bank",
  toWalletId: "wallet-credit",
  walletIds: ["wallet-bank", "wallet-credit"]
}
```

Tác động:

- Trừ `amountMinor` khỏi ví nguồn thường, ví dụ bank/eWallet/cash.
- Giảm `outstandingDebt` của ví `credit-card` đích.
- Tăng `availableCredit` của ví `credit-card` đích.
- Không tăng `monthlyStats.expenseMinor`.
- Không tăng `monthlyStats.categoryExpenseMinor`.
- Không ảnh hưởng budget spent.
- Có thể tăng `transactionCount` để lịch sử tháng vẫn phản ánh có một giao dịch
  thanh toán thẻ.

#### Adjustment transaction

Adjustment là transaction nội bộ dùng khi user sửa số dư hiện tại của một ví đã
có active transaction. Nó giữ audit trail cho chênh lệch số dư nhưng không được
tính là thu nhập hoặc chi tiêu.

```js
{
  type: "adjustment",
  adjustmentDirection: "increase",
  amountMinor: 200000,
  categoryId: null,
  walletId: "wallet-cash",
  walletIds: ["wallet-cash"],
  fromWalletId: null,
  toWalletId: null
}
```

Tác động:

- `adjustmentDirection: "increase"` cộng `amountMinor` vào wallet.
- `adjustmentDirection: "decrease"` trừ `amountMinor` khỏi wallet.
- Không đổi `monthlyStats.incomeMinor`.
- Không đổi `monthlyStats.expenseMinor`.
- Không ảnh hưởng budget spent.
- Có thể void để đảo tác động balance.

`walletIds` là field denormalized để query lịch sử của một wallet bằng
`array-contains`.

### 5.6 Budget

Đường dẫn:

```text
users/{uid}/modules/expenses/budgets/{budgetId}
```

ID đề xuất:

```text
{monthKey}_{categoryId}
```

Ví dụ:

```text
2026-06_food
```

Shape:

```js
{
  monthKey: "2026-06",
  categoryId: "food",
  limitMinor: 3000000,
  alertThreshold: 80,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Quy tắc:

- Mỗi category chỉ có tối đa một budget trong một tháng.
- Budget chỉ dùng category loại `expense`.
- Không lưu số đã chi trong budget.
- `spentMinor` được lấy từ `monthlyStats.categoryExpenseMinor[categoryId]`.
- Có thể copy budget tháng trước sang tháng mới bằng một explicit action.

View model trả về UI:

```js
{
  id: "2026-06_food",
  categoryId: "food",
  category: "Ăn uống",
  amount: 2100000,
  limit: 3000000,
  alertThreshold: 80,
  color: "#f4a340",
  icon: "utensils"
}
```

`amount` trong view model là dữ liệu dẫn xuất, không phải field lưu trong
budget document.

### 5.7 Monthly statistics

Đường dẫn:

```text
users/{uid}/modules/expenses/monthlyStats/{monthKey}
```

Ví dụ:

```text
users/abc123/modules/expenses/monthlyStats/2026-06
```

Shape:

```js
{
  monthKey: "2026-06",
  incomeMinor: 18000000,
  expenseMinor: 5550000,
  netMinor: 12450000,
  transactionCount: 42,
  categoryExpenseMinor: {
    food: 1500000,
    home: 1100000,
    transport: 650000
  },
  categoryIncomeMinor: {
    salary: 18000000
  },
  updatedAt: Timestamp
}
```

Quy tắc:

- Chỉ tính transaction có `status == "active"`.
- Transfer không ảnh hưởng income, expense hoặc net.
- Adjustment không ảnh hưởng income, expense, net, category aggregate hoặc
  `transactionCount` trong `monthlyStats`.
- `netMinor = incomeMinor - expenseMinor`.
- Statistics phải được cập nhật cùng transaction mutation.
- Có admin job hoặc script để rebuild statistics khi cần.
- Không cho client tùy ý ghi document này.

Với số lượng category lớn, có thể chuyển category aggregates thành
subcollection:

```text
monthlyStats/{monthKey}/categories/{categoryId}
```

Phiên bản đầu có thể dùng map vì số category cá nhân thường nhỏ.

## 6. Quan hệ dữ liệu

```text
User
 ├── 1 - 1 ExpenseSettings
 ├── 1 - N Wallet
 ├── 1 - N Category
 ├── 1 - N Transaction
 ├── 1 - N Budget
 └── 1 - N MonthlyStats

Expense/Income Transaction
 ├── N - 1 Wallet
 └── N - 1 Category

Transfer Transaction
 ├── N - 1 Source Wallet
 └── N - 1 Destination Wallet

Adjustment Transaction
 └── N - 1 Wallet

Budget
 └── N - 1 Expense Category

MonthlyStats
 └── derived from Transactions
```

Firestore không có join như SQL. Vì vậy:

- Quan hệ được lưu bằng ID.
- Các thông tin cần render thường xuyên được snapshot vào transaction.
- UI kết hợp dữ liệu qua repository/adapter.
- Không lưu DocumentReference nếu string ID giúp rules, import và migration đơn
  giản hơn.

## 7. Dữ liệu gốc và dữ liệu dẫn xuất

| Dữ liệu                | Nguồn sự thật                       | Cách lấy                   |
| ---------------------- | ----------------------------------- | -------------------------- |
| Transaction history    | `transactions`                      | Query theo thời gian       |
| Wallet metadata        | `wallets`                           | Đọc collection wallets     |
| Wallet balance         | Projection trên wallet              | Cập nhật cùng transaction  |
| Category metadata      | `categories`                        | Đọc collection categories  |
| Monthly income/expense | `monthlyStats`                      | Projection từ transactions |
| Category spending      | `monthlyStats.categoryExpenseMinor` | Projection                 |
| Balance adjustment     | `transactions` type `adjustment`    | Không tính vào stats       |
| Budget limit           | `budgets`                           | Đọc theo `monthKey`        |
| Budget spent           | `monthlyStats`                      | Kết hợp theo `categoryId`  |
| Dashboard summary      | Wallets + current/previous stats    | Dựng view model            |
| Theme/preferences      | `modules/expenses/settings/main`    | Firestore + local cache    |

## 8. Dashboard view model

Repository hoặc selector dựng dữ liệu dashboard từ Firestore:

```js
{
  summary: [
    {
      id: "balance",
      value: 12450000,
      trend: 8.5,
      tone: "positive",
      icon: "eye"
    },
    {
      id: "income",
      value: 18000000,
      trend: 12.4,
      tone: "positive",
      icon: "wallet"
    },
    {
      id: "expense",
      value: 5550000,
      trend: 5.3,
      tone: "danger",
      icon: "card"
    },
    {
      id: "saving",
      value: 12450000,
      trend: 15.8,
      tone: "warning",
      icon: "saving"
    }
  ],
  wallets: [],
  categories: [],
  budgets: [],
  recentTransactions: []
}
```

Công thức:

```text
balance = tổng balance của các wallet được tính vào tổng tài sản
income = monthlyStats.incomeMinor
expense = monthlyStats.expenseMinor
saving = income - expense
category percentage = category expense / total expense * 100
budget percentage = category expense / budget limit * 100
trend = (current - previous) / abs(previous) * 100
```

Nếu tháng trước chưa có document `monthlyStats`, giá trị tháng trước không hợp lệ
hoặc bằng `0`, UI trả `trend = 0` thay vì chia cho `0`.

Triển khai hiện tại gom các helper tính toán monthly stats trong:

```text
src/modules/expenses/utils/monthlyStatsUtils.js
```

Các helper dùng chung:

- `getPreviousMonthKey(monthKey)`: tính key tháng trước từ `YYYY-MM`.
- `getEmptyMonthlyStats(monthKey)`: tạo fallback shape khi chưa có stats thật.
- `calculateTrend(currentValue, previousValue)`: tính phần trăm thay đổi và trả `0`
  khi không đủ dữ liệu hợp lệ.

## 9. Flow khởi động ứng dụng

1. Firebase Auth khôi phục session.
2. Nếu chưa đăng nhập, hiển thị auth flow hoặc chế độ local theo phạm vi sản
   phẩm.
3. Đọc cached theme từ `localStorage` để render sớm.
4. Subscribe `modules/expenses/settings/main`.
5. Subscribe wallets và categories đang hoạt động.
6. Đọc monthly stats của tháng đang chọn và tháng trước.
7. Đọc budgets của tháng đang chọn.
8. Subscribe các transaction gần nhất.
9. Adapter dựng props hiện tại cho mobile và web views.
10. Khi settings từ Firestore về, đồng bộ theme vào app và `localStorage`.

Các request không phụ thuộc nên chạy song song.

Triển khai hiện tại dùng `ensureUserDataInitialized()` để idempotently tạo:

- user profile
- `modules/expenses`
- `settings/main`
- ví mặc định `wallet-cash`
- default expense/income categories

Sau bootstrap, `DashboardPage` đọc categories, wallets, budgets, monthly stats
và transactions qua các repository tương ứng. Dashboard chỉ dựng view model từ
dữ liệu thật và projection đã lưu.

## 10. Flow theme và settings

### Khi đã đăng nhập

1. User chọn theme.
2. UI đổi theme ngay bằng optimistic update.
3. Ghi `theme` vào `users/{uid}/modules/expenses/settings/main`.
4. Ghi cùng giá trị vào `localStorage`.
5. Nếu Firestore write thất bại, rollback UI và hiển thị lỗi nhẹ.

### Khi chưa đăng nhập

1. User chọn theme.
2. UI đổi theme.
3. Chỉ ghi vào `localStorage`.

### Khi đăng nhập lần đầu

Quy tắc merge đề xuất:

- Nếu Firestore đã có settings, dùng Firestore.
- Nếu Firestore chưa có settings, tạo settings từ local preference.
- Không ghi đè settings đã tồn tại bằng giá trị local cũ.

### Cập nhật preference

1. `expensePreferencesStore` chuẩn hóa giá trị và optimistic update UI.
2. Các write được đưa vào hàng đợi để tránh request cũ ghi đè request mới.
3. Repository đọc settings hiện tại, merge default schema mới và field thay đổi.
4. Firestore ghi `updatedAt` bằng `serverTimestamp()`.
5. Khi write lỗi, store rollback field về giá trị confirmed gần nhất.

### Quản lý danh mục và ví trong Settings

- Sắp xếp category ghi lại `sortOrder` theo bước 10 bằng write batch.
- Sắp xếp wallet ghi lại `order` theo bước 10 bằng write batch.
- Chọn ví mặc định cập nhật `isDefault` trên toàn bộ active wallets và
  `settings.defaultWalletId`.
- Chọn category mặc định cập nhật `settings.defaultCategoryId`.
- Ẩn/hiện chỉ cập nhật mảng ID trong settings; không dùng `isArchived`.
- Dashboard truyền danh sách đã lọc xuống transaction, report, budget và
  category views; Settings luôn nhận danh sách đầy đủ để có thể hiện lại mục đã
  ẩn.

## 11. Flow tạo giao dịch

Form `Thêm giao dịch` chỉ expose ba type user nhập trực tiếp:

- `expense` - Chi tiêu.
- `income` - Thu nhập.
- `transfer` - Chuyển khoản.

`creditPayment` và `adjustment` là transaction nội bộ, được tạo từ flow riêng
thay vì xuất hiện trong type selector của form thêm giao dịch.

### Request từ client

Client gửi payload domain, không tự gửi balance hoặc statistics:

```js
{
  idempotencyKey: "uuid",
  type: "expense",
  amountMinor: 150000,
  title: "Ăn trưa",
  note: "",
  categoryId: "food",
  walletId: "wallet-cash",
  occurredAt: "2026-06-11T12:15:00+07:00",
  timezone: "Asia/Bangkok"
}
```

### Backend validation

Backend kiểm tra:

- User đã đăng nhập.
- `amountMinor` là số nguyên dương và nằm trong giới hạn hợp lý.
- Currency hợp lệ.
- Wallet tồn tại, thuộc user và chưa archive.
- Category tồn tại, thuộc user, chưa archive và đúng type.
- Transfer có đủ source/destination wallet.
- Source và destination wallet khác nhau.
- `idempotencyKey` chưa được xử lý.
- Date/time hợp lệ.

### Atomic write

Trong một Firestore transaction:

1. Đọc wallet và category cần thiết.
2. Kiểm tra idempotency.
3. Tạo transaction document.
4. Cập nhật balance của wallet.
5. Cập nhật monthly stats.
6. Commit toàn bộ hoặc không ghi gì.

Sau khi thành công:

- Listener nhận transaction mới.
- Dashboard nhận balance và monthly stats mới.
- UI chuyển sang transaction list.

## 12. Flow chuyển khoản

Form transfer phải có:

- Số tiền.
- Ví nguồn.
- Ví đích.
- Ngày giờ.
- Tên và ghi chú.

Atomic transaction:

1. Đọc cả hai wallet.
2. Kiểm tra quyền sở hữu và trạng thái.
3. Trừ source wallet.
4. Cộng destination wallet.
5. Tạo một transfer transaction chứa cả hai wallet ID.
6. Tăng `transactionCount` nếu thống kê cần đếm transfer.
7. Không thay đổi income, expense hoặc category aggregate.

Không mô hình transfer thành expense và income độc lập vì dễ bị đếm sai trong
báo cáo.

## 13. Flow thanh toán thẻ tín dụng

Trong Wallet, mỗi wallet `credit-card` còn dư nợ có nút "Thanh toán". Nút này
mở dialog riêng tên "Thanh toán thẻ tín dụng" và tạo transaction nội bộ
`creditPayment`.

Dialog thanh toán phải có:

- Số tiền.
- Ví thanh toán, không được là `credit-card`.
- Thẻ tín dụng, bắt buộc là wallet `credit-card`.
- Ngày thanh toán.
- Ghi chú.
- Preview số dư ví nguồn sau thanh toán và dư nợ còn lại.

Atomic transaction:

1. Đọc ví thanh toán và ví credit-card.
2. Kiểm tra hai ví khác nhau, ví nguồn không phải credit-card, ví đích là
   credit-card.
3. Trừ `amountMinor` khỏi `fromWalletId`.
4. Giảm `outstandingDebt` của `toWalletId`.
5. Tăng `availableCredit` của `toWalletId`.
6. Tạo một transaction `creditPayment` chứa cả hai wallet ID.
7. Có thể tăng `transactionCount`, nhưng không thay đổi income, expense,
   category aggregate hoặc budget spent.

Không mô hình thanh toán thẻ thành expense từ ví bank vì sẽ đếm trùng khoản chi
đã được ghi lúc quẹt thẻ.

## 14. Flow sửa giao dịch

Client chỉ gửi transaction ID và dữ liệu mới.

Backend transaction:

1. Đọc transaction cũ.
2. Kiểm tra transaction thuộc user và đang active.
3. Đảo toàn bộ tác động của dữ liệu cũ.
4. Validate dữ liệu mới.
5. Áp dụng tác động mới.
6. Cập nhật transaction và snapshots.
7. Cập nhật một hoặc hai monthly stats nếu đổi tháng.
8. Cập nhật các wallet liên quan nếu đổi wallet hoặc đổi loại giao dịch.

Ví dụ đổi expense từ tháng 5 sang tháng 6:

- Giảm expense và category aggregate tháng 5.
- Tăng expense và category aggregate tháng 6.
- Balance hiện tại không đổi nếu amount và wallet không đổi.

Với transaction `creditPayment`, flow sửa đảo/apply balance delta cho cả ví nguồn
và thẻ tín dụng. Nó không đổi income/expense/category aggregate.

Với transaction `adjustment`, flow sửa chỉ đảo/apply balance delta. Nó không tạo
hoặc cập nhật `monthlyStats` vì adjustment không phải income/expense.

## 15. Flow hủy giao dịch

Không xóa document trong flow thông thường.

Backend transaction:

1. Đọc transaction.
2. Nếu đã `voided`, trả kết quả idempotent.
3. Đảo tác động balance.
4. Đảo tác động monthly stats nếu transaction ảnh hưởng stats.
5. Cập nhật:

```js
{
  status: "voided",
  voidedAt: Timestamp,
  updatedAt: Timestamp
}
```

Transaction voided không xuất hiện trong danh sách mặc định nhưng có thể hiển
thị trong lịch sử kiểm toán.

Với transaction `adjustment`, void chỉ đảo tác động balance và không động tới
`monthlyStats`.

Với transaction `creditPayment`, void cộng lại tiền cho ví nguồn, tăng lại
`outstandingDebt` của thẻ tín dụng và giảm lại `availableCredit`.

## 16. Flow wallet

### Tạo wallet

1. Validate name, type và currency; name không được trùng với wallet đang hoạt động khác.
2. Tạo wallet thường với opening balance hoặc credit-card với hạn mức thẻ.
3. Wallet thường đặt `balance = initialBalance`; credit-card đặt
   `outstandingDebt = 0` và `availableCredit = creditLimit`.
4. Ví do user tạo thêm dùng Firestore auto ID.
5. Ví mặc định khi bootstrap lần đầu hiện dùng id cố định `wallet-cash` để init
   idempotent.
6. Không tạo income transaction cho opening balance.

### Sửa wallet

Cho phép sửa:

- Name.
- Icon.
- Color.
- Type.
- Currency.
- Default flag.
- Sort order.
- Số dư hiện tại theo rule bên dưới.
- Hạn mức thẻ tín dụng nếu wallet là `credit-card`.

Credit-card không cho sửa số dư trực tiếp. Dư nợ chỉ thay đổi qua transaction
chi tiêu bằng thẻ hoặc flow thanh toán thẻ riêng trong giai đoạn sau.

Nếu wallet thường được auto-init và chưa có số dư thật, app vẫn cho ghi giao
dịch từ mốc `0`. Balance lúc này là số dư tạm tính. Khi user nhập số dư ban đầu
lần đầu, repository cộng toàn bộ active transaction của ví vào mốc này để tính
`balance`, rồi không tạo adjustment.

Khi user đổi số dư hiện tại:

1. Repository kiểm tra wallet có active transaction chưa bằng query
   `walletIds array-contains walletId` và `status == active`.
2. Nếu chưa có active transaction, đây được coi là bước thiết lập ví lần đầu:
   update trực tiếp `initialBalance = targetBalance` và
   `balance = targetBalance`.
3. Nếu đã có active transaction, tạo transaction `adjustment` với delta giữa
   `targetBalance` và `currentBalance`, sau đó update `balance`.
4. Adjustment không update `monthlyStats`, nên report thu/chi và budget spent
   không bị sai.

### Điều chỉnh số dư

Adjustment chỉ được tạo khi sửa số dư hiện tại của wallet đã có lịch sử giao
dịch. Ví dụ:

```text
current balance = 800000
target balance = 1000000
delta = +200000
```

App tạo transaction:

```js
{
  type: "adjustment",
  adjustmentDirection: "increase",
  amountMinor: 200000,
  walletId: "<walletId>"
}
```

Nếu target thấp hơn current balance thì `adjustmentDirection = "decrease"`.

### Archive wallet

- Không archive wallet default; user phải chọn default wallet khác trước.
- Không archive wallet active cuối cùng.
- Không archive wallet còn `balance != 0`; user phải chuyển hết tiền sang ví
  khác hoặc tạo adjustment về 0 trước.
- Khi archive, chỉ set `isArchived = true`; không hard-delete document.
- Không cho tạo transaction mới với wallet đã archive.
- Transaction cũ vẫn giữ wallet snapshot.

## 17. Flow category

### Tạo category

- Name không rỗng.
- Type là expense hoặc income.
- Icon và color thuộc format cho phép.

### Sửa category

Transaction cũ tiếp tục hiển thị snapshot tại thời điểm giao dịch. Các màn
hình báo cáo hiện tại có thể dùng metadata mới theo `categoryId`.

### Archive category

- Không xuất hiện trong form tạo transaction mới.
- Vẫn xuất hiện trong transaction history và report cũ.
- Budget mới không được tạo cho category đã archive.

## 18. Flow budget

### Tạo hoặc cập nhật budget

1. User chọn tháng, expense category và limit.
2. Client hoặc backend ghi document `{monthKey}_{categoryId}`.
3. UI ghép budget với category spending trong monthly stats.

Runtime hiện tại đọc budget bằng `budgetsRepository`, query theo `monthKey` và
`orderBy categoryId`. `DashboardPage` ghép budget document với category metadata
và `monthlyStats.categoryExpenseMinor` để tạo view model cho mobile/desktop.

Web dashboard cho tạo/cập nhật/xóa budget ngay trong modal từ
`BudgetOverviewCard`. Form chỉ cho chọn expense category đang active, lưu
`limitMinor` và `alertThreshold` qua `upsertExpenseBudget()`. Nếu category đã có
budget trong tháng hiện tại, lần lưu tiếp theo sẽ cập nhật budget đó thay vì tạo
document mới. Xóa budget dùng `deleteExpenseBudget()` và chỉ xóa config hạn mức,
không ảnh hưởng transaction hoặc `monthlyStats`.

Liên kết nghiệp vụ:

- Expense transaction làm tăng `monthlyStats.categoryExpenseMinor[categoryId]`.
- Budget đọc `limitMinor` từ document budget và đọc spent từ
  `monthlyStats.categoryExpenseMinor[categoryId]`.
- Income, transfer và adjustment không làm tăng budget spent.
- Xóa budget chỉ xóa hạn mức; lịch sử giao dịch và category spending vẫn giữ
  nguyên.

Mobile mở `BudgetPage` từ `Cài đặt > Quản lý > Ngân sách tháng` hoặc từ card
ngân sách trên dashboard. Trang này hiển thị tổng ngân sách tháng, danh sách
budget theo category và mở bottom sheet `BudgetForm` để tạo, sửa hoặc xóa
budget.

### Hiển thị cảnh báo

```text
usage = spentMinor / limitMinor * 100
```

Trạng thái đề xuất:

- Dưới threshold: bình thường.
- Từ threshold đến dưới 100%: warning.
- Từ 100% trở lên: exceeded.

UI hiện tại đổi màu phần trăm và progress bar theo trạng thái: warning dùng màu
vàng/cam cảnh báo, exceeded dùng màu đỏ.

Notification backend có thể được bổ sung sau. V1 chỉ cần cảnh báo trong UI.

## 19. Query patterns

### Recent transactions

```text
collection: users/{uid}/modules/expenses/transactions
where: status == active
orderBy: occurredAt desc
limit: 5
```

### Transactions theo tháng

```text
where monthKey == selectedMonth
where status == active
orderBy occurredAt desc
limit 50
```

### Transactions theo loại

```text
where monthKey == selectedMonth
where status == active
where type == selectedType
orderBy occurredAt desc
```

### Transactions theo category

```text
where categoryId == selectedCategoryId
where status == active
orderBy occurredAt desc
```

### Transactions theo wallet

```text
where walletIds array-contains selectedWalletId
where status == active
orderBy occurredAt desc
```

### Budgets theo tháng

```text
where monthKey == selectedMonth
orderBy categoryId asc
```

### Phân trang

Dùng cursor:

```text
startAfter(lastVisibleDocument)
```

Không dùng offset vì các document bị bỏ qua vẫn làm tăng chi phí và latency.

## 20. Search

Firestore Standard không phù hợp với full-text substring search như:

```js
transaction.title.includes(searchTerm);
```

Thiết kế theo giai đoạn:

### V1

- Query transaction theo tháng hoặc khoảng thời gian.
- Search client-side trên tập dữ liệu đã tải.
- Dùng `titleNormalized` để tìm không dấu và không phân biệt hoa thường.

### V2

Nếu cần tìm toàn bộ lịch sử:

- Đồng bộ transaction sang Algolia, Typesense hoặc search service tương đương.
- Firestore vẫn là nguồn sự thật.
- Search service chỉ giữ index phục vụ tìm kiếm.

Không nên tạo mảng mọi prefix/token trong transaction document nếu chưa đo
được nhu cầu vì làm tăng kích thước document và số index write.

## 21. Composite indexes dự kiến

Các index chính:

| Collection     | Fields                                                      |
| -------------- | ----------------------------------------------------------- |
| `transactions` | `status ASC`, `occurredAt DESC`                             |
| `transactions` | `monthKey ASC`, `status ASC`, `occurredAt DESC`             |
| `transactions` | `monthKey ASC`, `status ASC`, `type ASC`, `occurredAt DESC` |
| `transactions` | `categoryId ASC`, `status ASC`, `occurredAt DESC`           |
| `transactions` | `walletIds ARRAY`, `status ASC`, `occurredAt DESC`          |
| `budgets`      | `monthKey ASC`, `categoryId ASC`                            |
| `wallets`      | `isArchived ASC`, `order ASC`                               |
| `categories`   | `type ASC`, `isArchived ASC`, `sortOrder ASC`               |

Chỉ thêm index khi có query thực tế sử dụng. Cấu hình index phải được commit
vào `firestore.indexes.json`.

Có thể disable single-field indexing cho các field không query:

- `note`
- Snapshot maps.
- `categoryExpenseMinor`
- `categoryIncomeMinor`

## 22. Security model

### Authentication

Mọi dữ liệu expenses trên cloud yêu cầu Firebase Authentication.

Điều kiện ownership cơ bản:

```text
request.auth != null
request.auth.uid == uid
```

### Read access

User chỉ được đọc dữ liệu trong:

```text
users/{request.auth.uid}
```

Query phải trỏ trực tiếp vào subtree của user. Security Rules không hoạt động
như filter để tự loại dữ liệu không thuộc quyền.

### Client write access

Implementation hiện tại dùng Firebase client SDK. Client chỉ nên ghi thông qua
repository của module, để mọi mutation đi qua cùng validation và cùng flow cập
nhật projection.

Client/repository có thể ghi:

- Một số field profile.
- Expense settings đã whitelist.
- Budget config đã validate (`monthKey`, `categoryId`, `limitMinor`, `alertThreshold`).
- Xóa budget config của chính user.
- Wallet metadata và archive theo rule.
- Transaction create/update/void cùng với wallet/monthlyStats projection trong
  Firestore transaction.

Client không nên ghi ad hoc ngoài repository flow:

- `wallet.balance`
- `monthlyStats`
- Transaction mutations có tác động tài chính

Security Rules hiện whitelist shape dữ liệu và quyền owner. Những invariant liên
document như “archive wallet cần balance bằng 0” vẫn phải được repository/Cloud
Function giữ nhất quán, vì Rules khó kiểm soát toàn bộ nghiệp vụ phức tạp.

### Trusted write access tương lai

Nếu chuyển mutation tài chính sang Callable Cloud Functions, các function tương
ứng là:

```text
createExpenseTransaction
updateExpenseTransaction
voidExpenseTransaction
createTransferTransaction
createBalanceAdjustmentTransaction
rebuildExpenseProjections
```

Admin SDK trong Cloud Functions bypass Security Rules, vì vậy functions phải
tự validate Auth, ownership và payload.

### App Check

Khi đưa lên production, bật Firebase App Check cho web app và Cloud Functions
để giảm request giả mạo.

## 23. Rule validation cho settings

Security Rules cần giới hạn:

- Chỉ owner được đọc/ghi.
- Chỉ các field hợp lệ được thay đổi.
- `theme` thuộc danh sách theme cho phép.
- `iconSet` thuộc `emoji` hoặc `base`.
- `currency` thuộc danh sách currency hỗ trợ.
- Boolean fields phải đúng type.
- `defaultWalletId` là string hoặc null.
- `defaultCategoryId` là string hoặc null.
- `amountFormat` thuộc `standard` hoặc `compact`.
- `dateFormat` thuộc ba format được hỗ trợ.
- `hiddenCategoryIds` và `hiddenWalletIds` là list.

Không cho client thêm field tùy ý vào settings document.

User profile có rule riêng: owner chỉ được cập nhật `displayName` và
`updatedAt`; không được thay email, photoURL hoặc timestamp khởi tạo qua flow
này.

## 24. Kiến trúc frontend hiện tại

Không gọi Firestore trực tiếp trong component UI.

Cấu trúc chính:

```text
src/
├── lib/
│   └── firebase/
│       ├── app.js
│       ├── auth.js
│       └── firestore.js
└── modules/
    └── expenses/
        ├── api/
        │   ├── expenseSettingsRepository.js
        │   ├── walletsRepository.js
        │   ├── categoriesRepository.js
        │   ├── transactionsRepository.js
        │   ├── budgetsRepository.js
        │   └── monthlyStatsRepository.js
        ├── hooks/
        │   └── useEnsureExpenseSettings.js
        ├── pages/
        ├── utils/
        └── components/
            ├── layout/
            ├── mobile/
            ├── shared/
            └── web/
```

Vai trò:

- `api/repositories`: biết Firestore path và query.
- Repository hiện tại cũng chứa mutation client-side bằng Firestore
  `runTransaction`/batch.
- `stores`: giữ auth snapshot, preferences, projections và mutation actions.
- `hooks`: quản lý bootstrap settings/auth và lifecycle.
- `utils`: tính toán, format, CSV và chuyển dữ liệu hiển thị.
- `components`: chỉ render và phát user events.

`SettingsContent` và `UserProfileCard` được dùng chung giữa desktop/mobile.
Desktop dùng `ExpenseSidebar` cho tài khoản và điều hướng; `ExpenseHeader` chỉ
giữ ngữ cảnh trang, filter và thao tác thêm giao dịch. Mobile Settings giữ link
đến Budget, Wallet và Category vì ba trang này không nằm trong bottom nav.

Nhờ mapper, có thể giữ phần lớn component hiện tại trong giai đoạn migration.

## 25. Mapping sang UI hiện tại

### Firestore transaction sang transaction prop

```js
{
  id: documentId,
  type: data.type,
  amount:
    data.type === "expense"
      ? -data.amountMinor
      : data.type === "income"
        ? data.amountMinor
        : -data.amountMinor,
  category: data.categoryId ?? "transfer",
  icon: data.categorySnapshot?.icon ?? "transfer",
  title: data.title,
  subtitle: formattedTime,
  date: data.localDate,
  time: formattedTime,
  walletId: data.walletId,
  fromWalletId: data.fromWalletId,
  toWalletId: data.toWalletId,
  note: data.note
}
```

Transfer cần UI riêng để thể hiện hướng chuyển tiền. Không nên chỉ hiển thị
như expense âm.

### Category statistics sang category prop

```js
{
  id: category.id,
  name: category.name,
  amount: categorySpentMinor,
  percentage,
  color: category.color,
  icon: category.icon
}
```

### Budget sang budget prop

```js
{
  id: budget.id,
  categoryId: budget.categoryId,
  category: category.name,
  amount: categorySpentMinor,
  limit: budget.limitMinor,
  alertThreshold: budget.alertThreshold,
  color: category.color,
  icon: category.icon
}
```

## 26. Realtime strategy

Nên dùng realtime listener cho dữ liệu nhỏ và thay đổi thường xuyên:

- Expense settings.
- Wallets.
- Categories.
- Budgets của tháng đang xem.
- Recent transactions.
- Monthly stats của tháng đang xem.

Có thể dùng one-time read cho:

- Tháng lịch sử không còn thay đổi thường xuyên.
- Report dài hạn.
- Danh sách transaction đã phân trang.

Không subscribe toàn bộ transaction history.

## 27. Loading, error và offline

Mỗi hook trả về contract thống nhất:

```js
{
    (data, isLoading, error, isFromCache, refresh);
}
```

UI cần phân biệt:

- Lần tải đầu.
- Dữ liệu rỗng.
- Firestore lỗi.
- Offline nhưng có cached data.
- Mutation đang pending.

Mutation dùng idempotency key để tránh duplicate khi retry do mạng yếu.

Không hiển thị optimistic balance như đã thành công nếu backend transaction
chưa commit. Form có thể optimistic về trạng thái loading, nhưng balance nên
theo listener server/cache chính thức.

## 28. Timezone và ngày tháng

`occurredAt` là timestamp chuẩn để sort và query.

Các field bổ trợ:

```js
{
  occurredAt: Timestamp,
  localDate: "2026-06-11",
  monthKey: "2026-06",
  timezone: "Asia/Bangkok"
}
```

Lý do lưu thêm:

- Dashboard theo tháng của user không bị lệch do UTC.
- Query tháng đơn giản.
- Group transaction theo ngày ổn định.
- Giữ được ngữ cảnh khi user thay đổi timezone.

`monthKey` và `localDate` phải được backend tính từ `occurredAt` và timezone,
không tin hoàn toàn vào chuỗi client gửi lên.

## 29. Trend calculation

Dashboard cần stats tháng hiện tại và tháng trước.

```text
incomeTrend =
  (currentIncome - previousIncome) / abs(previousIncome) * 100

expenseTrend =
  (currentExpense - previousExpense) / abs(previousExpense) * 100

savingTrend =
  (currentNet - previousNet) / abs(previousNet) * 100
```

Nếu previous value không tồn tại, không phải số hoặc bằng `0`, helper
`calculateTrend()` trả `0` để dashboard không render giá trị sai hoặc lỗi chia
cho `0`.

Balance trend cần quyết định rõ về nghiệp vụ. Đề xuất:

```text
current balance = tổng balance hiện tại
balance at previous month end = current balance - net movement từ đầu tháng
```

Nếu chưa có historical balance snapshots, có thể tạm dùng net trend và đổi
label UI cho đúng nghĩa.

## 30. Migration từ mock data

### Bước 1: Firebase foundation

- Tạo Firebase project cho dev.
- Cài Firebase Web SDK.
- Cấu hình Authentication.
- Cấu hình Firestore.
- Cấu hình Emulator Suite.
- Thêm environment variables cho Vite.

### Bước 2: Rules và indexes

- Tạo `firestore.rules`.
- Tạo `firestore.indexes.json`.
- Viết tests cho ownership và settings validation.

### Bước 3: Seed dữ liệu nền

- Tạo user test.
- Seed categories.
- Seed wallets.
- Seed expense settings.

### Bước 4: Import transactions

Chuyển mock transaction:

- Amount âm thành `type: expense` và `amountMinor` dương.
- Amount dương thành `type: income`.
- Ghép `date` và `time` thành `occurredAt`.
- Sinh `localDate`, `monthKey` và timezone.
- Sinh category/wallet snapshots.
- Dùng auto ID hoặc UUID.

### Bước 5: Build projections

- Tính lại wallet balances từ initial balances và transactions.
- Tạo monthly stats.
- Kiểm tra tổng trước và sau migration.

### Bước 6: Repository và adapters

- Tạo Firestore repositories.
- Tạo hooks.
- Tạo mappers giữ nguyên props cho UI.

### Bước 7: Chuyển từng màn hình

Thứ tự đề xuất:

1. Settings và theme.
2. Categories và wallets.
3. Transaction list.
4. Add transaction.
5. Dashboard statistics.
6. Budgets.
7. Report.
8. Edit và void transaction.
9. Transfer và `creditPayment`.

### Bước 8: Loại bỏ mock

Chỉ xóa `mockExpenses.js` sau khi:

- UI có loading/error/empty states.
- Emulator tests chạy ổn.
- Dashboard totals khớp.
- Add/edit/void/transfer/creditPayment cập nhật đúng balance, debt và stats.

## 31. Rebuild và reconciliation

Projection có thể sai do bug, import lỗi hoặc function thất bại trong quá trình
phát triển. Cần có công cụ rebuild.

`rebuildExpenseProjections(uid)`:

1. Đọc wallets và initial balances.
2. Đọc toàn bộ active transactions của user.
3. Tính lại balances.
4. Tính lại monthly stats.
5. So sánh với projection hiện tại.
6. Ghi lại bằng Admin SDK.
7. Lưu log kết quả.

Production cần giới hạn function này cho admin hoặc internal job.

Có thể thêm scheduled reconciliation để phát hiện chênh lệch mà không tự sửa.

## 32. Invariants bắt buộc

- Mọi document expenses thuộc đúng một `uid`.
- `amountMinor` là số nguyên dương.
- Transaction active có đúng field theo type.
- Expense/income có một wallet và một category hợp lệ.
- Transfer có hai wallet khác nhau và không có category.
- Credit payment có ví nguồn không phải credit-card, ví đích là credit-card và
  không có category.
- Adjustment có một wallet, `adjustmentDirection` hợp lệ và không có category.
- Credit payment không tăng income/expense/monthly category aggregate hoặc
  budget spent.
- Adjustment không ảnh hưởng income/expense/monthly category aggregate.
- Wallet archive phải không phải default, không phải active cuối cùng và có
  `balance == 0`.
- Balance chỉ được cập nhật qua create/edit/void transaction, adjustment hoặc
  setup initial balance cho wallet chưa có active transaction.
- Monthly stats không được client ghi trực tiếp.
- Voided transaction không ảnh hưởng balance và aggregates.
- Category aggregate không âm sau mutation hợp lệ.
- `netMinor = incomeMinor - expenseMinor`.
- Budget category phải là expense category.
- `monthKey` khớp với `occurredAt` theo timezone đã lưu.
- Một idempotency key chỉ tạo tối đa một transaction.

## 33. Testing strategy

### Unit tests

- Money conversion.
- Date, timezone và `monthKey`.
- Transaction mapper.
- Dashboard mapper.
- Trend calculation.
- Category percentage.
- Budget percentage.
- Delta calculation khi edit/void.

### Firestore Rules tests

- User A không đọc được dữ liệu User B.
- Anonymous user không đọc/ghi được.
- User chỉ sửa được settings field cho phép.
- Theme ngoài whitelist bị từ chối.
- Client không ghi được balances và stats.

### Emulator integration tests

- Create expense cập nhật wallet và monthly stats.
- Create income cập nhật wallet và monthly stats.
- Transfer cập nhật hai wallet nhưng không đổi income/expense.
- Edit wallet chưa có active transaction cập nhật `initialBalance` và `balance`
  mà không tạo adjustment.
- Edit wallet đã có active transaction tạo adjustment và không đổi
  `monthlyStats`.
- Edit amount cập nhật đúng delta.
- Edit month cập nhật cả hai tháng.
- Edit wallet cập nhật cả hai wallet.
- Void đảo toàn bộ tác động.
- Archive wallet bị chặn khi wallet là default, còn tiền hoặc là wallet active
  cuối cùng.
- Retry cùng idempotency key không tạo duplicate.
- Mutation lỗi không để lại partial write.

### UI tests

- Loading, empty, error và offline states.
- Theme được khôi phục không nháy.
- Add transaction submit một lần.
- Transaction list phân trang đúng.
- Filter theo type hoạt động.
- Budget warning đúng threshold.
- Settings desktop/mobile dùng chung preference và management actions.
- Ẩn/hiện category/wallet cập nhật ngay các form và report liên quan.
- Category/wallet mặc định được chọn sẵn trong form giao dịch.
- Đổi displayName cập nhật Auth, Firestore và auth store; lỗi Firestore rollback
  Auth.
- CSV mở trong Excel đúng cột và đúng tiếng Việt.

## 34. Acceptance criteria cho lần triển khai đầu

- User đăng nhập chỉ thấy dữ liệu của mình.
- Theme đồng bộ giữa hai thiết bị.
- Dashboard không còn import mock financial data.
- Add expense/income cập nhật list, wallet và dashboard.
- Transfer cập nhật đúng hai wallet và không làm sai report.
- Refresh trang không mất dữ liệu.
- Tháng hiện tại và tháng trước trả trend đúng.
- Budget spent khớp category expense.
- Sửa balance ví đi đúng flow: initial setup hoặc adjustment transaction.
- Không có mutation tài chính nào để lại wallet/monthlyStats projection lệch với
  transaction history.
- Emulator tests bao phủ rules và mutation quan trọng.

## 35. Ngoài phạm vi phiên bản đầu

- Shared household hoặc multi-user wallet.
- Multi-currency conversion.
- Credit card statement cycle, due date và payment flow đầy đủ.
- Recurring transactions.
- Attachment hóa đơn.
- Full-text search toàn bộ lịch sử.
- Bank synchronization.
- Split transaction thành nhiều category.
- Double-entry accounting hoàn chỉnh.
- Audit log pháp lý.

Thiết kế hiện tại vẫn để đường mở cho các chức năng này nhưng không tăng độ
phức tạp của phiên bản đầu.

## 36. CSV import/export

Settings cho phép export toàn bộ active transactions và import các transaction
editable (`expense`, `income`, `transfer`) qua cùng repository tạo giao dịch.
Import không ghi thẳng transaction document nên wallet balance và monthly stats
vẫn đi qua flow nghiệp vụ hiện tại.

Định dạng export:

- Extension `.csv`.
- Dấu phân cách `;` và dòng đầu `sep=;` để Excel tự nhận cột.
- Tiêu đề tiếng Việt: Ngày, Giờ, Loại giao dịch, Số tiền, Nội dung, Danh mục,
  Ví, Ví chuyển, Ví nhận, Ghi chú.
- Ngày hiển thị `dd/MM/yyyy`.
- Category và wallet dùng display name thay vì document ID.
- Encoding UTF-16 LE với BOM để Excel trên Windows hiển thị đúng tiếng Việt.
- Giá trị có delimiter, dấu nháy hoặc xuống dòng được CSV-escape; text bắt đầu
  bằng ký tự công thức nguy hiểm được prefix để hạn chế CSV injection.

Parser import:

- Tự nhận UTF-8, UTF-16 LE và UTF-16 BE bằng BOM.
- Đọc được dấu `,` của format cũ hoặc dấu `;` của format mới.
- Chấp nhận header tiếng Anh cũ và header tiếng Việt mới.
- Chấp nhận ngày `yyyy-MM-dd` hoặc `dd/MM/yyyy`.
- Match category/wallet theo ID hoặc tên không phân biệt hoa thường.
- Validate loại giao dịch, số tiền, ngày, category và wallet trước khi ghi.

`creditPayment` và `adjustment` vẫn được export để báo cáo/audit nhưng không nằm
trong contract import trực tiếp vì chúng phải đi qua flow nghiệp vụ riêng.

## 37. Tài liệu Firestore tham khảo

- [Cloud Firestore data model](https://firebase.google.com/docs/firestore/data-model)
- [Transactions and batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Write-time aggregations](https://firebase.google.com/docs/firestore/solutions/aggregation)
- [Aggregation queries](https://firebase.google.com/docs/firestore/query-data/aggregation-queries)
- [Manage indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Security Rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Securely query data](https://firebase.google.com/docs/firestore/security/rules-query)
- [Firestore best practices](https://firebase.google.com/docs/firestore/best-practices)

## 38. Trạng thái

```text
Status: Implementation contract for current expenses module
Implementation: Active
Mock data removal: Financial dashboard mock data removed from runtime
Firebase integration: Settings/categories/wallets/budgets/transactions/monthlyStats active
Budget UI: Web budget create/update/delete modal active
Wallet balance flow: Initial setup plus adjustment transactions active
Credit payment flow: creditPayment transactions active
Wallet archive rules: Default/non-zero/last-active wallet protected
Settings UI: Desktop/mobile shared content active
Settings preferences: Formats/defaults/hidden category and wallet IDs active
CSV: Excel-compatible UTF-16 LE export and multi-encoding import active
Profile: displayName synchronized across Auth, Firestore and auth store
```

Tài liệu này là contract nghiệp vụ và dữ liệu cho implementation hiện tại. Khi
schema hoặc flow thay đổi, cần cập nhật README trước hoặc cùng pull request
triển khai.
