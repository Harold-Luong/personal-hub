# Bảo mật dữ liệu và chống spam trên Firebase

## Mục tiêu

Để bảo vệ dữ liệu trên Firebase trước các hành vi spam hoặc tấn công DoS (Denial of Service), hệ thống sẽ áp dụng nhiều lớp bảo mật thay vì phụ thuộc vào một cơ chế duy nhất.

## 1. Firebase Authentication

Mọi thao tác đọc và ghi dữ liệu đều yêu cầu người dùng phải đăng nhập. Điều này đảm bảo mỗi người dùng chỉ có thể truy cập dữ liệu thuộc về tài khoản của mình và ngăn chặn các request từ người dùng chưa được xác thực.

## 2. Firebase App Check

Firebase App Check bổ sung bằng chứng rằng request đến Firebase được gửi từ
ứng dụng web đã đăng ký. Repo hiện dùng `ReCaptchaV3Provider`; reCAPTCHA v3
đánh giá request ngầm, người dùng không phải giải challenge.

App Check giúp giảm request từ bot, script tự viết và client giả mạo dù chúng
biết Firebase API key. Nó **không** thay thế:

* Firebase Authentication: xác định người dùng là ai.
* Firestore Security Rules: quyết định người dùng được đọc/ghi dữ liệu nào.
* Rate limiting hoặc Cloud Functions: kiểm soát tần suất và các nghiệp vụ cần
  chạy phía server.

API key và reCAPTCHA **site key** được đưa vào bundle web nên không phải secret.
reCAPTCHA **secret key** chỉ được nhập trên Firebase Console, tuyệt đối không
đặt trong `.env.local` hoặc commit vào repo.

### Cấu hình trên Firebase Console

1. Tạo hoặc chọn một reCAPTCHA v3 site, khai báo các domain production sẽ chạy
   ứng dụng, rồi lấy `site key` và `secret key`.
2. Mở Firebase Console của đúng project, vào **Security > App Check > Apps**.
3. Chọn Web app của project, đăng ký provider **reCAPTCHA v3** và nhập
   `secret key` tương ứng.
4. Có thể giữ token TTL mặc định. TTL ngắn tăng mức bảo vệ nhưng làm attestation
   thường xuyên hơn, tăng độ trễ và mức dùng quota.
5. Deploy client có App Check trước. Trong **Security > App Check > APIs**, theo
   dõi tỷ lệ request `Verified`, `Outdated client`, `Unknown origin` và `Invalid`.
6. Khi traffic hợp lệ chủ yếu là `Verified`, bật **Enforce** cho Cloud Firestore
   và các Firebase service khác mà app thực sự sử dụng. Enforcement có thể mất
   một khoảng thời gian mới có hiệu lực.

Chỉ thêm SDK vào client chưa đủ để chặn request: trước khi bật **Enforce**,
Firebase vẫn nhận request không có token để có thể thu thập metrics.

### Cấu hình trong repo

Thêm site key công khai vào `.env.local`:

```dotenv
VITE_RECAPTCHA_V3_SITE_KEY=<recaptcha-v3-site-key>
```

`.env.local` đã được ignore bởi mẫu `*.local`. Không đặt secret key ở đây.

App Check được khởi tạo trong `src/lib/firebase/app.js` ngay sau Firebase app:

```js
initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(recaptchaV3SiteKey),
    isTokenAutoRefreshEnabled: true,
})
```

Vì biến môi trường là bắt buộc, app sẽ dừng sớm với lỗi
`Missing VITE_RECAPTCHA_V3_SITE_KEY` nếu cấu hình thiếu. Chế độ tự refresh giúp
SDK lấy token mới trước khi token cũ hết hạn và tự đính kèm token vào các request
Firebase được hỗ trợ.

Sau khi cấu hình, chạy:

```bash
npm.cmd run dev
npm.cmd run build
```

### Localhost và CI

Repo hiện chưa bật App Check debug provider; local development đang dùng cùng
provider reCAPTCHA v3 như production. Nếu sau khi bật enforcement, localhost
hoặc CI không tạo được token hợp lệ, hãy tích hợp debug provider riêng cho build
development, đăng ký debug token tại **Security > App Check > Apps > Manage
debug tokens**, và giữ token trong secret store. Không commit debug token, không
đưa debug provider vào production build, và không thêm `localhost` vào danh sách
domain chỉ để né App Check.

