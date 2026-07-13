# Personal Hub

Personal Hub là ứng dụng React quản lý dữ liệu cá nhân. Module đang được triển
khai đầy đủ là `expenses`, hỗ trợ quản lý ví, giao dịch, ngân sách và báo cáo
trên desktop lẫn mobile.

## Công nghệ

- React 19 và React Router 7.
- Vite 8 và Sass.
- Zustand cho auth session, preferences và expense data state.
- Firebase Authentication, Cloud Firestore và App Check.
- Recharts cho donut, line và bar chart.

## Chức năng Expenses

### Giao dịch và ví

- Tạo, sửa và hủy giao dịch thu, chi và chuyển khoản.
- Thanh toán thẻ tín dụng bằng transaction `creditPayment`.
- Quản lý ví thường, ví điện tử, ngân hàng, tiết kiệm và thẻ tín dụng.
- Yêu cầu thiết lập ví với số dư ban đầu lớn hơn `0` trong lần đăng nhập đầu tiên.
- Thiết lập số dư ban đầu và tạo adjustment khi chỉnh số dư đã phát sinh giao
  dịch.
- Chọn ví mặc định, sắp xếp và ẩn ví ít dùng.

### Ngân sách và danh mục

- Thiết lập hạn mức theo danh mục và tháng.
- Theo dõi số đã chi, phần còn lại và trạng thái cảnh báo/vượt ngân sách.
- Xem tỷ trọng chi tiêu bằng donut chart và chi tiết giao dịch theo danh mục.
- Sắp xếp, ẩn/hiện và chọn danh mục chi tiêu mặc định.

### Dashboard và báo cáo

- Tổng quan số dư, thu nhập, chi tiêu và dòng tiền.
- Xu hướng thu chi sáu tháng và xu hướng chi tiêu theo tuần.
- Lịch chi tiêu theo ngày kèm tooltip chi tiết.
- So sánh mức chi theo danh mục với tháng trước.
- Phân tích ví, giao dịch lớn và dự báo chi tiêu.

### Cài đặt

Trang `/expenses/settings` dùng chung logic cho desktop và mobile:

- Chọn tiền tệ `VND`/`USD`.
- Chọn định dạng số tiền đầy đủ hoặc rút gọn.
- Chọn định dạng ngày `dd/MM/yyyy`, `MM/dd/yyyy` hoặc `yyyy-MM-dd`.
- Sắp xếp, ẩn/hiện và chọn mặc định cho danh mục/ví.
- Cập nhật `displayName` đồng thời trong Firebase Authentication và
  `users/{uid}` trên Firestore.
- Xuất/nhập giao dịch CSV.

CSV xuất ra dùng dấu `;`, có dòng `sep=;`, tiêu đề tiếng Việt và encoding
UTF-16 LE có BOM để Microsoft Excel hiển thị đúng cột và tiếng Việt. Trình nhập
tự nhận CSV UTF-8 cũ và UTF-16 LE/BE mới.

Trên mobile, Settings còn là nơi điều hướng đến các trang không có trong bottom
navigation: Ngân sách, Ví và Danh mục. Các trang này có điều hướng quay lại
Settings.

## Điều hướng

```text
/expenses/dashboard          Tổng quan
/expenses/transactions       Giao dịch
/expenses/category-spending  Chi tiêu theo danh mục
/expenses/report             Báo cáo
/expenses/budgets            Ngân sách
/expenses/wallets            Ví tiền
/expenses/settings           Cài đặt
```

Desktop dùng sidebar cho điều hướng và tài khoản. Avatar, tên/email, chuyển
theme và đăng xuất nằm cuối sidebar. Header chỉ giữ tên trang, mô tả, bộ lọc và
nút thêm giao dịch; riêng Settings không hiển thị nút thêm giao dịch.

## Kiến trúc thư mục

```text
src/
├── lib/firebase/                 Firebase app/auth/firestore/App Check
├── modules/auth/                 Đăng nhập, đăng ký và cập nhật hồ sơ
├── modules/expenses/
│   ├── api/                      Firestore repositories
│   ├── components/               layout, shared, mobile, web và domain UI
│   ├── constant/                 metadata và UI constants
│   ├── hooks/                    bootstrap settings
│   ├── pages/                    route-level pages
│   ├── styles/expenses/          Sass theo từng màn hình
│   └── utils/                    tính toán, format và CSV
├── routes/                       App routes và auth guard
└── stores/                       Zustand stores
```

Nguyên tắc chính:

- Component UI không tự dựng Firestore path.
- Repository chịu trách nhiệm query, validation và mutation.
- `transactions` là nguồn sự thật; wallet balance và monthly stats là
  projection để đọc nhanh.
- Preferences được optimistic update, lưu Firestore và cache localStorage.
- Component dùng chung được ưu tiên giữa desktop/mobile, ví dụ
  `SettingsContent`, `UserProfileCard`, `DonutChart` và summary cards.

## Firestore

Dữ liệu của từng tài khoản nằm dưới `users/{uid}`:

```text
users/{uid}
├── displayName, email, photoURL, timestamps
└── modules/expenses/
    ├── settings/main
    ├── wallets/{walletId}
    ├── categories/{categoryId}
    ├── transactions/{transactionId}
    ├── budgets/{budgetId}
    └── monthlyStats/{monthKey}
```

Settings hiện lưu:

```js
{
  theme,
  iconSet,
  currency,
  timezone,
  hideBalance,
  notificationsEnabled,
  defaultWalletId,
  defaultCategoryId,
  amountFormat,
  dateFormat,
  hiddenCategoryIds,
  hiddenWalletIds,
  updatedAt
}
```

Security Rules chỉ cho owner truy cập dữ liệu của mình, whitelist field/value
của settings và chỉ cho sửa `displayName` cùng `updatedAt` ở user profile.

## Cài đặt môi trường

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`. Để truy cập từ thiết bị khác trong LAN:

```bash
npm run dev:lan
```

Firebase Web SDK cần các biến môi trường của project. App Check production cần:

```env
VITE_RECAPTCHA_V3_SITE_KEY=<recaptcha-v3-site-key>
```

Chi tiết App Check và security nằm trong `SECURITY.md`.

## Kiểm tra chất lượng

```bash
npm run lint
npm run build
npm run preview
```

Build có thể cảnh báo chunk lớn do Firebase và Recharts; cảnh báo này không làm
build thất bại.

## Deploy Firestore

Sau khi thay đổi settings schema hoặc quyền cập nhật profile, phải deploy rules:

```bash
npx firebase-tools deploy --only firestore:rules
```

Deploy rules và indexes cùng lúc:

```bash
npx firebase-tools deploy --only firestore
```

## Tài liệu liên quan

- `src/modules/expenses/README.md`: contract dữ liệu và nghiệp vụ chi tiết.
- `FIREBASE_FIRESTORE_SETUP.md`: Firebase CLI, rules và indexes.
- `SECURITY.md`: Authentication, App Check và security checklist.
