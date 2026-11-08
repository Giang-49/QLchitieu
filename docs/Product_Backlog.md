# PRODUCT BACKLOG & PHÂN LOẠI THEME / EPIC
## DỰ ÁN: QUẢN LÝ CHI TIÊU CÁ NHÂN (QLchitieu)

> **Tham chiếu Google Sheet:** `N4_QLchitieu` (Sheet: *product backlog* & *theme*)  
> **Theme chính:** Quản lý chi tiêu cá nhân  
> **Tổng số Epic:** 05 Epics  
> **Tổng số User Stories:** 17 User Stories (Phân bổ trong 3 Sprint: P1, P2, P3)

---

## 1. Cấu trúc Cây Phân cấp: Theme -> Epics -> User Stories

```mermaid
mindmap
  root((Theme: Quản lý chi tiêu cá nhân))
    Epic 01: Quản lý giao dịch thu chi
      US1.1: Thêm mới giao dịch [P1]
      US1.2: Cập nhật giao dịch [P1]
      US1.3: Xóa giao dịch & Hoàn tiền ví [P1]
      US1.4: Xem & Lọc theo danh mục [P1]
    Epic 02: Quản lý hạn mức ngân sách
      US2.1: Cài đặt hạn mức ngân sách tháng [P1]
      US2.2: Hiển thị tiến độ sử dụng ngân sách [P2]
      US2.3: Cảnh báo khi vượt ngưỡng ngân sách [P1]
    Epic 03: Báo cáo thống kê chi tiêu
      US3.1: Biểu đồ tròn phân bổ chi tiêu [P2]
      US3.2: Biểu đồ cột so sánh Thu vs Chi [P2]
      US3.3: Xuất dữ liệu báo cáo ra Excel/CSV [P3]
    Epic 04: Quản lý danh mục thu chi
      US4.1: Tạo danh mục thu/chi [P1]
      US4.2: Ẩn danh mục & bảo lưu dữ liệu [P1]
      US4.3: Quản lý danh mục cha - con [P2]
    Epic 05: Quản lý hồ sơ vay (Sổ nợ)
      US5.1: Ghi nhận khoản nợ mới (Vay/Cho vay) [P1]
      US5.2: Cập nhật trả nợ [P1]
      US5.3: Xem danh sách sổ nợ theo trạng thái [P1]
      US5.4: Thông báo nhắc hẹn trả/thu hồi nợ [P3]
```

---

## 2. Danh mục Epics (Big User Stories)

| Mã Epic | Tên Epic | Mô tả nghiệp vụ | Big User Story |
| :--- | :--- | :--- | :--- |
| **Epic 01** | **Quản lý giao dịch thu chi** | Ghi nhận giao dịch thu chi mới: Thêm mới các khoản thu nhập và chi tiêu kèm thông tin số tiền, danh mục, nguồn tiền, ghi chú, hóa đơn để theo dõi dòng tiền chính xác. | *Là một người dùng, tôi muốn ghi nhận nhanh chóng các khoản thu - chi phát sinh hàng ngày để quản lý dòng tiền cá nhân một cách chặt chẽ và chính xác.* |
| **Epic 02** | **Quản lý hạn mức ngân sách** | Thiết lập và quản lý ngân sách: Đặt hạn mức chi tiêu cho từng danh mục và nhận cảnh báo khi sắp vượt mức để kiểm soát bội chi. | *Là một người dùng, tôi muốn thiết lập hạn mức ngân sách chi tiêu theo từng danh mục để kiểm soát tài chính và hạn chế việc chi tiêu quá mức.* |
| **Epic 03** | **Báo cáo thống kê chi tiêu** | Phân tích và trực quan hóa chi tiêu: Xem biểu đồ cơ cấu, đối soát thu chi qua các tháng và xuất báo cáo dữ liệu. | *Là một người dùng, tôi muốn xem các báo cáo trực quan về tình hình tài chính của mình để đánh giá thói quen tiêu dùng và khả năng tiết kiệm.* |
| **Epic 04** | **Quản lý danh mục thu chi** | Phân loại và cấu trúc nguồn chi tiêu: Tạo, sửa, phân cấp cha - con và bảo toàn dữ liệu khi danh mục không còn sử dụng. | *Là một người dùng, tôi muốn tùy biến hệ thống danh mục thu chi theo nhu cầu cá nhân để phân loại các khoản tiền một cách khoa học.* |
| **Epic 05** | **Quản lý hồ sơ vay (Sổ nợ)** | Theo dõi công nợ hai chiều (Vay & Cho vay): Quản lý người liên quan, số nợ còn lại, ngày đáo hạn và lịch sử trả nợ. | *Là một người dùng, tôi muốn theo dõi rõ ràng các khoản nợ đi vay và cho vay để không bị quên nợ và quản lý dòng tiền hoàn trả đúng hạn.* |

---

## 3. Bảng Chi tiết Product Backlog (17 User Stories)

