# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN (QLchitieu)

> **Mã dự án:** N4_QLchitieu  
> **Phiên bản:** 1.0  
> **Tiêu chuẩn áp dụng:** IEEE Std 830-1998  
> **Trạng thái:** Đã phê duyệt  
> **Ngày cập nhật:** 2026-11-08

---

## 1. Giới thiệu (Introduction)

### 1.1. Mục đích
Tài liệu này mô tả đầy đủ và chi tiết các yêu cầu chức năng, phi chức năng của phần mềm **Quản lý Chi tiêu Cá nhân (QLchitieu)**. Tài liệu đóng vai trò là cơ sở thống nhất giữa các bên liên quan (**Business Analyst, Developer, Tester, Stakeholder**) để thiết kế, phát triển, kiểm thử và nghiệm thu hệ thống.

### 1.2. Phạm vi sản phẩm (Product Scope)
Phần mềm hỗ trợ người dùng cá nhân thực hiện các hoạt động:
- Ghi nhận và quản lý các giao dịch thu – chi hàng ngày.
- Phân loại giao dịch theo danh mục và ví nguồn tiền.
- Thiết lập hạn mức ngân sách và nhận cảnh báo khi chi tiêu tiệm cận hoặc vượt ngưỡng.
- Xem báo cáo thống kê chi tiêu trực quan dưới dạng biểu đồ cơ cấu và xu hướng.
- Quản lý các khoản vay/nợ (Sổ nợ) và theo dõi tiến độ hoàn trả.
- Xuất dữ liệu báo cáo ra file Excel (.xlsx).

**Nằm ngoài phạm vi (Out of Scope):**
- Quản lý nhiều người dùng dùng chung / phân quyền nhóm phức tạp (ở phiên bản MVP).
- Tích hợp Open Banking / kết nối trực tiếp với API của các ngân hàng thương mại.
- Các tính năng đầu tư tài chính, chứng khoán, crypto, hoặc quản lý mục tiêu tiết kiệm đa tầng.

### 1.3. Đối tượng sử dụng (Intended Audience)

| Đối tượng | Mục đích sử dụng |
| :--- | :--- |
| **Người dùng cuối (End-user)** | Cá nhân muốn theo dõi và kiểm soát chi tiêu, duy trì kỷ luật tài chính hàng ngày. |
| **BA / Scrum Master** | Phân tích yêu cầu, quản lý Product Backlog, lập kế hoạch Sprint và nghiệm thu. |
| **Developer (FE/BE)** | Căn cứ để xây dựng kiến trúc cơ sở dữ liệu, API backend và giao diện người dùng. |
| **Tester / QA** | Căn cứ viết kịch bản kiểm thử (Test Scenarios), bộ Test Cases và kiểm tra sự phù hợp. |

### 1.4. Tài liệu tham khảo (References)
1. Product Backlog – Google Sheet (`N4_QLchitieu`).
2. User Story Map dự án Quản lý chi tiêu.
3. Bộ Kịch bản kiểm thử (Test Scenarios) của dự án.
4. IEEE Std 830-1998: *IEEE Recommended Practice for Software Requirements Specifications*.

---

## 2. Tổng quan / Yêu cầu cấp cao (High-Level Requirements)

### 2.1. Mục tiêu kinh doanh (Business Goals)
Giúp người dùng cá nhân quản lý dòng tiền hiệu quả, kiểm soát chi tiêu theo hạn mức, theo dõi công nợ chặt chẽ và có cái nhìn tổng quan về tình hình tài chính cá nhân thông qua các báo cáo trực quan.

### 2.2. Giả định (Assumptions)
- Người dùng có kết nối Internet ổn định khi sử dụng phần mềm.
- Người dùng sử dụng các trình duyệt hiện đại (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge).
- Mỗi tài khoản chỉ thuộc về một cá nhân sở hữu (không chia sẻ quyền chỉnh sửa đồng thời).
- Dữ liệu giao dịch ban đầu do người dùng tự chủ động nhập (chưa tự động quét từ SMS hay Banking).

