# 💸 Giao diện Frontend QLchitieu (Thêm giao dịch & Báo cáo thu chi)

Hai màn hình tiếp nối phần Đăng nhập & Xác thực: **Thêm giao dịch** để ghi nhanh khoản thu / khoản chi, và **Báo cáo thu chi** để xem dòng tiền theo tháng. Giao diện theo Design System trong Figma (xanh chính `#2E7D60`, xanh nhạt `#EAF5F0`, đỏ `#D95B51`, nền `#F5F7F8`), responsive và dùng chung `API` / `CONFIG` của phần đăng nhập.

---

## 📁 Các tệp được bổ sung

```
Frontend/
├── transactions.html    # Màn hình Thêm giao dịch (form + xem trước)
├── reports.html         # Màn hình Báo cáo thu chi (biểu đồ + thống kê)
├── css/
│   └── pages.css        # Styling dùng chung cho 2 màn hình mới
└── js/
    ├── api.js           # (CẬP NHẬT) thêm getCategories, getTransactions, createTransaction
    ├── utils.js         # Hàm tiện ích: chặn chưa đăng nhập, định dạng tiền VNĐ, toast, đăng xuất
    ├── transactions.js  # Logic form thêm giao dịch, xem trước, kiểm tra dữ liệu
    └── reports.js       # Tổng hợp số liệu, vẽ biểu đồ tròn / biểu đồ cột
```

> `config.js` và `auth.js` giữ nguyên. `auth.js` chỉ dành cho trang đăng nhập nên hai màn hình mới không dùng.

Thứ tự nạp script trong cả hai trang: `config.js` → `api.js` → `utils.js` → tệp riêng của trang.

---

## ⚡ Hướng dẫn chạy

1. Khởi động cơ sở dữ liệu và Backend như phần Đăng nhập (`docker compose up -d`, sau đó `npm run start:dev` trong thư mục `backend`).
2. Backend cần bật CORS và tiền tố `api/v1` (`app.setGlobalPrefix('api/v1')`, `app.enableCors()`).
3. Mở `index.html`, đăng nhập, rồi vào `transactions.html` hoặc `reports.html` (hoặc mở bằng Live Server tại `http://127.0.0.1:5500`).
4. Trên `dashboard.html`, thêm liên kết vào thanh điều hướng:

   ```html
   <a href="transactions.html">Thêm giao dịch</a>
   <a href="reports.html">Báo cáo</a>
   ```

Chưa đăng nhập thì cả hai trang tự động quay về `index.html`.

---

## 🧾 Màn hình Thêm giao dịch (`transactions.html`)

- **Tab Khoản chi / Khoản thu:** đổi loại giao dịch, danh sách danh mục tự lọc theo loại.
- **Ô số tiền lớn:** tự thêm dấu chấm ngăn cách hàng nghìn khi nhập (ví dụ `1.250.000`).
- **Lưới danh mục:** lấy từ `GET /categories`, kèm biểu tượng theo tên (Ăn uống, Di chuyển, Mua sắm, Hóa đơn, Giải trí, Sức khỏe, Gia đình, Khác).
- **Ví, ngày, ghi chú:** ví lấy từ `GET /wallets`, ngày mặc định là hôm nay, ghi chú tối đa 200 ký tự (không bắt buộc).
- **Khung Xem trước giao dịch:** cập nhật ngay khi nhập, hiển thị loại, số tiền (`−`/`+`), danh mục, ví, ngày, ghi chú.
- **Kiểm tra dữ liệu:** số tiền phải lớn hơn 0, phải chọn danh mục, ví và ngày. Lỗi hiện ngay dưới form.
- **Lưu giao dịch:** gọi `POST /transactions`, thành công thì hiện thông báo và đặt lại form. Nút **Nhập lại** xóa toàn bộ dữ liệu đang nhập.

---

## 📊 Màn hình Báo cáo thu chi (`reports.html`)

- **Bộ chọn thời gian:** Tháng này / Tháng trước / 2 tháng trước.
- **3 thẻ tổng quan:** Tổng thu, Tổng chi, Thu – Chi.
- **Cơ cấu chi tiêu:** biểu đồ tròn (4 nhóm chi lớn nhất và nhóm Khác) kèm phần trăm.
- **Thu và chi theo tháng:** biểu đồ cột so sánh 6 tháng gần nhất.
- **Chi tiết theo danh mục:** các khoản chi sắp xếp theo tỷ trọng, có thanh tiến độ.
- **Nhận xét nhanh:** nhóm chi nhiều nhất, mức tăng giảm chi tiêu so với tháng trước, tỷ lệ tiết kiệm trên thu nhập.

Trang gọi **một** request `GET /transactions` cho 6 tháng gần nhất, rồi tự tổng hợp trên trình duyệt. Biểu đồ vẽ bằng SVG và CSS thuần, không cần thư viện ngoài.

---

## 🔌 API Backend cần cung cấp

Tất cả endpoint đều dùng JWT (`Authorization: Bearer <token>`) và trả về định dạng `{ success, message, data }`.

| Method | Endpoint | Dùng cho | Ghi chú |
|---|---|---|---|
| GET | `/wallets` | Chọn ví | Mỗi ví có `id`, `name` |
| GET | `/categories` | Lưới danh mục | Mỗi danh mục có `id`, `name`, `type` (`income` / `expense`) |
| GET | `/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD` | Báo cáo | Chỉ trả giao dịch của người dùng đang đăng nhập |
| POST | `/transactions` | Lưu giao dịch | Body bên dưới |

**Body `POST /transactions`:**

```json
{
  "type": "expense",
  "amount": 50000,
  "categoryId": "…",
  "walletId": "…",
  "date": "2026-11-18",
  "note": "Ăn trưa cùng bạn"
}
```

**Mỗi giao dịch trả về nên có:** `id`, `type`, `amount`, `date`, `note`, `categoryId`, `walletId` và `category: { name }`.

> Backend nên tự cộng / trừ số dư ví khi tạo giao dịch.

---

## ⚙️ Cấu hình cần lưu ý

- **Giá trị `type` của giao dịch:** mặc định là `expense` / `income`. Nếu Backend dùng giá trị khác, sửa hằng `TX_TYPE` ở đầu `js/utils.js`.
- **Màu sắc:** đổi trong khối `:root` của `css/pages.css`.
- **Địa chỉ Backend, key token:** vẫn cấu hình trong `js/config.js`.

---

## 🚧 Giới hạn hiện tại

- Chưa có trang lịch sử giao dịch (xem danh sách, sửa, xóa).
- Báo cáo tổng hợp ở trình duyệt, phù hợp dữ liệu vừa và nhỏ. Dữ liệu lớn nên chuyển sang endpoint tổng hợp ở Backend.
- Chưa có quản lý ví / danh mục, ngân sách và xuất báo cáo.
