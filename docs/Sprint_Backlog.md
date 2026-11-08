# SPRINT BACKLOG CHI TIẾT
## HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN (QLchitieu)

> **Tham chiếu Google Sheet:** `N4_QLchitieu` (Sheet: *sprint backlog* & *theme*)  
> **Phương pháp quản lý:** Agile Scrum Framework  
> **Chu kỳ Sprint:** 2 tuần / Sprint

---

## 🏃 SPRINT 1: Thiết lập Luồng Giao Dịch Cốt Lõi (CRUD Giao dịch & Lịch sử)

### 1. Mục tiêu Sprint 1 (Sprint Goal)
> Xây dựng hoàn chỉnh kiến trúc cơ sở dữ liệu, các API cốt lõi và giao diện nhập liệu thu/chi, đảm bảo người dùng có thể thực hiện Thêm, Sửa, Xóa, Lọc giao dịch và tự động cập nhật số dư ví chính xác.

### 2. Danh sách User Stories trong Sprint 1
- **US1.1:** Thêm mới giao dịch thu/chi (Số tiền, loại, danh mục, ví, ghi chú, ảnh hóa đơn).
- **US1.2:** Cập nhật thông tin giao dịch để sửa sai sót.
- **US1.3:** Xóa giao dịch và tự động hoàn lại số dư ví.
- **US1.4:** Xem danh sách giao dịch theo danh mục.
- **US2.1:** Cài đặt hạn mức ngân sách tháng.
- **US2.3:** Cảnh báo khi vượt ngưỡng ngân sách.
- **US4.1:** Tạo danh mục thu/chi.
- **US4.2:** Ẩn danh mục & bảo lưu dữ liệu.
- **US5.1:** Ghi nhận khoản nợ mới (Vay/Cho vay).
- **US5.2:** Cập nhật trả nợ.
- **US5.3:** Xem danh sách sổ nợ theo trạng thái.

### 3. Phân rã Công việc Kỹ thuật (Sprint 1 Tasks Breakdown)

| Mã US | Tính năng / Câu chuyện | Phân rã công việc kỹ thuật (Technical Tasks) | Vai trò phụ trách | Ước tính (Giờ) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US1.1 & US1.2** | Nhập tiền, loại & danh mục | • Thiết kế DB bảng `transactions`, `categories`<br/>• Xây dựng API thêm mới giao dịch (`POST /transactions`)<br/>• Thiết kế giao diện bàn phím nhập tiền và chọn danh mục | Backend<br/>Frontend | 16h | To Do |
| **US1.3** | Chọn ví thanh toán | • Xây dựng Logic trừ/cộng tiền vào số dư ví tương ứng trong DB Transaction<br/>• Xây dựng UI dropdown chọn ví thanh toán nguồn | Backend<br/>Frontend | 8h | To Do |
| **US2.1 & US2.2** | Sửa giao dịch | • Xây dựng API cập nhật thông tin giao dịch và tự động điều chỉnh chênh lệch số dư ví (`PUT /transactions/:id`)<br/>• Thiết kế màn hình form chỉnh sửa giao dịch | Backend<br/>Frontend | 12h | To Do |
| **US3.1 & US3.2** | Xóa giao dịch & Hoàn tiền ví | • Xây dựng API xóa giao dịch kèm logic rollback số dư ví (`DELETE /transactions/:id`)<br/>• Thiết kế popup xác nhận xóa & thao tác vuốt xóa (Swipe to delete) | Backend<br/>Frontend | 10h | To Do |
| **US4.1 & US4.2** | Xem & Lọc danh sách giao dịch | • Xây dựng API lấy danh sách phân trang (Pagination) và query theo ngày/tháng<br/>• Thiết kế giao diện danh sách dòng thời gian nhóm theo ngày | Backend<br/>Frontend | 14h | To Do |
| **Sprint 1 Testing** | Đảm bảo chất lượng | • Viết Unit Test cho logic cộng trừ số dư ví khi giao dịch biến động<br/>• Test tích hợp API và kiểm thử giao diện người dùng | QA / Tester | 12h | To Do |

---

## 📊 SPRINT 2: Ngân Sách & Báo Cáo Thống Kê Trực Quan

### 1. Mục tiêu Sprint 2 (Sprint Goal)
> Cung cấp tính năng lập hạn mức ngân sách tháng để kiểm soát chi tiêu, hiển thị thanh tiến độ đổi màu và biểu đồ phân tích cơ cấu chi tiêu trực quan.  
> **Tổng Story Points:** 19 Story Points

