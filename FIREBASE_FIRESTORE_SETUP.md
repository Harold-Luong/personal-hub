# Firebase Firestore Setup

Tài liệu này hướng dẫn cách setup và deploy cấu hình Firestore cho project.

## Các file liên quan

### `firebase.json`

File này nói cho Firebase CLI biết rules và indexes nằm ở đâu:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

Khi chạy deploy, Firebase CLI đọc file này để biết cần upload
`firestore.rules` và `firestore.indexes.json`.

### `firestore.rules`

File này là Security Rules của Cloud Firestore.

Chức năng chính:

* Chỉ user đang đăng nhập mới đọc được dữ liệu của mình trong `users/{uid}`.
* User A không đọc/ghi được dữ liệu của User B.
* Owner được cập nhật `users/{uid}.displayName` cùng `updatedAt`; email,
  photoURL và timestamp khởi tạo phải giữ nguyên.
* Client được cập nhật `users/{uid}/modules/expenses/settings/main` theo
  whitelist.
* `modules/expenses/settings/main` chỉ nhận các field hợp lệ:

  * `theme`
  * `currency`
  * `timezone`
  * `hideBalance`
  * `notificationsEnabled`
  * `defaultWalletId`
  * `defaultCategoryId`
  * `amountFormat`
  * `dateFormat`
  * `hiddenCategoryIds`
  * `hiddenWalletIds`
  * `updatedAt`
* Wallet, category, transaction, budget và monthly stats phải đúng schema,
  ownership và invariant được khai báo trong rules. Các mutation tài chính của
  client đi qua repository và Firestore transaction/batch.
* Transfer chạm wallet type `saving` phải lưu `savingsTransferKind` là `deposit`
  hoặc `withdrawal`; Rules khóa đúng chiều ví và không cho transfer thường dùng
  ví tiết kiệm. Transfer từ phần dư ngân sách lưu thêm `budgetSavingsMonthKey`,
  `budgetSavingsCategoryId` và bắt buộc là `deposit`.
* Wallet `saving` không được dùng cho expense, adjustment hoặc credit payment;
  income trực tiếp chỉ hợp lệ với category `interest`.

Rules này được Firebase server tự động áp dụng mỗi khi app React gọi Firestore.
React code không import file này.

### `firestore.indexes.json`

File này khai báo Composite Indexes cho các query Firestore.

Chức năng chính:

* Hỗ trợ query transactions theo tháng, trạng thái, loại, category, wallet.
* Hỗ trợ query budgets theo tháng.
* Hỗ trợ sort wallets/categories theo `sortOrder`.
* Tắt index cho một số field không cần query để giảm chi phí index, ví dụ:

  * `note`
  * `categorySnapshot`
  * `walletSnapshot`
  * `categoryExpenseMinor`
  * `categoryIncomeMinor`

Indexes không tạo data mới. Nó chỉ giúp Firestore chạy query đúng và nhanh hơn.

## Setup Firebase CLI

Project đang dùng Firebase Web SDK trong app React, nhưng lệnh `firebase` cần
Firebase CLI riêng.

Nếu chưa cài global, dùng `npx`:

```bash
npx firebase-tools login
```

Hoặc cài global:

```bash
npm install -g firebase-tools
firebase login
```

## Chọn Firebase project

Kiểm tra project hiện tại:

```bash
npx firebase-tools use
```

Nếu hiện:

```text
No project is currently active.
```

thì chạy:

```bash
npx firebase-tools use --add
```

Sau đó:

1. Chọn đúng Firebase project.
2. Đặt alias, thường dùng `default`.

Lệnh này sẽ tạo file `.firebaserc` trong repo. File đó lưu project alias cho
Firebase CLI.

Kiểm tra lại:

```bash
npx firebase-tools use
```

## Deploy Firestore rules và indexes

Deploy cả rules và indexes:

```bash
npx firebase-tools deploy --only firestore
```

Deploy riêng rules:

```bash
npx firebase-tools deploy --only firestore:rules
```

Deploy riêng indexes:

```bash
npx firebase-tools deploy --only firestore:indexes
```

## Sau khi deploy sẽ xảy ra gì?

### Trên Firebase Console

Trong Firestore Database:

* Tab `Rules` sẽ được update theo `firestore.rules`.
* Tab `Indexes` sẽ được update theo `firestore.indexes.json`.
* Rules mới sẽ tạo một version mới trong lịch sử rules.

### Với dữ liệu Firestore

Deploy không xóa, không sửa, không tạo document data.

Nó chỉ thay đổi:

* Security rules.
* Composite indexes.

### Với app React

Khi app gọi Firestore:

```js
ensureExpenseSettings(uid)
```

Firestore server sẽ kiểm tra request bằng rules đã deploy.

Nếu user đã login, `request.auth.uid` đúng với `uid`, và payload settings hợp lệ
thì request được chấp nhận.

Nếu không, Firestore trả lỗi permission denied.

Flow đổi tên hiển thị cũng cần rules đã deploy vì app ghi đồng thời Firebase
Authentication và `users/{uid}.displayName`. Nếu Firestore từ chối request, app
rollback Auth profile về tên trước đó.

## Lỗi thường gặp

### `bash: firebase: command not found`

Máy chưa có Firebase CLI global. Dùng:

```bash
npx firebase-tools use
```

hoặc cài global:

```bash
npm install -g firebase-tools
```

### `No project is currently active`

Repo chưa chọn Firebase project. Chạy:

```bash
npx firebase-tools use --add
```

### App bị `permission denied`

Kiểm tra:

* User đã đăng nhập chưa.
* App có ghi đúng path `users/{uid}/modules/expenses/settings/main` không.
* `uid` trên path có đúng với `request.auth.uid` không.
* Payload có đúng whitelist field trong `firestore.rules` không.
* `updatedAt` có dùng `serverTimestamp()` không.
* Khi đổi displayName, rules mới cho user profile đã được deploy chưa.

## Thứ tự khuyến nghị

1. Login Firebase CLI.
2. Chọn Firebase project bằng `use --add`.
3. Deploy `firestore.rules`.
4. Deploy `firestore.indexes.json`.
5. Test đăng nhập, đổi displayName và kiểm tra cả Firebase Auth lẫn
   `users/{uid}`.
6. Test tạo/cập nhật `modules/expenses/settings/main` với các preference mới.
7. Test transaction, wallet, category và budget trên đúng tài khoản.
