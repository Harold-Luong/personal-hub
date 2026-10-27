# Âm lịch

Âm lịch là module Personal Hub yêu cầu đăng nhập, nhúng ứng dụng tại
`https://am-lich.lich-viet.workers.dev/` theo mẫu CV Studio.

## Route và ranh giới tích hợp

- Hub khai báo thẻ module và tải module khi mở `/am-lich/*`.
- `AmLichRouter.jsx` hiển thị trang chính, chuyển đường dẫn con không hợp lệ về `/am-lich`.
- `AmLichPage.jsx` chứa iframe, nút quay về Hub và liên kết “Mở tab mới”.
- Website nguồn sở hữu tính năng, dữ liệu và việc triển khai ứng dụng lịch.
- Module không khởi tạo dữ liệu Firestore và không truyền phiên đăng nhập Personal Hub sang website nguồn.
- URL nguồn được khai báo trực tiếp trong trang. Nếu website nguồn chặn nhúng bằng
  `X-Frame-Options` hoặc CSP `frame-ancestors`, người dùng vẫn có thể mở tab mới.

## Kiểm tra

Chạy `npm run lint`, `npm run build`; kiểm tra thẻ Âm lịch tại `/hub`, route
`/am-lich`, nút quay về Hub và mở tab mới trên desktop/mobile khi đăng nhập.
Khi chưa đăng nhập, `/am-lich` chuyển về `/auth`.