### 2. Danh sách User Stories trong Sprint 2
- **US2.2:** Theo dõi thanh tiến độ sử dụng ngân sách.
- **US3.1:** Biểu đồ tròn phân tích cơ cấu chi tiêu.
- **US3.2:** Biểu đồ cột so sánh tổng Thu vs Chi qua các tháng.
- **US4.3:** Quản lý danh mục con trực thuộc danh mục cha.

### 3. Phân rã Công việc Kỹ thuật (Sprint 2 Tasks Breakdown)

| Mã US | Tính năng / Câu chuyện | Phân rã công việc kỹ thuật (Technical Tasks) | Vai trò phụ trách | Ước tính (Giờ) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US5.1 & US5.2** *(Budget)* | Thiết lập & Theo dõi ngân sách | • Thiết kế bảng `budgets` và API CRUD ngân sách theo tháng<br/>• Logic tính tổng chi trong tháng của danh mục để so sánh với ngân sách<br/>• Thiết kế UI thanh tiến độ đổi màu (Xanh / Vàng / Đỏ) theo % chi tiêu | Backend<br/>Frontend | 16h | To Do |
| **US5.3** *(Alert)* | Cảnh báo vượt ngân sách | • Xây dựng hệ thống trigger thông báo khi chi tiêu đạt mốc 80% và 100%<br/>• Hiển thị banner/toast cảnh báo trực tiếp trên giao diện | Backend<br/>Frontend | 8h | To Do |
| **US6.1** *(Charts)* | Biểu đồ tròn cơ cấu chi | • Xây dựng API tổng hợp % chi tiêu theo từng category trong tháng<br/>• Tích hợp thư viện Chart.js / ApexCharts vẽ biểu đồ tròn, click xem chi tiết | Backend<br/>Frontend | 14h | To Do |
| **US6.2** *(Comparison)* | Biểu đồ so sánh Thu - Chi | • Xây dựng API thống kê tổng Thu vs tổng Chi qua 6 tháng gần nhất<br/>• Vẽ biểu đồ cột đôi so sánh tương quan dòng tiền | Backend<br/>Frontend | 12h | To Do |
| **Sprint 2 Testing** | Đảm bảo chất lượng | • Kiểm thử độ chính xác của các công thức tính toán báo cáo tài chính<br/>• Kiểm thử Responsive trên đa kích thước thiết bị | QA / Tester | 10h | To Do |

---

## 🚀 SPRINT 3: Tự Động Hóa, Xuất Báo Cáo & Hoàn Thiện

### 1. Mục tiêu Sprint 3 (Sprint Goal)
> Bổ sung tính năng xuất dữ liệu báo cáo ra file Excel (.xlsx), kích hoạt hệ thống gửi thông báo nhắc hẹn công nợ định kỳ, kiểm thử UAT và tối ưu hiệu năng toàn diện.

### 2. Danh sách User Stories trong Sprint 3
- **US3.3:** Xuất báo cáo danh sách giao dịch ra file Excel/CSV.
- **US5.4:** Thông báo nhắc hẹn trả / thu hồi nợ đến hạn.

### 3. Phân rã Công việc Kỹ thuật (Sprint 3 Tasks Breakdown)

| Mã US | Tính năng / Câu chuyện | Phân rã công việc kỹ thuật (Technical Tasks) | Vai trò phụ trách | Ước tính (Giờ) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US3.3** | Xuất dữ liệu Excel/CSV | • Tích hợp thư viện ExcelJS / Apache POI sinh file `.xlsx`<br/>• Thiết kế định dạng cột, tiêu đề, mã font UTF-8 tiếng Việt<br/>• UI nút tải xuống kèm bộ lọc thời gian tương ứng | Backend<br/>Frontend | 12h | To Do |
| **US5.4** | Thông báo nhắc nợ | • Cấu hình Cron job / Background Worker quét nợ đến hạn hàng ngày<br/>• Gửi In-app Alert và Push Notification đến người dùng<br/>• Chuyển hướng người dùng vào chi tiết khoản nợ khi nhấp thông báo | Backend<br/>Frontend | 14h | To Do |
| **Sprint 3 Testing** | UAT & Release | • Kiểm thử chấp nhận người dùng (User Acceptance Testing)<br/>• Kiểm thử tải và tối ưu hóa câu truy vấn CSDL | QA / Toàn đội | 16h | To Do |
