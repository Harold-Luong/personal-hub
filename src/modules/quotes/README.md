# Quotes

Quotes là module đọc, khám phá, lưu và tạo ảnh từ các câu nói trong Personal Hub. Danh mục quote và ảnh nền mặc định được bundle cùng frontend; trạng thái yêu thích của từng người dùng được đồng bộ bằng Cloud Firestore.

Module cần Firebase Authentication. `QuotesRouter` chỉ render các trang sau khi có `uid` và danh sách yêu thích đã đồng bộ xong.

## Hướng dẫn dành cho AI agent

Trước khi sửa module này, mọi AI agent phải đọc [`AI_GUIDE.md`](./AI_GUIDE.md). Đây là nguồn hướng dẫn chung, không phụ thuộc Codex, Claude, Gemini, Copilot hay model cụ thể nào. File đó chứa invariant, boundary, bản đồ thay đổi và checklist xác minh. README này mô tả hành vi sản phẩm; khi hành vi hoặc data contract thay đổi, phải cập nhật đồng thời cả hai file.

## Route

| Route | Chức năng |
| --- | --- |
| `/quotes` | Hiển thị quote ngẫu nhiên, điều hướng trước/sau và Auto Mode. |
| `/quotes/explore` | Hiển thị các chủ đề. Chủ đề đang chọn nằm trong query `?category=<categoryId>`. |
| `/quotes/favorites` | Hiển thị các quote người dùng đã lưu. |
| `/quotes/create` | Tùy chỉnh quote, ảnh nền và xuất ảnh PNG. |

Route không hợp lệ bên dưới `/quotes/*` được chuyển về `/quotes`.

## Chức năng chính

### Quote ngẫu nhiên và shuffle bag

`useRandomQuote` sử dụng các hàm thuần trong `utils/quoteShuffle.js` để quản lý thứ tự hiển thị:

- Toàn bộ quote được xáo trộn ngay khi khởi tạo, vì vậy quote đầu tiên cũng ngẫu nhiên.
- Mỗi quote được hiển thị đúng một lần trong một chu kỳ.
- Khi bag hết, toàn bộ quote được xáo lại. Quote đầu tiên của chu kỳ mới không trùng quote đang hiển thị nếu danh sách có nhiều hơn một phần tử.
- Lịch sử trước/sau được giữ riêng. Nếu người dùng quay lại rồi đi tiếp, module phát lại lịch sử phía trước mà không lấy thêm quote khỏi bag.
- Chuyển quote có pha rời màn hình 150 ms và pha đi vào 300 ms; thao tác mới bị bỏ qua khi transition chưa về `idle`.

Người dùng có thể đổi quote bằng nút điều hướng, vuốt ngang, phím `Space`, `ArrowRight` hoặc `ArrowLeft`.

### Auto Mode và nhạc nền

Auto Mode tạo một timer mới ngẫu nhiên từ 20 đến 30 giây cho mỗi quote. Timer chỉ chạy khi:

- Auto Mode đang bật;
- tab hiện đang visible;
- transition đang ở trạng thái `idle`.

Khi tab bị ẩn, timer hiện tại bị hủy. Khi quay lại tab, một timer 20–30 giây mới được tạo thay vì tiếp tục phần thời gian còn lại.

Nhạc nền được nạp từ `assets/music` bằng `import.meta.glob`, hỗ trợ `.m4a`, `.mp3`, `.ogg` và `.wav`. Danh sách file được sắp xếp theo đường dẫn và phát lần lượt; hết danh sách sẽ quay lại bài đầu. Âm lượng mục tiêu là 30%, fade-in 1,2 giây và fade-out 0,8 giây.

### Khám phá theo chủ đề

Các chủ đề hiện có:

- `life` — Cuộc sống
- `healing` — Chữa lành
- `ancient` — Cổ phong
- `peace` — Bình yên
- `family` — Gia đình
- `work` — Công việc
- `motivation` — Động lực
- `lonely` — Cô đơn

Số quote của mỗi chủ đề được tính từ `quotes` khi module khởi tạo, không lưu thủ công trong metadata chủ đề.

### Yêu thích và Firestore

Mỗi favorite là một document tại:

```text
users/{uid}/modules/quotes/favorites/{quoteId}
```

Schema:

```js
{
    quoteId: "ancient-dream",
    createdAt: serverTimestamp(),
}
```

`useFavorites(uid)` subscribe collection theo thời gian thực và cập nhật UI theo kiểu optimistic. Nếu thao tác Firestore thất bại, state tạm được rollback.

Rules chỉ cho chính chủ tài khoản đọc, tạo và xóa favorite; không cho update document. Khi tạo mới, `quoteId` phải nằm trong allowlist `isKnownQuoteId()` của `firestore.rules` và `createdAt` phải bằng `request.time`.

