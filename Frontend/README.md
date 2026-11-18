# 🚀 Giao diện Frontend QLchitieu (Đăng nhập & Xác thực)

Giao diện Web Client hoàn chỉnh cho hệ thống **QLchitieu - Quản lý Chi tiêu Cá nhân**, được thiết kế theo phong cách Fintech hiện đại, tương thích đa thiết bị (Mobile-first Responsive) và kết nối trực tiếp với Backend NestJS API qua chuẩn RESTful & JWT Authentication.

---

## 📁 Cấu trúc thư mục

```text
Frontend/
├── index.html           # Màn hình chính: Đăng nhập (Sign In) & Đăng ký (Sign Up)
├── dashboard.html       # Màn hình Tổng quan sau khi đăng nhập thành công
├── css/
│   ├── auth.css         # Styling cho trang Đăng nhập & Đăng ký
│   └── dashboard.css    # Styling cho trang Dashboard
├── js/
│   ├── config.js        # Cấu hình API Base URL (http://localhost:3000/api/v1)
│   ├── api.js           # Client API (fetch wrapper, JWT token, profile, wallets)
│   └── auth.js          # Logic form validation, chuyển tab, toggle pass, toast
└── Design, wireframe.fig# Bản vẽ thiết kế Figma / Wireframe gốc
```

---

## ⚡ Hướng dẫn chạy Frontend

Bạn có thể chạy Frontend bằng một trong các cách cực kỳ đơn giản sau:

### Cách 1: Mở trực tiếp bằng trình duyệt (Không cần cài thêm gì)
* Mở thư mục `c:\QLchitieu\Frontend\`
* Nhấp đúp chuột vào tệp [`index.html`](./index.html) để mở trực tiếp trong Google Chrome, Microsoft Edge hoặc trình duyệt bất kỳ.

### Cách 2: Chạy với VS Code Live Server
* Cài đặt extension **Live Server** trong VS Code.
* Chuột phải vào [`index.html`](./index.html) và chọn **Open with Live Server** (cổng mặc định `http://127.0.0.1:5500`).

---

## 🔌 Kết nối với Backend NestJS

1. **Khởi động Cơ sở dữ liệu:**
   ```bash
   cd c:\QLchitieu
   docker compose up -d
   ```

2. **Khởi động Backend:**
   ```bash
   cd c:\QLchitieu\backend
   npm run start:dev
   ```
   *(Backend sẽ lắng nghe tại `http://localhost:3000`)*

3. **Tính năng trên giao diện Đăng nhập:**
   * **Đèn tín hiệu kết nối:** Góc trên bên phải trang sẽ tự động ping Backend và hiển thị chấm xanh `Backend: Sẵn sàng` khi Backend đang chạy.
   * **Đăng ký tài khoản mới:** Điền Họ tên, Email, Mật khẩu (tối thiểu 6 ký tự). Backend sẽ tự khởi tạo sẵn Ví tiền mặt & Danh mục mẫu.
   * **Đăng nhập:** Nhận mã JWT Token và lưu vào `localStorage`.
   * **Nút điền nhanh:** Nút `⚡ Điền nhanh tài khoản mẫu` để test nhanh.
   * **Xác thực bảo vệ:** Trang `dashboard.html` kiểm tra token hợp lệ, nếu chưa đăng nhập sẽ tự động quay lại `index.html`.
