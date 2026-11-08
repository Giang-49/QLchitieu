# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN (QLchitieu)

> **Mã dự án:** N4_QLchitieu  
> **Repository:** [https://github.com/Giang-49/QLchitieu](https://github.com/Giang-49/QLchitieu)  
> **Google Sheet tham chiếu:** [N4_QLchitieu Spreadsheet](https://docs.google.com/spreadsheets/d/1F6wNzzoMZXcfSOnE1PY7pOnpFfUA0xy1r9P4A_vtToU/edit?usp=sharing)  
> **Phiên bản:** 1.0 (MVP)  
> **Tiêu chuẩn áp dụng:** IEEE Std 830-1998 & Agile Scrum

---

## 1. Giới thiệu (Introduction)

### 1.1. Mục đích
Tài liệu này mô tả đầy đủ và chi tiết các yêu cầu chức năng, phi chức năng của phần mềm **Quản lý Chi tiêu Cá nhân (QLchitieu)**. Tài liệu đóng vai trò là cơ sở thống nhất giữa các bên liên quan (**Business Analyst / Scrum Master, Frontend Developer, Backend Developer, QA / Tester, Stakeholder**) để thiết kế, phát triển, kiểm thử và nghiệm thu hệ thống.

### 1.2. Phạm vi sản phẩm (Product Scope)
Phần mềm hỗ trợ người dùng cá nhân thực hiện các hoạt động:
- Ghi nhận và quản lý các giao dịch thu – chi hàng ngày (US1.1 – US1.4).
- Phân loại giao dịch theo danh mục đa cấp và ví nguồn tiền (US4.1 – US4.3).
- Thiết lập hạn mức ngân sách tháng và nhận cảnh báo khi vượt ngưỡng 80% và 100% (US2.1 – US2.3).
- Xem báo cáo thống kê chi tiêu trực quan dưới dạng biểu đồ tròn và cột (US3.1, US3.2).
- Quản lý các khoản vay/nợ (Sổ nợ), theo dõi lịch sử trả nợ và nhắc hẹn đáo hạn (US5.1 – US5.4).
- Xuất dữ liệu báo cáo ra file Excel .xlsx / .csv (US3.3).

**Nằm ngoài phạm vi (Out of Scope ở MVP):**
- Quản lý nhiều người dùng dùng chung / phân quyền nhóm phức tạp.
- Tích hợp Open Banking / kết nối API ngân hàng thực tế.
- Các tính năng đầu tư tài chính, chứng khoán, crypto, hoặc mục tiêu tiết kiệm đa tầng.

### 1.3. Đối tượng sử dụng (Intended Audience)

| Đối tượng | Vai trò & Trách nhiệm chính |
| :--- | :--- |
| **Người dùng cuối (End-user)** | Cá nhân muốn theo dõi và kiểm soát chi tiêu, duy trì kỷ luật tài chính hàng ngày. |
| **BA / Scrum Master** | Phân tích yêu cầu, quản lý Product Backlog, lập Sprint Plan (7 tuần) và nghiệm thu. |
| **Frontend Developer** | Thiết kế Wireframe, UI/UX Mobile-first, Dashboard, biểu đồ và form nhập liệu. |
| **Backend Developer** | Thiết kế CSDL (ERD), xây dựng hệ thống RESTful API, tối ưu query và logic rollback. |
| **QA / Tester** | Viết Acceptance Criteria, Test Cases và kịch bản BDD (Given - When - Then). |

### 1.4. Tài liệu tham khảo (References)
1. **Google Sheet N4_QLchitieu:** Bao gồm 7 sheets (*nhiệm vụ, product backlog, map, kịch bản, tiêu chí chấp nhận& kiểm thử, theme, sprint backlog*).
2. **User Story Map:** Phân loại MoSCoW (Must-Have, Should-Have, Nice-to-Have).
3. **Bộ Kịch bản kiểm thử BDD (Gherkin):** 17 bộ kịch bản chi tiết.
4. **IEEE Std 830-1998:** *IEEE Recommended Practice for Software Requirements Specifications*.

---

## 2. Tổng quan / Yêu cầu cấp cao (High-Level Requirements)

### 2.1. Mục tiêu kinh doanh
Giúp người dùng cá nhân quản lý dòng tiền hiệu quả, kiểm soát chi tiêu theo hạn mức, theo dõi công nợ chặt chẽ và có cái nhìn tổng quan về tình hình tài chính thông qua báo cáo trực quan.

### 2.2. Giả định (Assumptions)
- Người dùng có kết nối Internet ổn định khi sử dụng hệ thống.
- Người dùng sử dụng các trình duyệt hiện đại (Chrome, Safari, Firefox, Edge).
- Mỗi tài khoản thuộc về một cá nhân riêng biệt.
- Dữ liệu giao dịch ban đầu do người dùng tự chủ động nhập.

### 2.3. Ràng buộc (Constraints)
- Giao diện ưu tiên chuẩn **Mobile-first Responsive**.
- Backend sử dụng kiến trúc chuẩn **REST API**.
- Hệ quản trị cơ sở dữ liệu quan hệ **MySQL 8.0+** hoặc **PostgreSQL**.
- Quy trình phát triển theo mô hình **Agile/Scrum** (Sprint 1, Sprint 2, Sprint 3).

---

## 3. Yêu cầu chức năng (Functional Requirements – 17 User Stories)

### 3.1. Epic 01 – Quản lý giao dịch thu chi
- **US1.1: Thêm mới giao dịch [Sprint 1]**
  - Cho phép người dùng thêm mới giao dịch thu hoặc chi với: Số tiền (> 0), Loại (Thu/Chi), Danh mục, Ví nguồn, Ghi chú, Ảnh hóa đơn.
  - Tự động cộng/trừ số dư ví tương ứng và hiển thị thông báo thành công.
- **US1.2: Cập nhật thông tin giao dịch [Sprint 1]**
  - Cho phép người dùng chỉnh sửa thông tin giao dịch đã tạo.
  - Tự động hoàn lại số tiền cũ vào ví cũ và áp dụng số tiền/loại mới vào ví mới.
- **US1.3: Xóa giao dịch & Hoàn tiền ví [Sprint 1]**
  - Cho phép xóa giao dịch kèm popup cảnh báo xác nhận.
  - Hệ thống tự động tính toán hoàn lại số tiền vào ví (Cộng lại nếu xóa Chi, trừ bớt nếu xóa Thu).
- **US1.4: Xem & Lọc theo danh mục [Sprint 1]**
  - Cung cấp bộ lọc theo danh mục, hiển thị danh sách giao dịch mới nhất giảm dần.
  - Xử lý màn hình trống khi danh mục chưa phát sinh giao dịch.

### 3.2. Epic 02 – Quản lý hạn mức ngân sách
- **US2.1: Cài đặt hạn mức ngân sách tháng [Sprint 1]**
  - Cho phép đặt hạn mức chi tiêu tối đa theo danh mục trong một tháng (> 0).
  - Ràng buộc: Mỗi danh mục chỉ có 1 hạn mức duy nhất trong cùng một tháng.
- **US2.2: Hiển thị tiến độ sử dụng ngân sách [Sprint 2]**
  - Thanh tiến độ trực quan hiển thị %: $(\text{Tổng chi} / \text{Hạn mức}) \times 100\%$.
  - Đổi màu theo mốc: Xanh (< 70%), Vàng (70% - 99%), Đỏ ($\ge 100\%$).
- **US2.3: Cảnh báo khi vượt ngưỡng ngân sách [Sprint 1]**
  - Tự động gửi thông báo khi chi tiêu đạt **80%** (Cảnh báo vàng) và **100%** (Cảnh báo đỏ bội chi).
  - Tần suất: Mỗi ngưỡng cảnh báo chỉ gửi 1 lần duy nhất trong tháng.

### 3.3. Epic 03 – Báo cáo thống kê chi tiêu
- **US3.1: Biểu đồ tròn phân bổ chi tiêu [Sprint 2]**
  - Hiển thị tỷ trọng (%) chi tiêu giữa các danh mục theo bộ lọc Tuần/Tháng/Năm.
  - Tổng các phần tử biểu đồ luôn bằng 100%.
- **US3.2: Biểu đồ cột so sánh Thu vs Chi [Sprint 2]**
  - Biểu đồ cột đôi so sánh tổng thu và tổng chi qua các tháng trong năm.
  - Phản ánh chính xác khả năng tiết kiệm ròng.
- **US3.3: Xuất dữ liệu báo cáo ra Excel/CSV [Sprint 3]**
  - Cho phép xuất file `.xlsx` hoặc `.csv` danh sách giao dịch.
  - Đầy đủ tiêu đề cột (Ngày, Loại, Danh mục, Số tiền, Ví, Ghi chú), hỗ trợ tiếng Việt UTF-8.

### 3.4. Epic 04 – Quản lý danh mục thu chi
- **US4.1: Tạo mới danh mục thu/chi [Sprint 1]**
  - Nhập: Tên danh mục, Biểu tượng (Icon), Màu sắc, Phân loại (Thu/Chi).
- **US4.2: Ẩn danh mục & bảo lưu dữ liệu [Sprint 1]**
  - Khi xóa danh mục đang có giao dịch, bắt buộc hiện popup yêu cầu chọn 1 danh mục thay thế để chuyển dữ liệu sang nhằm bảo toàn lịch sử.
- **US4.3: Quản lý danh mục cha - con [Sprint 2]**
  - Hỗ trợ thiết lập cây phân cấp cha - con qua `parent_id`.
  - Khi xem báo cáo, tổng tiền của danh mục cha bao gồm cả tiền của các danh mục con.

### 3.5. Epic 05 – Quản lý hồ sơ vay (Sổ nợ)
- **US5.1: Ghi nhận khoản nợ mới (Vay/Cho vay) [Sprint 1]**
  - Ghi nhận: Số tiền, Tên người liên quan, Ngày hẹn trả, Ví thanh toán.
  - Tự động trừ tiền ví nếu Cho vay, cộng tiền ví nếu Đi vay.
- **US5.2: Cập nhật trả nợ [Sprint 1]**
  - Hỗ trợ trả từng phần hoặc tất toán: $\text{Dư nợ mới} = \text{Dư nợ cũ} - \text{Số tiền trả}$.
  - Chặn nhập số tiền trả vượt quá dư nợ còn lại. Đổi trạng thái sang "Đã hoàn tất" khi dư nợ = 0.
- **US5.3: Xem danh sách sổ nợ theo trạng thái [Sprint 1]**
  - Chia rõ 3 tab bộ lọc: *Chưa thanh toán*, *Quá hạn*, *Đã hoàn tất*.
  - Tự động chuyển các khoản nợ có Ngày hẹn trả < Ngày hiện tại vào tab Quá hạn và bôi đỏ.
- **US5.4: Thông báo nhắc hẹn trả/thu hồi nợ [Sprint 3]**
  - Hệ thống nền quét định kỳ mỗi ngày, gửi thông báo cho các khoản nợ đến hạn trong ngày hoặc quá hạn.
  - Bấm thông báo chuyển thẳng vào màn hình chi tiết khoản nợ.

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements – NFR)

| Mã NFR | Tiêu chí | Đặc tả kỹ thuật |
| :--- | :--- | :--- |
| **NFR-01** | **Hiệu năng** | Thời gian phản hồi và tải danh sách giao dịch $\le 2.0$ giây với tập dữ liệu 1.000 bản ghi. |
| **NFR-02** | **Độ sẵn sàng** | Hệ thống đảm bảo Uptime $\ge 99\%$ trong giờ hoạt động bình thường. |
| **NFR-03** | **Bảo mật** | Mật khẩu băm an toàn Bcrypt; toàn bộ API yêu cầu xác thực JWT qua HTTPS; cô lập dữ liệu người dùng tuyệt đối. |
| **NFR-04** | **Giao diện** | Chuẩn Mobile-First Responsive từ điện thoại (375px) đến Desktop. |
| **NFR-05** | **Tương thích** | Chạy tốt trên Chrome, Safari, Firefox, Edge phiên bản mới nhất. |
| **NFR-06** | **Khả năng mở rộng** | Sẵn sàng mở rộng Multi-wallet, Multi-currency và nhóm chi tiêu gia đình. |
| **NFR-07** | **Khả dụng** | Thao tác nhập giao dịch nhanh chóng dưới 10 giây; thời gian học sử dụng $< 15$ phút. |

---

## 5. Danh mục Tài liệu Kỹ thuật Liên kết

- 📅 [Kế hoạch phân công nhiệm vụ 7 tuần](./Ke_Hoach_Phan_Cong_Nhiem_Vu.md)
- 📋 [Product Backlog & Epics](./Product_Backlog.md)
- 🗺️ [Bản đồ User Story Map](./User_Story_Map.md)
- 🧪 [Kịch bản kiểm thử BDD / Gherkin](./Kich_Ban_Kiem_Thu_BDD.md)
- ✅ [Tiêu chí chấp nhận & Kiểm thử](./Tieu_Chi_Chap_Nhan_AC_Va_Test_Design.md)
- 🏃 [Sprint Backlog](./Sprint_Backlog.md)
- 🗄️ [Thiết kế Cơ sở Dữ liệu & Data Dictionary](./Thiet_Ke_CSDL.md)
- 🚀 [Đặc tả RESTful API & Kiến trúc](./Kien_Truc_Va_API.md)
