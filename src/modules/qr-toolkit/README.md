# QR Code Toolkit

QR Code Toolkit là module public tại `/tools/qr` để tạo, tùy chỉnh, kiểm tra, tải xuống và quét QR Code. Toàn bộ payload, logo, camera và ảnh quét được xử lý trong trình duyệt; module không gọi Firebase, không có backend và không upload dữ liệu.

## Cài đặt và chạy

Yêu cầu Node.js tương thích Vite 8.

```bash
npm install
npm run dev
```

Kiểm tra và build production:

```bash
npm test -- src/modules/qr-toolkit
npm run lint
npm run build
```

## Dependencies

- `qr-code-styling`: tạo SVG thật, dots/corners/gradient/logo và export PNG, SVG, JPEG, WEBP.
- `@zxing/browser`: đọc QR từ camera và ảnh trong browser.
- `lucide-react`: icon giao diện.
- React, React Router, Sass và Vite dùng chung với Personal Hub.

## Tính năng

- Tạo 7 loại QR: URL, text Unicode, Wi-Fi, vCard 3.0, email, SMS và iCalendar/VEVENT có timezone.
- URL thiếu protocol được chuẩn hóa sang HTTPS; từng form có validation tại field.
- Tùy chỉnh màu, transparent, linear/radial gradient, dots, hai lớp corner, logo, kích thước, margin và error correction.
- 7 preset: Classic, Rounded, Minimal, Gradient, Dark, Colorful và With Logo.
- Preview debounce theo thời gian thực, zoom, fullscreen và self-test bằng cách đọc lại QR vừa render.
- Export PNG/SVG/JPEG/WEBP. SVG là output vector của `qr-code-styling`; logo được nhúng bằng data/blob thay vì upload.
- Camera scanner có chọn thiết bị, dừng khi thành công/đổi tab/unmount và thông báo lỗi quyền hoặc thiếu camera.
- Image scanner hỗ trợ kéo thả PNG/JPG/WEBP tối đa 10 MB, preview và thu hồi Object URL.
- Parser nhận diện URL, text, Wi-Fi, email, SMS, phone, vCard và event. Không tự mở liên kết sau khi quét.
- Responsive desktop/mobile, dark mode, keyboard focus, ARIA state, loading/error/success feedback.
- Trên desktop, preview được giữ cố định bên phải khi cuộn qua bảng style; trên mobile thứ tự vẫn là form, preview rồi style.

## Cấu trúc

```text
qr-toolkit/
  components/       form controls, preview, style, download, camera/image scanner, scan result
    forms/          7 form tạo payload và field dùng chung
  constants/        demo data, giới hạn, style mặc định và preset
  hooks/            lifecycle QR renderer, debounce và self-test
  lib/              payload builders, parser, validation và mapping style/export
  pages/            coordinator của workspace
  routes/           ownership nhánh `/tools/qr/*`
  styles/           theme, desktop/mobile và trạng thái scanner
```

## Quyết định kỹ thuật

- Module được lazy-load từ router; hai scanner tiếp tục được lazy-load theo tab. ZXing chỉ được import khi self-test hoặc quét thật sự chạy.
- Source của module dùng JavaScript/JSX để thống nhất với phần còn lại của Personal Hub.
- `qr-code-styling.update()` cập nhật instance hiện có sau debounce 120 ms; không remount toàn workspace khi đổi một thuộc tính.
- Chỉ style và theme được lưu vào `localStorage`. Payload, form, logo, ảnh scan, scan result và mật khẩu Wi-Fi không được persist.
- Khi có logo, renderer luôn dùng error correction `H` và UI giải thích lựa chọn này.
- URL action chỉ xuất hiện cho `http:`/`https:` hợp lệ. `javascript:`, `data:` và protocol khác được coi là text, không có nút mở.
- React render text bằng escaping mặc định; payload scan không được đưa vào `innerHTML` hoặc thực thi.

## Hỗ trợ trình duyệt

- Chrome/Edge bản hiện đại trên desktop và Android.
- Firefox bản hiện đại.
- Safari 16+ trên macOS/iOS.
- Tạo và quét ảnh hoạt động trên HTTP local; camera yêu cầu HTTPS hoặc `localhost` và quyền của người dùng.

## Giới hạn scanner

- Camera phụ thuộc `MediaDevices`, quyền trình duyệt, ánh sáng, autofocus và chất lượng phần cứng.
- iOS có thể không hiển thị label camera cho đến sau lần cấp quyền đầu tiên.
- Một số WebView hoặc trình duyệt doanh nghiệp chặn camera dù trang dùng HTTPS.
- Image scanner trả kết quả QR đầu tiên mà ZXing đọc được; chưa liệt kê nhiều QR trong cùng ảnh.
- QR có tương phản thấp, logo quá lớn, margin quá nhỏ hoặc nội dung quá dài có thể không quét ổn định. Nút self-test chỉ xác nhận trên decoder của thiết bị hiện tại, không thay thế kiểm tra trên nhiều điện thoại.

## Giới hạn file

- Logo: PNG, JPG, SVG, WEBP, tối đa 2 MB.
- Ảnh scan: PNG, JPG/JPEG, WEBP, tối đa 10 MB.
- Text: tối đa 1.200 ký tự, cảnh báo từ 800 ký tự.

Không cần migration Firestore hoặc deploy Rules. Thay đổi frontend chỉ cần build và deploy Hosting khi người dùng yêu cầu.
