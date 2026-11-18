# Giao dịch và báo cáo

Giao dịch có thể lọc theo tháng, loại, danh mục, ví hoặc ghi chú. Khi thêm, sửa hoặc xóa, NestJS lưu giao dịch và điều chỉnh số dư ví. Ảnh hóa đơn hỗ trợ JPG, PNG và WebP tối đa 5 MB. Giao dịch tạo mới hoặc cập nhật ảnh dùng `multipart/form-data` với trường `receipt`; nội dung giao dịch không có tệp vẫn gửi được bằng JSON.

API `GET /api/v1/transactions` trả `meta` cho phân trang. Tên bộ lọc thời gian là `from_date` và `to_date`, bao gồm cả ngày kết thúc. Nút Excel trên trang Giao dịch dùng cùng bộ lọc với bảng.

Trang Báo cáo lấy cơ cấu chi từ `/reports/category-pie` và thu chi theo tháng từ `/reports/income-vs-expense`. Chọn tuần, tháng hoặc năm để đổi kỳ của tổng thu, tổng chi và biểu đồ tròn. Biểu đồ cột và đường thể hiện xu hướng theo tháng. Có thể xem số liệu từng mốc bằng bàn phím hoặc chuột.

Xem [README dự án](../README.md) để chạy bản demo và kiểm tra API.
