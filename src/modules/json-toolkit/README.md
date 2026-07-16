# JSON Toolkit

## Hướng dẫn dành cho AI agent

Trước khi sửa module này, đọc [`AI_GUIDE.md`](../../../AI_GUIDE.md) và toàn bộ README này. Giữ nguyên boundary xử lý dữ liệu trên thiết bị, đối chiếu thay đổi với các test formatter/diff/editor hiện có và cập nhật tài liệu khi route, giới hạn hoặc semantics xử lý thay đổi.

JSON Toolkit là công cụ định dạng, kiểm tra, thu gọn, sắp xếp JSON, đồng thời so sánh JSON hoặc văn bản ngay trong trình duyệt. Module không có backend, không dùng Firebase và không gửi nội dung đầu vào ra khỏi thiết bị.

## Route và cách chạy

- Route: `/tools/json`
- Development: `npm.cmd run dev`
- Unit test: `npm.cmd test`
- Lint: `npm.cmd run lint`
- Production build: `npm.cmd run build`

Route được lazy-load từ `AppRoutes.jsx` và có thể mở khi chưa đăng nhập. Router của module sở hữu toàn bộ nhánh `/tools/json/*`; đường dẫn con không hợp lệ được chuyển về `/tools/json`.

## Tính năng

### Định dạng

- Parse JSON bằng `JSON.parse()` trước khi tạo kết quả.
- Hỗ trợ thụt lề 2 hoặc 4 spaces.
- Không sửa trực tiếp nội dung đầu vào; kết quả xuất hiện trong editor bên phải.

### Thu gọn

- Loại bỏ khoảng trắng định dạng bằng `JSON.stringify()` không truyền spacing.
- Giữ nguyên giá trị và thứ tự phần tử trong mảng.

### Kiểm tra

- Kiểm tra cú pháp JSON chuẩn bằng parser của trình duyệt.
- Hiển thị trạng thái hợp lệ hoặc thông báo lỗi kèm dòng/cột khi parser cung cấp vị trí.
- Tô đỏ số dòng và nền của dòng bị lỗi.
- Khi người dùng sửa nội dung, kết quả kiểm tra và highlight lỗi cũ được xóa.

Đây chỉ là kiểm tra cú pháp. Module không kiểm tra JSON Schema, kiểu dữ liệu nghiệp vụ hoặc các trường bắt buộc của một API cụ thể.

### Sort A–Z

- Sắp xếp key của object theo thứ tự tăng dần, không phân biệt hoa thường và có hỗ trợ so sánh số trong tên key.
- Thực hiện đệ quy với object lồng nhau.
- Không thay đổi thứ tự phần tử của mảng; chỉ tiếp tục sắp xếp object nằm bên trong từng phần tử.

### So sánh

- Cho phép chọn kiểu dữ liệu **JSON** hoặc **Văn bản** trong chế độ so sánh.
- Với JSON: so sánh đệ quy JSON A và JSON B sau khi cả hai tài liệu đã parse thành công; object theo key và mảng theo index.
- Với văn bản: so sánh từng dòng, giữ đúng số dòng của mỗi editor và dùng các dòng duy nhất làm điểm neo để một dòng được chèn/xóa không làm lệch toàn bộ phần phía sau.
- Phân loại khác biệt thành `added`, `removed` và `changed`, sau đó tô màu dòng tương ứng ở cả hai editor.
- Trên dòng thay đổi, đánh dấu chính xác từng cụm ký tự bị xóa ở Văn bản A và từng cụm ký tự được thêm ở Văn bản B; hỗ trợ nhiều cụm khác nhau trên cùng dòng và Unicode/emoji.
- Kết quả JSON hiển thị cây diff theo path, ví dụ `profile.name` hoặc `items[2]`.
- Kết quả văn bản hiển thị số dòng A/B, nội dung trước/sau và tổng số dòng theo từng loại thay đổi.
- Nếu không có khác biệt, thông báo hai tài liệu hoặc hai văn bản giống nhau.

So sánh hiện tại phục vụ đọc trên UI, không tạo JSON Patch, unified diff và không hỗ trợ tự động merge. Danh sách kết quả văn bản chỉ render 200 thay đổi đầu tiên để giữ giao diện ổn định; số tổng và highlight trong editor vẫn phản ánh toàn bộ kết quả.

