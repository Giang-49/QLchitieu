# TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA) & THIẾT KẾ KIỂM THỬ
## HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN (QLchitieu)

> **Tham chiếu Google Sheet:** `N4_QLchitieu` (Sheet: *tiêu chí chấp nhận& kiểm thử*)  
> **Áp dụng cho:** 17 User Stories (US1.1 – US5.4) thuộc 5 Epics chức năng.

---

## Bảng Tổng hợp Tiêu chí Chấp nhận (Acceptance Criteria)

### 💳 Epic 01: Quản lý giao dịch thu chi

#### 🔹 US1.1: Thêm mới giao dịch thu/chi
> **User Story:** *Là người dùng, tôi muốn thêm mới giao dịch thu/chi (số tiền, loại, danh mục, ví, ghi chú, ảnh hóa đơn) để ghi nhận biến động số dư chính xác.*
- **1. Biểu mẫu nhập thông tin:** Gồm các trường: Số tiền, Loại (Thu/Chi), Danh mục, Ví nguồn, Ghi chú, Ảnh hóa đơn.
- **2. Xác thực dữ liệu:**
  - Trường `Số tiền` phải là số lớn hơn 0 và chỉ chứa ký tự số.
  - Trường `Loại` (Thu/Chi), `Danh mục` và `Ví` không được để trống.
- **3. Lưu trữ dữ liệu:** Khi gửi thành công, dữ liệu phải được lưu vào cơ sở dữ liệu và số dư Ví tương ứng phải tự động được cộng/trừ chính xác.
- **4. Thông báo trạng thái:** Thông báo xác nhận *"Thêm giao dịch thành công"* phải được hiển thị.
- **5. Thông báo lỗi:** Nếu để trống trường bắt buộc, hiển thị thông báo lỗi yêu cầu nhập liệu.

#### 🔹 US1.2: Cập nhật thông tin giao dịch
> **User Story:** *Là người dùng, tôi muốn cập nhật thông tin giao dịch để sửa sai sót.*
- **1. Hiển thị dữ liệu cũ:** Biểu mẫu tự động điền sẵn các thông tin cũ (số tiền, danh mục, ví...) của giao dịch cần sửa.
- **2. Xác thực dữ liệu:** Tương tự thêm mới (Số tiền > 0, các trường bắt buộc không để trống).
- **3. Cập nhật dữ liệu:** Dữ liệu mới ghi đè dữ liệu cũ. Hệ thống tự động hoàn lại số tiền cũ vào ví và áp dụng số tiền/loại giao dịch mới để tính lại số dư.
- **4. Thông báo trạng thái:** Hiển thị thông báo *"Cập nhật thành công"*.

#### 🔹 US1.3: Xóa giao dịch và hoàn tiền ví
> **User Story:** *Là người dùng, tôi muốn xóa giao dịch và hệ thống tự động hoàn lại số dư ví.*
- **1. Xác nhận xóa:** Hệ thống phải hiển thị popup cảnh báo xác nhận (Ví dụ: *"Bạn có chắc chắn muốn xóa giao dịch này?"*) trước khi thực hiện lệnh xóa.
- **2. Xóa dữ liệu:** Giao dịch bị xóa vĩnh viễn khỏi cơ sở dữ liệu (hoặc đánh dấu đã xóa mềm - soft delete).
- **3. Hoàn lại số dư:** Hệ thống tự động tính toán và hoàn lại số tiền vào ví:
  - Cộng lại số tiền vào ví nếu xóa giao dịch Chi.
  - Trừ đi số tiền khỏi ví nếu xóa giao dịch Thu.
- **4. Thông báo trạng thái:** Hiển thị thông báo toast *"Đã xóa giao dịch thành công"* sau khi hoàn tất.

#### 🔹 US1.4: Xem danh sách giao dịch theo danh mục
> **User Story:** *Là người dùng, tôi muốn xem danh sách giao dịch theo danh mục để có thể nhanh chóng tra cứu và kiểm tra lịch sử chi tiêu.*
- **1. Giao diện bộ lọc:** Hệ thống cung cấp dropdown hoặc tab cho phép chọn lọc theo từng danh mục cụ thể.
- **2. Truy xuất dữ liệu:** Khi chọn một danh mục, màn hình danh sách chỉ hiển thị các giao dịch có `category_id` khớp với danh mục được chọn.
- **3. Sắp xếp mặc định:** Các giao dịch trong danh sách được hiển thị theo thứ tự thời gian mới nhất giảm dần.
- **4. Xử lý ngoại lệ:** Nếu danh mục được chọn chưa có giao dịch nào, hiển thị màn hình trống với thông báo *"Chưa có giao dịch nào trong danh mục này"*.

---

### 🎯 Epic 02: Quản lý hạn mức ngân sách

