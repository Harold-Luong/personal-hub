# Media Cutter

Media Cutter cho phép người dùng chọn video hoặc MP3, xem trước, chọn khoảng thời gian, cắt nhạc MP3, tách âm thanh từ video hoặc cắt video MP4. Toàn bộ file được xử lý trong trình duyệt; module không có backend, không dùng Firebase Storage và không tải media lên máy chủ.

## Route và cách chạy

- Route: `/tools/media-cutter`
- Development: `npm.cmd run dev`
- Unit test: `npm.cmd test`
- Production build: `npm.cmd run build`

Route được lazy-load từ `AppRoutes.jsx`, vì vậy FFmpeg không làm nặng bundle khởi động của Personal Hub. Bản thân FFmpeg core chỉ được tải sau khi người dùng chọn media lần đầu.

## Dependencies

- `@ffmpeg/ffmpeg` — API worker và filesystem của FFmpeg WASM.
- `@ffmpeg/core` — core single-thread được Vite bundle nội bộ.
- `@ffmpeg/util` — `fetchFile()` để ghi file nguồn vào MEMFS.
- `zustand` — state tạm thời của module, không dùng middleware persist.

Module dùng single-thread core cho MVP nên không yêu cầu `SharedArrayBuffer`, COOP hoặc COEP. Không tự chuyển sang multithread nếu chưa đánh giá tác động của các header này lên Firebase, ảnh và tài nguyên ngoài của toàn Personal Hub.

## Cấu trúc

```text
media-cutter/
  components/   UI upload, preview, timeline, export, progress và result
  constants/    operation, format, bitrate và giới hạn file
  hooks/        lifecycle FFmpeg và đọc metadata media
  pages/        coordinator của route
  routes/       route ownership của module
  services/     command builder, probe stream và xử lý MEMFS
  store/        Zustand store không persist
  styles/       giao diện responsive riêng của module
  utils/        time, filename và validation
```

## Luồng xử lý

1. Kiểm tra extension, MIME và giới hạn dung lượng.
2. Tự nhận biết nguồn audio/video, tạo Object URL để đọc metadata và xem trước bằng player tương ứng.
3. Lazy-load core JS/WASM đã bundle bởi Vite.
4. Chạy `ffmpeg -encoders` và chỉ dùng codec được core hiện tại báo cáo.
5. Ghi media vào MEMFS bằng `fetchFile()`.
6. Tác vụ audio map trực tiếp luồng `0:a:0`; cắt video chính xác dùng `ffprobe` để xác nhận luồng audio.
7. Chạy command FFmpeg bằng argument array.
8. Đọc output, tạo Blob/Object URL và hiển thị player tải xuống.
9. Xóa input, probe và output khỏi MEMFS trong `finally`.
10. Revoke Object URL khi thay file, tạo kết quả mới hoặc unmount.

## Commands

Tách toàn bộ MP3:

```text
-i INPUT -vn -codec:a libmp3lame -b:a BITRATEk OUTPUT.mp3
```

Cắt MP3 dùng thời lượng tương đối:

```text
-ss START -i INPUT -t DURATION -vn -codec:a libmp3lame -b:a BITRATEk OUTPUT.mp3
```

Cắt nhanh MP4:

```text
-ss START -i INPUT -t DURATION -map 0:v:0 -map 0:a:0? -c copy -movflags +faststart OUTPUT.mp4
```

Cắt chính xác ưu tiên `libx264`; nếu core không có H.264 nhưng có `mpeg4`, module dùng MPEG-4 Part 2 fallback. Audio được encode AAC khi nguồn có audio và core báo cáo encoder AAC.

## Giới hạn hiện tại

- Desktop: 200 MB.
- Mobile/coarse pointer: 50 MB.
- Input: MP3, MP4, WebM, MOV. Nguồn MP3 chỉ mở thao tác cắt âm thanh; nguồn video giữ các thao tác tách audio và cắt video.
- Output MVP: MP3 và MP4. M4A chưa mở trong UI cho đến khi có ma trận kiểm thử browser/codec ổn định.
- Cắt nhanh có thể lệch điểm bắt đầu do keyframe hoặc thất bại khi codec nguồn không tương thích MP4.
- Cắt chính xác chậm và tốn bộ nhớ hơn đáng kể.
- Browser có thể hết bộ nhớ trước giới hạn UI tùy thiết bị và codec.
- Progress phần trăm chỉ được hiển thị cho tác vụ tách toàn bộ audio. FFmpeg ghi rõ progress event không chính xác khi input/output khác thời lượng, nên tác vụ trim dùng progress indeterminate thay vì giả lập phần trăm.
- Nút hủy gọi `FFmpeg.terminate()`. Worker và MEMFS bị giải phóng, và core được khởi tạo lại khi người dùng thử tiếp.

## Core path và CORS

`useFfmpeg.js` import `@ffmpeg/core?url` và `@ffmpeg/core/wasm?url`. Vite phát hành hai asset cùng deployment với ứng dụng, tránh phụ thuộc CDN và CORS ở runtime.

Nếu chuyển core sang một origin khác trong tương lai, origin đó phải cho phép tải JS/WASM bằng CORS và trả đúng MIME cho `.wasm` (`application/wasm`). Không nên dùng CDN không được kiểm soát. Khi nâng version, cần kiểm tra lại API `load`, `terminate`, `deleteFile`, danh sách encoder và production build.

## Hướng nâng cấp backend

File lớn hoặc encode dài có thể chuyển sang job backend có upload riêng tư, signed URL, queue, giới hạn dung lượng, cleanup theo TTL và trạng thái tiến trình. Đây là một kiến trúc khác; không nên thêm upload âm thầm vào module browser-only hiện tại.