### 2.3. Ràng buộc (Constraints)
- **Giao diện:** Thiết kế ưu tiên chuẩn **Mobile-first** (giao diện co giãn responsive mượt mà).
- **Backend:** Xây dựng theo kiến trúc REST API chuẩn mực, phân tách rõ tầng controller, service, repository.
- **Cơ sở dữ liệu:** Hệ quản trị CSDL quan hệ (RDBMS) như MySQL hoặc PostgreSQL.
- **Phương pháp phát triển:** Agile / Scrum theo các Sprint ngắn hạn.
- **Giao dịch:** Không tích hợp cổng thanh toán tiền tệ thực tế trong phiên bản đầu (chỉ đóng vai trò ghi chép sổ sách).

---

## 3. Yêu cầu chức năng (Functional Requirements – FR)

### 3.1. Epic 01 – Quản lý giao dịch thu chi
- **FR-01.1: Thêm mới giao dịch**
  - Hệ thống cho phép người dùng thêm giao dịch thu hoặc chi.
  - Các thông tin cần nhập: Loại giao dịch (Thu/Chi), Số tiền (> 0), Danh mục, Ví nguồn, Ghi chú (tùy chọn), Ảnh hóa đơn (tùy chọn), Thời gian giao dịch.
  - Sau khi lưu thành công, hệ thống tự động cập nhật số dư của ví tương ứng và hiển thị thông báo thành công.
- **FR-01.2: Cập nhật giao dịch**
  - Người dùng có thể sửa toàn bộ thông tin của giao dịch đã tạo.
  - Hệ thống tự động tính toán lại mức chênh lệch số tiền và điều chỉnh số dư ví nguồn về đúng trạng thái thực tế.
- **FR-01.3: Xóa giao dịch**
  - Cho phép xóa giao dịch kèm theo hộp thoại xác nhận (Confirmation Modal).
  - Khi xác nhận xóa, hệ thống tự động hoàn lại số dư ví tương ứng.
  - Cho phép người dùng hủy thao tác xóa nếu muốn giữ lại.
- **FR-01.4: Xem, lọc và tìm kiếm giao dịch**
  - Hiển thị danh sách giao dịch dưới dạng dòng thời gian (Timeline), bản ghi mới nhất xếp lên đầu.
  - Hỗ trợ bộ lọc linh hoạt: Theo danh mục, khoảng thời gian (từ ngày - đến ngày), loại giao dịch, theo ví.
  - Hỗ trợ tìm kiếm theo từ khóa ghi chú.
  - Áp dụng phân trang (Pagination) hoặc tải vô hạn (Infinite Scroll) khi dữ liệu lớn.

### 3.2. Epic 02 – Quản lý hạn mức ngân sách
- **FR-02.1: Thiết lập hạn mức ngân sách**
  - Cho phép đặt hạn mức chi tiêu tối đa theo từng danh mục cụ thể trong phạm vi một tháng dương lịch.
  - Số tiền hạn mức thiết lập bắt buộc phải lớn hơn 0.
- **FR-02.2: Theo dõi tiến độ sử dụng ngân sách**
  - Hiển thị thanh tiến độ trực quan (Progress Bar) phản ánh tỷ lệ phần trăm ngân sách đã sử dụng.
  - Màu sắc tự động thay đổi theo các mốc:
    - `< 70%`: Xanh lá (An toàn).
    - `70% – 99%`: Vàng cam (Cảnh báo).
    - `≥ 100%`: Đỏ (Vượt ngưỡng / Bội chi).
- **FR-02.3: Cảnh báo khi vượt ngưỡng**
  - Hệ thống tự động gửi cảnh báo khi chi tiêu trong danh mục đạt ngưỡng **80%** và **100%** của hạn mức đã đặt.
  - Phương thức hiển thị: Thông báo nổi bật trên giao diện (In-app Alert) và Push Notification (nếu thiết bị hỗ trợ).

### 3.3. Epic 03 – Báo cáo thống kê chi tiêu
- **FR-03.1: Biểu đồ tròn cơ cấu chi tiêu**
  - Thể hiện tỷ trọng (%) chi tiêu giữa các danh mục khác nhau trong khoảng thời gian người dùng tùy chọn (Tuần này, Tháng này, Năm nay, Tùy chỉnh).
  - Có cơ chế xử lý màn hình trống (Empty state) khi chưa phát sinh chi tiêu trong kỳ.