### Kiểm tra và xử lý lỗi

* Kiểm tra Console không có lỗi thiếu site key hoặc lỗi lấy App Check token.
* Xác nhận site key ở client là cặp tương ứng với secret key đã đăng ký trên
  Firebase Console và Web app thuộc đúng Firebase project.
* Xem **App Check > APIs** trước và sau khi bật enforcement. Request hợp lệ cần
  xuất hiện ở nhóm `Verified`.
* Nếu app cũ chưa có App Check còn đang được sử dụng, đừng bật enforcement cho
  tới khi tỷ lệ `Outdated client` đã đủ thấp; nếu không app cũ sẽ bị từ chối.
* Khi cần rollback sự cố, tắt enforcement cho service bị ảnh hưởng, sửa cấu hình,
  deploy lại và theo dõi metrics trước khi bật lại.

Tài liệu Firebase tham khảo:

* [App Check với reCAPTCHA v3 cho Web](https://firebase.google.com/docs/app-check/web/recaptcha-provider)
* [Theo dõi request metrics](https://firebase.google.com/docs/app-check/monitor-metrics)
* [Bật enforcement](https://firebase.google.com/docs/app-check/enable-enforcement)
* [Debug provider cho Web](https://firebase.google.com/docs/app-check/web/debug-provider)

## 3. Firestore Security Rules

Firestore Security Rules là lớp bảo vệ quan trọng nhất của hệ thống.

Các quy tắc bảo mật sẽ:

* Chỉ cho phép người dùng truy cập dữ liệu của chính mình.
* Chỉ cho phép ghi các trường dữ liệu được định nghĩa trước.
* Kiểm tra kiểu dữ liệu và giá trị của từng field.
* Từ chối các request chứa dữ liệu không hợp lệ hoặc các field không được phép.
* Không cho phép chỉnh sửa hoặc xóa các dữ liệu quan trọng ngoài những trường được hệ thống cho phép.

## 4. Giới hạn tài nguyên

Để hạn chế việc lạm dụng tài nguyên, hệ thống có thể áp dụng các giới hạn như:

* Giới hạn số lượng ví tối đa.
* Giới hạn số lượng danh mục.
* Giới hạn số lượng giao dịch theo từng tài khoản.
* Giới hạn kích thước dữ liệu của từng bản ghi.

Các giới hạn này giúp giảm nguy cơ spam dữ liệu và kiểm soát chi phí sử dụng Firestore.

## 5. Kiểm soát các thao tác quan trọng

Các thao tác ảnh hưởng trực tiếp đến dữ liệu tài chính sẽ được kiểm soát chặt chẽ, bao gồm:

* Tạo giao dịch.
* Cập nhật giao dịch.
* Điều chỉnh số dư ví.
* Thanh toán thẻ tín dụng.
* Chuyển tiền giữa các ví.

Các thao tác này sẽ luôn tuân thủ quy tắc nghiệp vụ của hệ thống nhằm đảm bảo tính toàn vẹn của dữ liệu.

## 6. Định hướng mở rộng

Trong giai đoạn đầu, MoneyCare sẽ sử dụng kết hợp:

* Firebase Authentication
* Firebase App Check
* Firestore Security Rules

Khi hệ thống phát triển và có yêu cầu bảo mật cao hơn, các thao tác ghi dữ liệu quan trọng sẽ được chuyển sang Cloud Functions. Tại đây có thể triển khai các cơ chế như:

* Rate Limiting.
* Kiểm soát tần suất ghi dữ liệu.
* Chống spam.
* Chống DoS.
* Ghi log và theo dõi các hành vi bất thường.

## Kết luận

MoneyCare áp dụng mô hình bảo mật nhiều lớp nhằm đảm bảo dữ liệu luôn được bảo vệ trước các hành vi truy cập trái phép, spam hoặc tấn công DoS. Việc kết hợp Firebase Authentication, Firebase App Check, Firestore Security Rules và Cloud Functions giúp hệ thống vừa đảm bảo an toàn dữ liệu, vừa duy trì hiệu năng và khả năng mở rộng trong tương lai.