Các favorite cũ trong localStorage key `lang.favorite-quote-ids` được migrate một lần lên Firestore rồi xóa khỏi localStorage. Theme vẫn được lưu cục bộ bằng key `lang.theme`.

### Tạo và tải ảnh quote

Trang `/quotes/create` cho phép tùy chỉnh:

- quote;
- ảnh nền mặc định hoặc ảnh từ thiết bị;
- font Cormorant, Lora hoặc Playfair;
- cỡ và màu chữ;
- độ tối ảnh;
- căn trái, giữa hoặc phải;
- tỉ lệ dọc 4:5, story 9:16, vuông 1:1 hoặc ngang 16:9.

Ảnh tải từ thiết bị chỉ hỗ trợ JPG, PNG và WebP, tối đa 10 MB. File được đọc thành Data URL và chỉ tồn tại trong bộ nhớ của trang hiện tại; module không tải ảnh lên Firebase Storage hay máy chủ. Reload trang sẽ xóa ảnh đã chọn.

Khi lưu, module chờ font và ảnh preview decode xong rồi dùng `html-to-image` tạo PNG với `pixelRatio: 2`. Tên file có dạng:

```text
lang-{quoteId}-{ratio}.png
```

## Cấu trúc thư mục

```text
quotes/
  api/          Firestore repository cho favorite
  assets/       Ảnh nền và playlist nhạc
  components/   Header, hero, card, creator controls và preview
  constants/    Route, localStorage key và creator options
  data/         Danh mục quote, chủ đề và background mapping
  hooks/        Random navigation, favorite sync, audio, swipe và theme
  pages/        Home, Explore, Favorites và Create
  routes/       Route ownership và UID wiring của module
  styles/       SCSS responsive riêng của Quotes
  utils/        Shuffle bag và kiểm tra file ảnh upload
```

Các boundary chính:

- `routes/QuotesRouter.jsx`: lấy `uid`, khởi tạo favorite/theme và khai báo route.
- `data/quoteData.js`: nguồn sự thật cho category, quote và ảnh nền mặc định.
- `utils/quoteShuffle.js`: thuật toán shuffle bag thuần, không phụ thuộc React.
- `api/quoteFavoritesRepository.js`: nơi duy nhất đọc/ghi favorite với Firestore.
- `pages/CreatePage.jsx`: điều phối preview, upload ảnh và xuất PNG.

## Thêm quote mới

Thêm quote vào đúng nhóm chủ đề trong `data/quoteData.js`. Mỗi phần tử `rawQuotes` phải giữ thứ tự field thống nhất, với `id` đứng đầu:

```js
{
    id: "ancient-example",
    categoryId: "ancient",
    backgroundId: "ancient",
    author: "Khuyết danh",
    text: "Nội dung câu nói.",
}
```

Quy ước:

- Thứ tự field: `id`, `categoryId`, `backgroundId`, `author`, `text`.
- `id` duy nhất, viết thường theo kebab-case và bắt đầu bằng `${categoryId}-`.
- `categoryId` phải tồn tại trong `rawCategories`.
- `backgroundId` hiện phải bằng `categoryId` và tồn tại trong `quoteBackgrounds`.
- `author` và `text` không được rỗng.

Sau khi thêm quote:

1. Thêm `id` mới vào allowlist `isKnownQuoteId()` trong `firestore.rules`. Nếu bỏ qua bước này, quote vẫn hiển thị nhưng người dùng không thể thêm nó vào yêu thích.
2. Cập nhật số lượng mong đợi trong `data/quoteData.test.js` nếu test đang khóa tổng số quote.
3. Chạy test, lint và build.
4. Nếu Rules thay đổi, deploy Firestore Rules riêng.

## Thêm ảnh nền hoặc nhạc

Ảnh nền mặc định nằm trong `assets/backgrounds`. Import asset trong `data/quoteData.js`, sau đó thêm mapping vào `quoteBackgrounds`. `backgroundId` của category/quote phải tham chiếu đúng key này.

Nhạc chỉ cần đặt vào `assets/music` với một trong các extension được hỗ trợ. Hook sẽ tự phát hiện file khi Vite build; thứ tự phát là thứ tự đường dẫn sau khi sort.

## Kiểm tra và chạy local

```powershell
npm.cmd run dev
npm.cmd test -- src/modules/quotes
npm.cmd run lint
npm.cmd run build
```

Deploy Firestore Rules sau khi thay đổi allowlist quote:

```powershell
npx.cmd -y firebase-tools@latest deploy --only firestore:rules
```

Thay đổi frontend cần build và deploy Hosting theo workflow chung của repository; chỉ deploy Firestore Rules sẽ không cập nhật giao diện hoặc dữ liệu quote được bundle trong frontend.
