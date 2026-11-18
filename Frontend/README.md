# Giao diện SmartMoney

Chạy `npm run demo` từ thư mục gốc và mở địa chỉ hiển thị trong PowerShell. NestJS phục vụ cả giao diện và API ở cùng địa chỉ. Hướng dẫn và thông tin tài khoản mẫu nằm trong [README dự án](../README.md).

- `index.html` là Tổng quan với ba biểu đồ và giao dịch gần đây.
- `login.html` dùng cho đăng nhập và đăng ký.
- `transactions.html` dùng để tra cứu, tạo, sửa, xóa và xuất giao dịch.
- `reports.html` phân tích thu chi và tải Excel theo kỳ.
- `manage.html` có Ngân sách, Danh mục, Ví, Sổ nợ và Thông báo.

Giao diện dùng HTML, CSS và JavaScript trong repo. Nếu phục vụ frontend riêng bằng Live Server, cấu hình địa chỉ NestJS trong `js/config.js`.