- **FR-03.2: Biểu đồ so sánh Thu vs Chi**
  - Hiển thị biểu đồ cột so sánh tương quan giữa tổng số tiền thu vào và tổng số tiền chi ra theo từng tháng trong năm.
  - Tích hợp Tooltip tương tác hiển thị chi tiết số tiền khi rê chuột (hover) hoặc chạm (click).
- **FR-03.3: Xuất báo cáo Excel**
  - Cho phép trích xuất toàn bộ hoặc danh sách giao dịch đã lọc ra tệp tin định dạng `.xlsx`.
  - Cấu trúc các cột xuất: Ngày giao dịch, Phân loại (Thu/Chi), Tên danh mục, Số tiền, Ví thanh toán, Ghi chú.

### 3.4. Epic 04 – Quản lý danh mục thu chi
- **FR-04.1: Tạo / Sửa danh mục**
  - Hỗ trợ tạo mới và chỉnh sửa danh mục chi tiêu/thu nhập với các trường: Tên danh mục, Biểu tượng (Icon), Phân loại (Thu/Chi), Mã màu hiển thị (Color code).
- **FR-04.2: Xóa / Ẩn danh mục**
  - Cho phép người dùng xóa hoặc ẩn danh mục không còn sử dụng.
  - Cơ chế bảo toàn dữ liệu: Nếu danh mục đã có giao dịch phát sinh, hệ thống yêu cầu người dùng chuyển toàn bộ giao dịch sang một danh mục khác trước khi hoàn tất xóa vĩnh viễn.
- **FR-04.3: Quản lý danh mục cha – con**
  - Cho phép thiết lập cây danh mục đa cấp: Danh mục con trực thuộc danh mục cha (Ví dụ: Danh mục cha `Ăn uống` chứa các danh mục con `Ăn trưa`, `Cà phê`, `Đi chợ`).

### 3.5. Epic 05 – Quản lý hồ sơ vay (Sổ nợ)
- **FR-05.1: Tạo khoản nợ mới**
  - Ghi nhận khoản nợ với 2 loại hình:
    - **Đi vay (Borrow):** Nhận tiền vay từ người khác -> Số dư ví được cộng thêm.
    - **Cho vay (Lend):** Chuyển tiền cho người khác vay -> Số dư ví bị trừ đi.
  - Thông tin yêu cầu: Số tiền, Người liên quan (Tên đối tác), Ngày hẹn thanh toán, Ví thực hiện, Ghi chú.
- **FR-05.2: Ghi nhận trả nợ**
  - Hỗ trợ trả nợ từng phần hoặc thanh toán tất toán toàn bộ khoản nợ.
  - Hệ thống tự động cập nhật số dư còn lại của khoản nợ và điều chỉnh lại số dư ví nguồn tương ứng.
  - Nghiệp vụ: Chặn không cho phép số tiền thanh toán lớn hơn số nợ còn lại.
- **FR-05.3: Xem danh sách sổ nợ theo trạng thái**
  - Phân loại trực quan danh sách các khoản vay/cho vay theo các tab trạng thái:
    - *Chưa thanh toán (Unpaid)*
    - *Đã hoàn tất (Completed)*
    - *Quá hạn (Overdue)*
- **FR-05.4: Thông báo nhắc hẹn trả/đòi nợ**
  - Tự động kích hoạt thông báo nhắc nhở khi đến ngày hoặc cận ngày hẹn thanh toán nợ.

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements – NFR)