#### 🔹 US2.1: Thiết lập hạn mức ngân sách tháng
> **User Story:** *Là một người dùng, tôi muốn thiết lập hạn mức ngân sách chi tiêu cho từng danh mục để không bị chi tiêu quá tay trong tháng.*
- **1. Biểu mẫu thiết lập:** Gồm chọn Danh mục, Tháng/Năm, Số tiền hạn mức.
- **2. Xác thực dữ liệu:**
  - Danh mục không được để trống.
  - Một danh mục chỉ được thiết lập tối đa 1 hạn mức trong cùng một tháng.
- **3. Lưu trữ dữ liệu:** Hạn mức lưu thành công vào cơ sở dữ liệu.
- **4. Thông báo lỗi:** Nếu thiết lập trùng danh mục trong tháng, báo lỗi *"Danh mục này đã có hạn mức"*.

#### 🔹 US2.2: Hiển thị tiến độ sử dụng ngân sách
> **User Story:** *Là một người dùng, tôi muốn theo dõi thanh tiến độ sử dụng ngân sách để biết được tỷ lệ phần trăm hạn mức đã tiêu dùng.*
- **1. Hiển thị dữ liệu:** Thanh tiến độ hiển thị % chính xác theo công thức:
  $$\text{Tiến độ (\%)} = \left(\frac{\text{Tổng chi thực tế của danh mục}}{\text{Hạn mức đã đặt}}\right) \times 100$$
- **2. Cập nhật thời gian thực:** UI phải tự động cập nhật thanh tiến độ ngay khi có giao dịch chi tiêu mới được thêm/sửa/xóa.
- **3. Trực quan hóa cảnh báo:** Màu thanh tiến độ thay đổi theo mốc:
  - 🟢 Xanh: `< 70%` (hoặc `< 50%` an toàn)
  - 🟡 Vàng: `70% – 99%` (Cảnh báo tiệm cận)
  - 🔴 Đỏ: `≥ 100%` (Bội chi)

#### 🔹 US2.3: Cảnh báo khi vượt ngưỡng ngân sách
> **User Story:** *Là một người dùng, tôi muốn nhận thông báo cảnh báo khi chi tiêu sắp chạm ngưỡng hạn mức để kịp thời điều chỉnh kế hoạch chi tiêu.*
- **1. Kích hoạt thông báo:** Hệ thống tự động kiểm tra sau mỗi giao dịch chi tiêu mới:
  - Nếu % chi tiêu đạt $\ge 80\%$, gửi cảnh báo mức vàng: *"Bạn đã tiêu hết [X]% ngân sách danh mục [Tên]"*.
  - Nếu % chi tiêu đạt $\ge 100\%$, gửi cảnh báo mức đỏ: *"Bạn đã bội chi ngân sách danh mục [Tên]"*.
- **2. Tần suất gửi:** Mỗi ngưỡng cảnh báo (80%, 100%) của một danh mục chỉ gửi thông báo 1 lần duy nhất trong tháng đó.

---

### 📊 Epic 03: Báo cáo thống kê chi tiêu

#### 🔹 US3.1: Biểu đồ tròn phân bổ chi tiêu
> **User Story:** *Là một người dùng, tôi muốn xem biểu đồ tròn phân tích cơ cấu chi tiêu để có thể biết nhóm chi phí nào đang chiếm tỷ trọng lớn nhất.*
- **1. Tính toán tỷ trọng:** Biểu đồ chia các mảnh ghép tỷ lệ thuận với tổng số tiền của từng danh mục. Tổng các mảnh ghép phải luôn bằng 100%.
- **2. Bộ lọc thời gian:** Cho phép lọc xem biểu đồ theo Tuần / Tháng / Năm.
- **3. Xử lý ngoại lệ:** Hiển thị màn hình trống với thông báo *"Chưa có giao dịch nào trong kỳ này"* nếu không có dữ liệu.

#### 🔹 US3.2: Biểu đồ cột so sánh Thu vs Chi
> **User Story:** *Là một người dùng, tôi muốn xem biểu đồ so sánh tổng thu và tổng chi qua các tháng để đánh giá được khả năng tiết kiệm ròng.*
- **1. Cấu trúc biểu đồ:** Trục X là thời gian (các tháng), Trục Y là số tiền. Mỗi tháng có 2 cột đứng cạnh nhau: 1 cột Thu, 1 cột Chi.
- **2. Tính toán số liệu:** Chiều cao của cột phản ánh chính xác tổng Thu và tổng Chi đã query từ cơ sở dữ liệu trong tháng đó.

#### 🔹 US3.3: Xuất dữ liệu báo cáo ra Excel/CSV
> **User Story:** *Là một người dùng, tôi muốn xuất báo cáo danh sách giao dịch ra file Excel để thuận tiện lưu trữ hoặc phân tích chuyên sâu trên máy tính.*
- **1. Định dạng file:** Hỗ trợ xuất ra định dạng `.xlsx` hoặc `.csv`.
- **2. Bố cục dữ liệu:** File Excel có hàng tiêu đề rõ ràng (Ngày, Loại, Danh mục, Số tiền, Ví, Ghi chú) và không bị lỗi font tiếng Việt (UTF-8).
- **3. Phạm vi xuất:** Chỉ xuất các giao dịch nằm trong bộ lọc thời gian hiện tại người dùng đang xem.

