# Hướng dẫn deploy MoneyCare lên Firebase Hosting

Tài liệu này hướng dẫn build và deploy ứng dụng MoneyCare từ thư mục gốc của repository lên Firebase Hosting.

## 1. Cấu hình Hosting hiện tại

Repository đã có sẵn:

- `.firebaserc`: project mặc định là `personal-hub-1605`.
- `firebase.json`: deploy nội dung trong thư mục `dist`.
- SPA rewrite: mọi URL không trùng file tĩnh đều trả về `index.html` để React Router xử lý.

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Không cần chạy lại `firebase init hosting`. Lệnh này có thể ghi đè phần cấu hình Hosting đang có trong `firebase.json`.

## 2. Chuẩn bị Firebase project

Trong [Firebase Console](https://console.firebase.google.com/), kiểm tra project sẽ deploy đã có:

1. Một Firebase Web App.
2. Firebase Hosting đã được kích hoạt.
3. Firebase Authentication đã bật Email/Password và Google.
4. Cloud Firestore đã được tạo đúng database.
5. Firebase App Check đã đăng ký Web App với reCAPTCHA v3.

Tài khoản chạy lệnh deploy phải có quyền phù hợp trên Firebase project.

## 3. Cài dependency và đăng nhập Firebase CLI

Mở PowerShell tại thư mục repository:

```powershell
cd D:\hub\personal-hub
npm.cmd install
npx.cmd firebase-tools login
```

Kiểm tra tài khoản và danh sách project có thể truy cập:

```powershell
npx.cmd firebase-tools login:list
npx.cmd firebase-tools projects:list
```

Repo đang trỏ mặc định tới `personal-hub-1605`. Kiểm tra lại trước mỗi lần deploy:

```powershell
npx.cmd firebase-tools use
```

Các lệnh bên dưới truyền rõ `--project personal-hub-1605` để giảm nguy cơ deploy nhầm project.

## 4. Cấu hình biến môi trường production

Vite nhúng các biến `VITE_*` vào bundle tại thời điểm build. Vì vậy phải cấu hình đúng biến môi trường **trước** khi chạy `npm.cmd run build`.

Tạo file `.env.production.local` tại thư mục gốc:

```env
VITE_FIREBASE_API_KEY=<firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<firebase-auth-domain>
VITE_FIREBASE_PROJECT_ID=<firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<firebase-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<firebase-messaging-sender-id>
VITE_FIREBASE_APP_ID=<firebase-app-id>
VITE_RECAPTCHA_V3_SITE_KEY=<recaptcha-v3-site-key>
```

Nếu ứng dụng dùng một Firestore database có tên thay vì database mặc định, thêm:

```env
VITE_FIREBASE_DATABASE_ID=<firestore-database-id>
```

Nếu dùng database mặc định, có thể bỏ biến `VITE_FIREBASE_DATABASE_ID`.

Lưu ý:

- Các file `*.local` đã được `.gitignore`; không commit file môi trường.
- Firebase Web API key và reCAPTCHA site key là cấu hình phía client, không phải khóa quản trị.
- Không đưa reCAPTCHA secret key, service-account JSON hoặc private key vào repository.
- `VITE_FIREBASE_PROJECT_ID` và `VITE_FIREBASE_DATABASE_ID` phải trỏ tới đúng nơi đang chứa dữ liệu và Security Rules của MoneyCare.

## 5. Cho phép domain production

Firebase Hosting cung cấp hai domain mặc định:

```text
https://personal-hub-1605.web.app
https://personal-hub-1605.firebaseapp.com
```

Trước khi kiểm tra đăng nhập và App Check:

1. Vào **Firebase Console > Authentication > Settings > Authorized domains**.
2. Xác nhận domain Hosting đang dùng có trong danh sách; nếu dùng custom domain thì thêm domain đó.
3. Trong cấu hình reCAPTCHA v3, cho phép các domain Hosting và custom domain cần sử dụng.
4. Trong **Firebase Console > App Check**, xác nhận Web App đã đăng ký đúng provider và secret key tương ứng với `VITE_RECAPTCHA_V3_SITE_KEY`.

Nếu bỏ qua bước này, đăng nhập Google có thể trả về `auth/unauthorized-domain`, hoặc request Firestore có thể bị App Check từ chối.

## 6. Kiểm tra và build production

Chạy lần lượt:

```powershell
npm.cmd run lint
npm.cmd run build
```

Build thành công sẽ tạo thư mục `dist`. Kiểm tra nhanh:

```powershell
Test-Path .\dist\index.html
```

Kết quả phải là `True`.

## 7. Kiểm tra bản build trước khi deploy

### Kiểm tra bằng Vite Preview

```powershell
npm.cmd run preview
```

Vite sẽ in URL preview local ra terminal.

### Kiểm tra đúng cấu hình Firebase Hosting

```powershell
npx.cmd firebase-tools emulators:start --only hosting --project personal-hub-1605
```

Hosting Emulator thường chạy tại `http://localhost:5000`. Khi dùng cách này, ứng dụng vẫn kết nối tới Firebase backend thật vì repo chưa cấu hình Firestore/Auth Emulator.

Kiểm tra ít nhất:

- Mở trang chủ và đăng nhập.
- Mở trực tiếp `/expenses/dashboard`, sau đó refresh trang.
- Mở `/expenses/transactions` và `/expenses/settings`.
- Kiểm tra giao diện desktop và mobile.

## 8. Tạo preview URL trên Firebase

Để kiểm tra trên một URL tạm trước khi cập nhật production:

```powershell
npx.cmd firebase-tools hosting:channel:deploy moneycare-preview --project personal-hub-1605
```

CLI sẽ trả về một URL dạng:

```text
https://personal-hub-1605--moneycare-preview-<hash>.web.app
```

Preview URL là URL công khai và sử dụng Firebase backend thật. Nếu đăng nhập hoặc App Check báo lỗi domain, thêm chính hostname preview được CLI trả về vào cấu hình Authorized domains/reCAPTCHA trước khi kiểm tra.

## 9. Deploy production

Sau khi lint, build và preview đều đạt:

```powershell
npx.cmd firebase-tools deploy --only hosting --project personal-hub-1605 -m "Deploy MoneyCare"
```

Lệnh này chỉ deploy:

- Nội dung hiện có trong `dist`.
- Cấu hình `hosting` trong `firebase.json`.

Lệnh **không deploy** Firestore Security Rules hoặc Indexes.

Nếu lần cập nhật có thay đổi `firestore.rules` hoặc `firestore.indexes.json`, deploy riêng:

```powershell
npx.cmd firebase-tools deploy --only firestore --project personal-hub-1605
```

Chỉ deploy Rules, không deploy Indexes:

```powershell
npx.cmd firebase-tools deploy --only firestore:rules --project personal-hub-1605
```

Cấu hình `firestore` hiện tại trong `firebase.json` chưa khai báo `database`, nên phù hợp với database `(default)`. Nếu `VITE_FIREBASE_DATABASE_ID` trỏ tới một named database, phải cấu hình đúng database đó trong `firebase.json` trước khi deploy Rules/Indexes; truyền đúng `--project` thôi chưa đủ để chọn named database.

## 10. Kiểm tra sau deploy

Mở cả URL production và một route con trực tiếp:

```text
https://personal-hub-1605.web.app
https://personal-hub-1605.web.app/expenses/dashboard
```

Thực hiện smoke test:

1. Đăng ký hoặc đăng nhập bằng email/mật khẩu.
2. Đăng nhập Google.
3. Tải lại trình duyệt tại một route `/expenses/...` để kiểm tra SPA rewrite.
4. Đọc dữ liệu ví, giao dịch, ngân sách và cài đặt.
5. Thử một mutation an toàn trên tài khoản test.
6. Kiểm tra Console của trình duyệt không có lỗi App Check hoặc Firestore permission.
7. Kiểm tra **Firebase Console > App Check > Metrics** trước khi bật hoặc siết enforcement.

## 11. Deploy custom domain

Trong **Firebase Console > Hosting > Add custom domain**:

1. Nhập domain cần dùng.
2. Thêm bản ghi DNS theo hướng dẫn của Firebase.
3. Chờ Firebase xác minh domain và cấp SSL certificate.
4. Thêm custom domain vào Firebase Authentication Authorized domains.
5. Thêm custom domain vào cấu hình reCAPTCHA/App Check.

Không cần sửa React Router khi đổi sang custom domain.

## 12. Xử lý lỗi thường gặp

### `Missing Firebase config` hoặc `Missing VITE_RECAPTCHA_V3_SITE_KEY`

Nguyên nhân: thiếu biến môi trường tại thời điểm build.

Cách xử lý:

1. Kiểm tra `.env.production.local`.
2. Chạy lại `npm.cmd run build`.
3. Deploy lại Hosting.

Chỉ sửa file môi trường rồi deploy lại mà không build sẽ không thay đổi bundle trong `dist`.

### `auth/unauthorized-domain`

Thêm hostname hiện tại vào **Authentication > Settings > Authorized domains**. Với custom domain, kiểm tra thêm cấu hình redirect domain của Google Sign-In.

### App Check từ chối request

Kiểm tra:

- Site key trong bundle có khớp Web App/App Check provider hay không.
- Secret key đã được cấu hình trong Firebase Console hay chưa.
- Domain production hoặc preview đã được reCAPTCHA cho phép chưa.
- App Check Metrics trước khi bật enforcement.

### `FirebaseError: Missing or insufficient permissions`

Không sửa UI ngay. Kiểm tra lần lượt:

1. User có đăng nhập và UID có đúng không.
2. `VITE_FIREBASE_PROJECT_ID` có đúng project không.
3. `VITE_FIREBASE_DATABASE_ID` có đúng database không.
4. Rules local đã được deploy lên đúng project/database chưa.
5. Request có App Check token hợp lệ không.

### Route con bị 404 khi refresh

Xác nhận `firebase.json` vẫn có rewrite:

```json
{
  "source": "**",
  "destination": "/index.html"
}
```

Sau đó deploy lại Hosting.

### Deploy thành công nhưng vẫn thấy giao diện cũ

1. Chạy lại `npm.cmd run build`.
2. Xác nhận thời gian cập nhật của file trong `dist/assets`.
3. Deploy lại với đúng `--project`.
4. Hard refresh trình duyệt.

## 13. Rollback

Nếu bản production có lỗi:

1. Mở **Firebase Console > Hosting**.
2. Chọn release ổn định trước đó trong lịch sử release.
3. Chọn rollback để đưa version đó trở lại live.
4. Sau khi xử lý lỗi local, build và deploy lại theo quy trình phía trên.

## Tài liệu chính thức

- [Bắt đầu với Firebase Hosting](https://firebase.google.com/docs/hosting/quickstart)
- [Kiểm tra, preview và deploy Hosting](https://firebase.google.com/docs/hosting/test-preview-deploy)
- [Cấu hình rewrite và hành vi Hosting](https://firebase.google.com/docs/hosting/full-config)
- [Firebase App Check với reCAPTCHA v3](https://firebase.google.com/docs/app-check/web/recaptcha-provider)
- [Đăng nhập Google trên Firebase Web](https://firebase.google.com/docs/auth/web/google-signin)