### Sao chép và tải xuống

- Nút **Sao chép** ghi toàn bộ kết quả vào clipboard.
- Nhấn `Ctrl/Cmd + C` khi focus editor kết quả cũng sao chép toàn bộ kết quả.
- Nút **Tải xuống** chuẩn hóa lại kết quả theo mức thụt lề đang chọn nếu có thể, sau đó tạo Blob và tải file `formatted.json`.
- Hai nút chỉ được bật khi editor kết quả có nội dung.

## Phím tắt

| Phím tắt | Hành động |
| --- | --- |
| `Ctrl/Cmd + Enter` | Định dạng JSON |
| `Ctrl/Cmd + Shift + M` | Thu gọn JSON |
| `Ctrl/Cmd + Shift + V` | Kiểm tra JSON |
| `Ctrl/Cmd + Shift + D` | Bật chế độ so sánh; nếu đang ở chế độ so sánh thì chạy so sánh |
| `Tab` | Chèn 2 hoặc 4 spaces theo cấu hình thụt lề |

## Giới hạn đầu vào

- Mỗi editor đầu vào, gồm JSON/văn bản A và B, nhận tối đa **512 KB** (`524.288` bytes).
- Dung lượng được tính theo UTF-8 thực tế; tiếng Việt và emoji có thể dùng nhiều byte cho một ký tự.
- Editor hiển thị đồng thời số ký tự và dung lượng hiện tại so với giới hạn.
- Từ 90% giới hạn, bộ đếm đổi màu cảnh báo.
- Khi đạt giới hạn, UI hiển thị trạng thái tương ứng.
- Nhập, paste hoặc chèn Tab làm nội dung vượt giới hạn sẽ bị từ chối và hiển thị toast lỗi.
- Nếu một phép biến đổi nội bộ tạo ra chuỗi lớn hơn giới hạn, người dùng vẫn có thể xóa bớt nội dung; thay đổi làm dung lượng tăng thêm tiếp tục bị chặn.

Giới hạn 512 KB phù hợp với editor hiện tại vì syntax highlighting và line number được tạo cho toàn bộ tài liệu. Tăng giới hạn cần được đánh giá lại trên desktop, mobile và các tài liệu có rất nhiều token hoặc dòng.

## Cú pháp JSON được chấp nhận

Module dùng JSON chuẩn. Các dạng sau không hợp lệ:

- Comment `//` hoặc `/* ... */`.
- Dấu phẩy thừa trước `}` hoặc `]`.
- Key không có dấu ngoặc kép.
- Chuỗi dùng dấu nháy đơn.
- Giá trị JavaScript như `undefined`, `NaN` hoặc `Infinity`.

## Cấu trúc

```text
json-toolkit/
  components/   editor, toolbar, validation panel, JSON diff tree và text diff panel
  hooks/        tự điều chỉnh chiều cao textarea
  pages/        coordinator của route và trạng thái UI
  routes/       route ownership của module
  styles/       giao diện responsive và các màu highlight
  utils/        validate, format, sort, JSON/text diff, clipboard, download, size và syntax highlight
```

## Luồng xử lý

### Format, minify và sort

1. Nhận chuỗi từ editor đầu vào.
2. Chạy `validateJson()`.
3. Nếu sai cú pháp, hiển thị lỗi và không thay đổi output.
4. Nếu hợp lệ, biến đổi giá trị đã parse rồi serialize bằng `JSON.stringify()`.
5. Ghi chuỗi kết quả vào editor output và hiển thị trạng thái hợp lệ.

### Validate

1. Chạy `JSON.parse()` trên chuỗi đầu vào.
2. Nếu parser trả position, quy đổi position sang dòng/cột.
3. Nếu parser trả trực tiếp line/column, dùng vị trí đó.
4. Truyền dòng lỗi vào `JsonEditor` qua `lineHighlights` với tone `error`.
5. `ValidationPanel` hiển thị cùng dòng/cột bằng `role="alert"`.

### Compare JSON

1. Validate JSON A; dừng ngay và gắn nhãn lỗi `JSON A` nếu không hợp lệ.
2. Validate JSON B; dừng ngay và gắn nhãn lỗi `JSON B` nếu không hợp lệ.
3. So sánh hai giá trị đã parse theo object key hoặc array index.
4. Serialize lại hai phía và ánh xạ path diff sang phạm vi dòng.
5. Cập nhật highlight cho hai editor và dựng cây diff.