| Mã NFR | Phân loại | Tiêu chuẩn chất lượng chi tiết |
| :--- | :--- | :--- |
| **NFR-01** | **Hiệu năng (Performance)** | - Thời gian phản hồi và tải danh sách giao dịch ≤ 2.0 giây với tập dữ liệu 1.000 bản ghi.<br/>- Tối ưu truy vấn CSDL với chỉ mục (indexes) trên `user_id`, `date`, `category_id`. |
| **NFR-02** | **Độ sẵn sàng (Availability)** | - Hệ thống đảm bảo mức độ khả dụng (Uptime) đạt tối thiểu ≥ 99% trong giờ hoạt động bình thường. |
| **NFR-03** | **Bảo mật (Security)** | - Mật khẩu người dùng được băm an toàn bằng thuật toán hiện đại (Bcrypt / Argon2).<br/>- Toàn bộ lưu lượng truyền tải qua HTTPS với chứng chỉ SSL/TLS.<br/>- Kiểm soát phân quyền dữ liệu nghiêm ngặt: Mỗi người dùng chỉ được xem và sửa đổi dữ liệu do chính mình tạo ra. |
| **NFR-04** | **Giao diện (UI/UX)** | - Giao diện thiết kế theo phương châm Mobile-First Responsive, hiển thị mượt mà từ màn hình điện thoại (375px) đến máy tính bảng và desktop.<br/>- Hỗ trợ chế độ nền sáng / tối (Light/Dark Mode). |
| **NFR-05** | **Tương thích (Compatibility)** | - Hoạt động đồng nhất trên các trình duyệt chuẩn web mới nhất: Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge. |
| **NFR-06** | **Khả năng mở rộng (Scalability)** | - Kiến trúc phần mềm và mô hình dữ liệu cho phép mở rộng linh hoạt trong tương lai: Hỗ trợ nhiều loại ví, đa tiền tệ (VND, USD, EUR), nhóm chi tiêu gia đình. |
| **NFR-07** | **Khả năng sử dụng (Usability)** | - Thiết kế giao diện trực quan, rõ ràng, thao tác nhập giao dịch nhanh chóng dưới 10 giây; người dùng mới có thể làm quen sử dụng hệ thống thành thạo trong vòng dưới 15 phút. |

---

## 5. Đặc tả Use Case (Use Case Specification)

### 5.1. UC-01: Thêm mới giao dịch thu/chi
- **Use Case ID:** UC-01
- **Tác nhân:** Người dùng (User)
- **Mô tả:** Người dùng ghi nhận một khoản thu hoặc chi tiêu mới vào hệ thống.
- **Điều kiện tiên quyết:** Người dùng đã đăng nhập thành công; đã có ít nhất một Ví và một Danh mục tương ứng.
- **Hậu điều kiện:** Giao dịch mới được lưu trữ; số dư ví nguồn được cập nhật chính xác.
- **Luồng sự kiện chính (Main Flow):**
  1. Người dùng mở màn hình / hộp thoại “Thêm giao dịch”.
  2. Người dùng nhập thông tin: Loại giao dịch (Thu/Chi), Số tiền, Danh mục, Ví nguồn, Thời gian, Ghi chú, tải ảnh hóa đơn (nếu có).
  3. Người dùng nhấn nút “Lưu”.
  4. Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào.
  5. Hệ thống ghi nhận giao dịch vào CSDL và tự động tính toán lại số dư của Ví nguồn:
     - Nếu Thu: `Số dư mới = Số dư cũ + Số tiền`.
     - Nếu Chi: `Số dư mới = Số dư cũ - Số tiền`.
  6. Hệ thống hiển thị thông báo “Thêm giao dịch thành công” và cập nhật giao diện Dashboard.
- **Luồng phụ / Ngoại lệ (Exceptions):**
  - *Ngoại lệ 1:* Số tiền để trống, không phải số hoặc ≤ 0 -> Hệ thống hiển thị lỗi: *“Vui lòng nhập số tiền hợp lệ lớn hơn 0”*.
  - *Ngoại lệ 2:* Chưa chọn danh mục hoặc ví nguồn -> Hệ thống hiển thị thông báo lỗi yêu cầu chọn đầy đủ.

### 5.2. UC-02: Cập nhật thông tin giao dịch
- **Use Case ID:** UC-02
- **Tác nhân:** Người dùng (User)
- **Mô tả:** Người dùng sửa đổi thông tin của một giao dịch đã lưu trong quá khứ.
- **Điều kiện tiên quyết:** Giao dịch đã tồn tại trong tài khoản người dùng.
- **Hậu điều kiện:** Thông tin giao dịch được cập nhật; số dư ví cũ và mới được cân đối chính xác.
- **Luồng sự kiện chính (Main Flow):**
  1. Người dùng chọn giao dịch cần chỉnh sửa từ màn hình Lịch sử giao dịch.
  2. Người dùng sửa đổi các thông tin (ví dụ: đổi số tiền, đổi ví nguồn, đổi danh mục).
  3. Người dùng nhấn nút “Lưu thay đổi”.
  4. Hệ thống tính toán độ chênh lệch số tiền hoặc hoàn tiền ví cũ và áp dụng số tiền vào ví mới (nếu thay đổi ví).
  5. Hệ thống lưu thay đổi vào CSDL và cập nhật số dư ví liên quan.
  6. Hiển thị thông báo cập nhật thành công.
