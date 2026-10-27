# Expenses financial backend

`mutateExpenses` là Firebase Callable Function v2 ở `asia-southeast1`, runtime
Node.js 22. Function yêu cầu Firebase Auth và App Check. UID được lấy từ
`request.auth.uid`, không lấy từ payload.

## Cấu trúc

- `src/handler.cjs`: allowlist action, kiểm tra đầu vào, transaction bao toàn bộ
  mutation và khóa `users/{uid}/modules/expenses/mutationLocks/main`.
- `src/domain-entry.js`: chỉ export sáu mutation ví/giao dịch.
- `src/firestoreAdapter.cjs`: chuyển modular Firestore API sang Admin SDK;
  AsyncLocalStorage cho mọi query và write của repository dùng chung transaction.
- `../scripts/build-expense-functions.mjs`: bundle logic repository vào
  `lib/domain.cjs` (generated, không commit). Handler và bundle dùng cùng adapter
  để không tách transaction context. Frontend không import Admin SDK.

Không thêm read sau write trong domain: Firestore transaction yêu cầu đọc trước
khi ghi. Không thêm action chỉ dựa vào validation UI; Admin SDK bypass Rules.
Mỗi user dùng một khóa mutation để bảo vệ các kiểm tra query và projection;
nhiều mutation cùng user có thể retry do contention.

## Cài đặt và kiểm tra

Chạy từ root repository với Node.js 22 trở lên:

```bash
npm install
npm install --prefix functions
npm run build:functions
npm run test:firestore
npx playwright install chromium
npm run test:browser
```

Firestore Emulator cần Java tương thích với Firebase CLI đang cài.
`test:firestore` dùng project `demo-personal-hub`, không sửa dữ liệu production.
Suite gọi handler trực tiếp với Auth context giả lập và kiểm tra Rules bằng
client SDK; không kiểm tra HTTP callable hoặc App Check attestation thật.
Browser suite dùng camera/media giả lập để kiểm tra lifecycle và JSON.

`npm run dev` vẫn kết nối Firebase đã cấu hình, không tự nối emulator.

## Database và App Check

Backend mặc định dùng database `(default)`. Nếu frontend dùng named database,
tạo `functions/.env.<project-id>` (đã ignore) với:

```dotenv
EXPENSE_DATABASE_ID=<cùng giá trị VITE_FIREBASE_DATABASE_ID của frontend>
```

Đồng thời chọn đúng `firestore.database` trong `firebase.json` khi deploy Rules
và indexes. Project, database của frontend/backend và đích deploy Rules phải
trùng nhau. Không đặt service-account key trong frontend hoặc repository;
Function dùng credentials của runtime Firebase.

Callable enforce App Check ngay từ cấu hình `onCall`. Web app phải được đăng ký
App Check, domain hợp lệ và lấy được token. Xem [SECURITY.md](../SECURITY.md)
cho cấu hình web/local development. `maxInstances: 10` là giới hạn instance,
không phải rate limit cho từng user.

## Triển khai khi được yêu cầu

Xác nhận project, database, quyền deploy và cấu hình App Check trước khi chạy.
Thứ tự migration: **Functions → Hosting → Firestore Rules**. Trong khoảng giữa,
Rules cũ vẫn cho phép client cũ ghi tài chính; hoàn tất các bước trong cùng đợt
triển khai. Sau Rules mới, tab dùng bundle cũ cần reload để mutation hoạt động.

```bash
npm run lint
npm test
npm run build:functions
npm run build
npx firebase deploy --only functions:mutateExpenses --project <project-id>
npx firebase deploy --only hosting --project <project-id>
npx firebase deploy --only firestore --project <project-id>
```

Predeploy tự build lại domain từ root. Cài dependency `functions/` trước bước
deploy. Không chỉ deploy Rules trước khi Function/frontend sẵn sàng: app cũ sẽ
bị từ chối ghi. Rollback Hosting về phiên bản ghi trực tiếp cũng không tương
thích với Rules mới; cần bản frontend vẫn dùng callable.

Sau deploy, dùng tài khoản test để kiểm tra Auth/App Check, setup ví, tạo/sửa/hủy
giao dịch, thanh toán thẻ và chuyển phần dư. Không cần backfill claims: backend
kiểm tra transfer legacy khi chưa có claim. Idempotency áp dụng cho giao dịch
tạo mới; không tự gộp giao dịch trùng đã tồn tại hoặc phục hồi key sau reload form.

Tham khảo: [Callable Functions](https://firebase.google.com/docs/functions/callable),
[App Check cho Functions](https://firebase.google.com/docs/app-check/cloud-functions),
[Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).