| Epic | Mã US | Câu User Story (As a... I want to... So that...) | Tóm tắt tính năng | Sprint phân bổ |
| :--- | :--- | :--- | :--- | :---: |
| **Epic 01: Quản lý giao dịch thu chi** | **US1.1** | Là người dùng, tôi muốn thêm mới giao dịch thu/chi (số tiền, loại, danh mục, ví, ghi chú, ảnh hóa đơn) để ghi nhận biến động số dư chính xác. | Thêm giao dịch mới | **Sprint 1 (P1)** |
| | **US1.2** | Là người dùng, tôi muốn cập nhật thông tin giao dịch để sửa sai sót. | Sửa giao dịch | **Sprint 1 (P1)** |
| | **US1.3** | Là người dùng, tôi muốn xóa giao dịch và hệ thống tự động hoàn lại số dư ví để duy trì số dư thực tế. | Xóa giao dịch | **Sprint 1 (P1)** |
| | **US1.4** | Là người dùng, tôi muốn xem danh sách giao dịch theo danh mục để có thể nhanh chóng tra cứu và kiểm tra lịch sử chi tiêu. | Xem theo danh mục | **Sprint 1 (P1)** |
| **Epic 02: Quản lý hạn mức ngân sách** | **US2.1** | Là một người dùng, tôi muốn thiết lập hạn mức ngân sách chi tiêu cho từng danh mục để không bị chi tiêu quá tay trong tháng. | Cài đặt hạn mức ngân sách tháng | **Sprint 1 (P1)** |
| | **US2.2** | Là một người dùng, tôi muốn theo dõi thanh tiến độ sử dụng ngân sách để biết được tỷ lệ phần trăm hạn mức đã tiêu dùng. | Hiển thị tiến độ sử dụng ngân sách | **Sprint 2 (P2)** |
| | **US2.3** | Là một người dùng, tôi muốn nhận thông báo cảnh báo khi chi tiêu sắp chạm ngưỡng hạn mức để kịp thời điều chỉnh kế hoạch chi tiêu. | Cảnh báo khi vượt ngưỡng ngân sách | **Sprint 1 (P1)** |
| **Epic 03: Báo cáo thống kê chi tiêu** | **US3.1** | Là một người dùng, tôi muốn xem biểu đồ tròn phân tích cơ cấu chi tiêu để có thể biết nhóm chi phí nào đang chiếm tỷ trọng lớn nhất. | Biểu đồ tròn phân bổ chi tiêu | **Sprint 2 (P2)** |
| | **US3.2** | Là một người dùng, tôi muốn xem biểu đồ so sánh tổng thu và tổng chi qua các tháng để đánh giá được khả năng tiết kiệm ròng. | Biểu đồ cột so sánh Thu vs Chi | **Sprint 2 (P2)** |
| | **US3.3** | Là một người dùng, tôi muốn xuất báo cáo danh sách giao dịch ra file Excel để thuận tiện lưu trữ hoặc phân tích chuyên sâu trên máy tính. | Xuất dữ liệu báo cáo ra Excel/CSV | **Sprint 3 (P3)** |
| **Epic 04: Quản lý danh mục thu chi** | **US4.1** | Là một người dùng, tôi muốn tạo mới danh mục thu/chi (tên, biểu tượng, loại thu/chi) để cá nhân hóa việc phân loại giao dịch. | Tạo danh mục thu/chi | **Sprint 1 (P1)** |
| | **US4.2** | Là một người dùng, tôi muốn xóa mục không dùng nữa kèm lựa chọn chuyển giao dịch cũ sang danh mục khác để bảo toàn lịch sử thu chi. | Ẩn danh mục & bảo lưu dữ liệu | **Sprint 1 (P1)** |
| | **US4.3** | Là một người dùng, tôi muốn tạo các danh mục con trực thuộc danh mục cha để quản lý chi tiêu chi tiết theo từng nhóm nhỏ. | Quản lý danh mục cha - con | **Sprint 2 (P2)** |
| **Epic 05: Quản lý hồ sơ vay** | **US5.1** | Là một người dùng, tôi muốn tạo khoản nợ mới (cho vay hoặc đi vay) gồm số tiền, người vay/cho vay, ngày hẹn trả để theo dõi công nợ rõ ràng. | Ghi nhận khoản nợ mới (Vay/Cho vay) | **Sprint 1 (P1)** |
| | **US5.2** | Là một người dùng, tôi muốn ghi nhận trả nợ từng phần hoặc tất toán để hệ thống cập nhật số dư nợ còn lại. | Cập nhật trả nợ | **Sprint 1 (P1)** |
| | **US5.3** | Là một người dùng, tôi muốn xem danh sách các khoản nợ được phân loại rõ ràng (chưa thanh toán, đã hoàn tất, quá hạn) để kiểm soát tổng nợ nhanh chóng. | Xem danh sách sổ nợ theo trạng thái | **Sprint 1 (P1)** |
| | **US5.4** | Là một người dùng, tôi muốn nhận thông báo nhắc nhở khi đến ngày hẹn trả/đòi nợ để tránh việc trễ hạn hoặc quên đối soát công nợ. | Thông báo nhắc hẹn trả/thu hồi nợ | **Sprint 3 (P3)** |