- **Luồng phụ / Ngoại lệ:**
  - Nhập số tiền mới ≤ 0 -> Hệ thống thông báo lỗi và yêu cầu nhập lại.

### 5.3. UC-03: Xóa giao dịch
- **Use Case ID:** UC-03
- **Tác nhân:** Người dùng (User)
- **Mô tả:** Người dùng loại bỏ một giao dịch sai khỏi hệ thống.
- **Điều kiện tiên quyết:** Giao dịch tồn tại.
- **Hậu điều kiện:** Bản ghi giao dịch bị xóa; số tiền trong ví được hoàn trả về trạng thái trước khi có giao dịch.
- **Luồng sự kiện chính (Main Flow):**
  1. Người dùng chọn thao tác “Xóa giao dịch”.
  2. Hệ thống hiển thị hộp thoại xác nhận: *“Bạn có chắc chắn muốn xóa giao dịch này không? Số dư ví sẽ được điều chỉnh lại.”*
  3. Người dùng chọn “Xác nhận”.
  4. Hệ thống hoàn lại số dư ví (nếu là giao dịch Chi thì cộng lại tiền; nếu là Thu thì trừ đi).
  5. Hệ thống xóa bản ghi giao dịch khỏi CSDL và thông báo thành công.
- **Luồng phụ:**
  - Tại bước 3, người dùng chọn “Hủy bỏ” -> Đóng hộp thoại, không có thay đổi nào được thực hiện.

### 5.4. UC-04: Thiết lập hạn mức ngân sách
- **Use Case ID:** UC-04
- **Tác nhân:** Người dùng (User)
- **Mô tả:** Người dùng cài đặt mức chi tối đa cho một danh mục trong tháng.
- **Điều kiện tiên quyết:** Đã có danh mục chi tiêu tồn tại.
- **Hậu điều kiện:** Hạn mức ngân sách được ghi nhận và áp dụng theo dõi cho tháng đã chọn.
- **Luồng sự kiện chính (Main Flow):**
  1. Người dùng truy cập màn hình “Cài đặt ngân sách”.
  2. Chọn Danh mục chi tiêu, chọn Tháng/Năm áp dụng, nhập Số tiền hạn mức.
  3. Nhấn nút “Lưu ngân sách”.
  4. Hệ thống kiểm tra số tiền > 0.
  5. Hệ thống lưu hoặc cập nhật bản ghi ngân sách trong CSDL và phản hồi thành công.
- **Luồng phụ:**
  - Nhập số tiền hạn mức ≤ 0 -> Hệ thống báo lỗi: *“Hạn mức ngân sách phải lớn hơn 0”*.

### 5.5. UC-05: Tạo khoản nợ mới (Sổ nợ)
- **Use Case ID:** UC-05
- **Tác nhân:** Người dùng (User)
- **Mô tả:** Ghi nhận một khoản nợ mới (Đi vay hoặc Cho vay).
- **Điều kiện tiên quyết:** Người dùng đã có ít nhất một Ví thanh toán.
- **Hậu điều kiện:** Khoản nợ được tạo lập với trạng thái `unpaid`; số dư ví nguồn biến động theo tính chất vay/cho vay.
- **Luồng sự kiện chính (Main Flow):**
  1. Người dùng mở màn hình Sổ nợ và nhấn “Tạo khoản nợ mới”.
  2. Chọn Loại hình: **Đi vay** (Borrow) hoặc **Cho vay** (Lend).
  3. Nhập: Số tiền, Tên người liên quan, Hạn trả (Due date), Ví tác động, Ghi chú.
  4. Nhấn “Lưu”.
  5. Hệ thống kiểm tra các trường thông tin bắt buộc.
  6. Hệ thống lưu bản ghi khoản nợ, khởi tạo `remaining = amount`, và cập nhật số dư ví:
     - Nếu Đi vay: Số dư ví tăng lên.
     - Nếu Cho vay: Số dư ví giảm đi.
  7. Hiển thị thông báo tạo khoản nợ thành công.