### Compare văn bản

1. Chuẩn hóa kiểu xuống dòng CRLF/CR thành LF để tránh khác biệt giả giữa các hệ điều hành.
2. Bỏ qua phần đầu và cuối gồm các dòng hoàn toàn giống nhau.
3. Tìm các dòng duy nhất xuất hiện ở cả hai phía và giữ chuỗi điểm neo đúng thứ tự.
4. Phân loại phần còn lại thành dòng thêm, xóa hoặc thay đổi; phép so sánh nội dung có phân biệt hoa thường và khoảng trắng.
5. Với từng cặp dòng thay đổi, tìm chuỗi ký tự chung để tách các cụm ký tự thêm/xóa; dòng quá dài dùng vùng prefix/suffix an toàn để tránh cấp phát ma trận quá lớn.
6. Truyền số dòng gốc và các khoảng ký tự vào `JsonEditor` để gutter, nền dòng và marker ký tự dùng chung vị trí cuộn.

## Đồng bộ editor, gutter và highlight

`JsonEditor` có ba lớp phải luôn dùng chung vị trí cuộn của textarea:

- `json-editor-card__gutter-lines`: danh sách số dòng.
- `json-editor-card__syntax-layer`: syntax highlighting.
- `json-editor-card__highlight-layer`: nền của dòng lỗi hoặc dòng diff.

Textarea là nguồn duy nhất của `scrollTop` và `scrollLeft`. Gutter không dùng vùng cuộn độc lập; lớp số dòng được dịch chuyển bằng `translateY(-textarea.scrollTop)` để không bị clamp khác textarea khi xuất hiện thanh cuộn ngang. Marker highlight lấy `offsetTop` của đúng dòng trong gutter rồi áp dụng cùng offset cuộn.

Chiều cao dòng dùng giá trị nguyên và thống nhất giữa textarea, syntax, gutter và marker: 22 px trên desktop, 20 px trên mobile. Không nên đưa lại line-height thập phân hoặc gán `gutter.scrollTop = textarea.scrollTop`, vì sai số hoặc scroll range khác nhau sẽ làm lệch highlight trên tài liệu dài.

## Quyền riêng tư

- Toàn bộ parse, format, sort và diff chạy trong browser.
- Module không gọi API, không ghi Firestore và không upload tài liệu.
- Nội dung không được persist vào localStorage hoặc sessionStorage.
- Clipboard chỉ được truy cập khi người dùng chủ động sao chép.
- File tải xuống được tạo bằng Blob URL và URL được thu hồi ngay sau khi bắt đầu download.

## Kiểm thử

Các unit test hiện có bao phủ:

- Format, minify và sort.
- Diff object, array, đếm khác biệt và ánh xạ highlight theo dòng.
- Diff văn bản theo dòng, gồm thêm, xóa, thay đổi và chuẩn hóa kiểu xuống dòng.
- Marker ký tự gồm nhiều vùng trên một dòng, chèn ký tự, Unicode và emoji.
- Tokenize syntax.
- Đếm byte UTF-8 và định dạng giới hạn 512 KB.

Chạy toàn bộ test:

```bash
npm.cmd test
```

Trước khi bàn giao thay đổi UI hoặc logic, chạy thêm:

```bash
npm.cmd run lint
npm.cmd run build
```

Với thay đổi liên quan scrolling hoặc line highlight, cần kiểm tra thủ công tài liệu dài có thanh cuộn ngang và lỗi ở gần cuối file để phát hiện regression đồng bộ gutter/marker.

## Giới hạn hiện tại

- Chỉ báo lỗi cú pháp đầu tiên mà `JSON.parse()` gặp.
- Nội dung lỗi đã được chuẩn hóa thành thông báo tiếng Việt chung; chưa phân loại chi tiết lỗi như thiếu dấu phẩy hoặc thiếu dấu ngoặc.
- Khả năng lấy dòng/cột phụ thuộc định dạng `SyntaxError` mà JavaScript runtime cung cấp.
- Không có JSON Schema, JSONPath query, search/replace hoặc merge diff.
- Syntax highlighting không virtualize; tài liệu nhiều dòng vẫn tạo line number cho toàn bộ nội dung.