---

### 📂 Epic 04: Quản lý danh mục thu chi

#### 🔹 US4.1: Tạo mới danh mục thu/chi
> **User Story:** *Là một người dùng, tôi muốn tạo mới danh mục thu/chi (tên, biểu tượng, loại thu/chi) để cá nhân hóa việc phân loại giao dịch.*
- **1. Biểu mẫu tạo mới:** Giao diện gồm các trường nhập liệu: Tên danh mục, Biểu tượng (Icon), Màu sắc, Loại (Thu hoặc Chi).
- **2. Xác thực dữ liệu:** Tên danh mục không được để trống và không được trùng lặp với danh mục hiện có cùng loại.

#### 🔹 US4.2: Xóa / Ẩn danh mục & bảo lưu dữ liệu
> **User Story:** *Là một người dùng, tôi muốn xóa mục không dùng nữa kèm lựa chọn chuyển giao dịch cũ sang danh mục khác để bảo toàn lịch sử thu chi.*
- **1. Ràng buộc toàn vẹn:** Nếu xóa một danh mục đang có giao dịch, bắt buộc hiện popup yêu cầu chọn 1 danh mục thay thế để chuyển dữ liệu sang (ví dụ: danh mục *"Khác"*).
- **2. Thực thi:** Xóa danh mục cũ khỏi DB, đồng thời update ID danh mục của toàn bộ giao dịch liên quan sang ID danh mục mới.

#### 🔹 US4.3: Quản lý danh mục cha - con
> **User Story:** *Là một người dùng, tôi muốn tạo các danh mục con trực thuộc danh mục cha để quản lý chi tiêu chi tiết theo từng nhóm nhỏ.*
- **1. Quan hệ cha con:** Cho phép gán `parent_id` cho một danh mục để biến nó thành danh mục con.
- **2. Hiển thị:** Trên UI chọn danh mục, danh mục con phải nằm thụt lề dưới danh mục cha.
- **3. Thống kê:** Khi xem báo cáo, tổng tiền của danh mục cha phải bao gồm cả tiền của các danh mục con.

---

### 🤝 Epic 05: Quản lý hồ sơ vay (Sổ nợ)

#### 🔹 US5.1: Ghi nhận khoản nợ mới (Vay/Cho vay)
> **User Story:** *Là một người dùng, tôi muốn tạo khoản nợ mới (cho vay hoặc đi vay) gồm số tiền, người vay/cho vay, ngày hẹn trả để theo dõi công nợ rõ ràng.*
- **1. Biểu mẫu:** Bắt buộc nhập Số tiền, Tên người (vay/cho vay), Ngày hẹn trả, Ví thanh toán.
- **2. Luồng dữ liệu:** Lưu thành công vào phân hệ Sổ nợ và tự động cập nhật số dư ví nguồn.

#### 🔹 US5.2: Ghi nhận trả nợ từng phần hoặc tất toán
> **User Story:** *Là một người dùng, tôi muốn ghi nhận trả nợ từng phần hoặc tất toán để hệ thống cập nhật số dư nợ còn lại.*
- **1. Nhập số tiền:** Số tiền trả không được lớn hơn Dư nợ còn lại.
- **2. Tính toán logic:** $\text{Dư nợ mới} = \text{Dư nợ cũ} - \text{Số tiền trả}$.
- **3. Cập nhật trạng thái:** Nếu Dư nợ mới = 0, hệ thống tự động đổi trạng thái khoản nợ thành *"Đã hoàn tất"*.

#### 🔹 US5.3: Xem danh sách sổ nợ theo trạng thái
> **User Story:** *Là một người dùng, tôi muốn xem danh sách các khoản nợ được phân loại rõ ràng (chưa thanh toán, đã hoàn tất, quá hạn) để kiểm soát tổng nợ nhanh chóng.*
- **1. Phân loại bộ lọc:** Hệ thống chia rõ 3 tab: *Chưa thanh toán*, *Quá hạn*, *Đã hoàn tất*.
- **2. Logic Quá hạn:** Tự động query và chuyển các khoản nợ có `Ngày hẹn trả < Ngày hiện tại` (và số dư > 0) vào tab Quá hạn, bôi đỏ cảnh báo.

#### 🔹 US5.4: Thông báo nhắc hẹn trả/đòi nợ
> **User Story:** *Là một người dùng, tôi muốn nhận thông báo nhắc nhở khi đến ngày hẹn trả/đòi nợ để tránh việc trễ hạn hoặc quên đối soát công nợ.*
- **1. Trigger thông báo:** Cronjob (hoặc hệ thống nền) quét mỗi ngày, tự động gửi thông báo cho các khoản nợ *"Đến hạn trong hôm nay"* hoặc *"Đã quá hạn"*.
- **2. Nội dung:** Hiển thị Tên người nợ, Số tiền và trạng thái (đến hạn/quá hạn).