- **Luồng phụ:**
  - Bỏ trống các thông tin bắt buộc (Số tiền, Người liên quan, Ví) -> Hệ thống báo lỗi: *“Vui lòng điền đầy đủ các thông tin bắt buộc”*.

---

## 6. Yêu cầu giao diện & Cấu trúc Dữ liệu

### 6.1. Yêu cầu giao diện người dùng (UI/UX)
- **Triết lý thiết kế:** Tối giản, thanh lịch, tập trung vào tính trực quan của số liệu và tốc độ thao tác.
- **Bảng màu chủ đạo (Color Palette):**
  - Màu thương hiệu chính: Xanh dương hoàng gia (`#1F4E79`).
  - Màu nền: Trắng (`#FFFFFF`) / Nền xám nhẹ (`#F8FAFC`).
  - Màu trạng thái: Xanh lá (`#22C55E` - Thu nhập/Ngân sách an toàn), Đỏ (`#EF4444` - Chi phí/Vượt ngân sách), Vàng cam (`#F59E0B` - Cảnh báo tiệm cận).
- **Màn hình chính:**
  1. **Dashboard:** Tổng quan số dư các ví, tổng thu/chi trong tháng, cảnh báo ngân sách nhanh.
  2. **Giao dịch (Transactions):** Danh sách dòng thời gian, bộ lọc tìm kiếm và nút bấm nổi bật (FAB) tạo giao dịch nhanh.
  3. **Ngân sách (Budgets):** Danh sách ngân sách theo danh mục với thanh tiến độ đổi màu trực quan.
  4. **Báo cáo (Analytics):** Biểu đồ cơ cấu tròn và biểu đồ cột so sánh Thu - Chi theo tháng.
  5. **Sổ nợ (Debts):** Quản lý danh sách các khoản vay, cho vay và lịch sử thanh toán nợ.
  6. **Cài đặt & Danh mục:** Quản lý ví tiền, phân cấp danh mục cha - con và cấu hình tài khoản.

### 6.2. Cấu trúc bảng dữ liệu (Database Tables)
Hệ thống bao gồm 7 bảng cốt lõi:
1. `users`: Lưu trữ thông tin tài khoản và chứng thực.
2. `wallets`: Danh sách ví tài chính (Tiền mặt, Tài khoản ngân hàng, Ví điện tử).
3. `categories`: Danh mục phân loại thu/chi (hỗ trợ phân cấp cha - con qua `parent_id`).
4. `transactions`: Chi tiết các giao dịch phát sinh.
5. `budgets`: Định mức hạn mức chi tiêu theo danh mục cho từng tháng.
6. `debts`: Quản lý các khoản nợ vay và cho vay.
7. `debt_payments`: Lịch sử các đợt thanh toán trả nợ cho từng khoản nợ.

---

## 7. Kế hoạch Tích hợp hệ thống (Integration)

### 7.1. Giai đoạn MVP (Hiện tại)
- Chưa tích hợp API bên thứ ba phức tạp.
- Sử dụng thư viện backend (như ExcelJS cho Node.js hoặc Apache POI cho Java) để xuất file Excel `.xlsx` trực tiếp từ dữ liệu hệ thống.
- Hỗ trợ Web Push Notification hoặc Firebase Cloud Messaging (FCM) cho thông báo nhắc hẹn nợ và cảnh báo ngân sách.

### 7.2. Tầm nhìn Tương lai (Future Roadmap)
- **Open Banking & Financial Data APIs:** Kết nối với các cổng API ngân hàng để đọc biến động số dư và tự động đồng bộ hóa giao dịch.
- **Social Login:** Tích hợp xác thực Single Sign-On (SSO) qua Google, Apple ID và Facebook (OAuth 2.0).
- **Cloud Storage:** Lưu trữ ảnh hóa đơn chứng từ trên các giải pháp đám mây chuyên dụng (AWS S3, Google Cloud Storage, Cloudinary).
- **AI Phân tích chi tiêu:** Trợ lý ảo gợi ý thói quen chi tiêu thông minh và dự báo chi tiêu tháng tiếp theo.
