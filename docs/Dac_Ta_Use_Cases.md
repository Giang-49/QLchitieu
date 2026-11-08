# ĐẶC TẢ CHI TIẾT USE CASE (USE CASE SPECIFICATIONS)
## HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN (QLchitieu)

---

## 1. Sơ đồ Use Case Tổng quan (Use Case Diagram)

```mermaid
graph LR
    User((Người dùng))

    subgraph QLchitieu["Hệ thống Quản lý Chi tiêu Cá nhân"]
        subgraph Epic01["Epic 01: Giao dịch"]
            UC01["UC-01: Thêm mới giao dịch"]
            UC02["UC-02: Cập nhật giao dịch"]
            UC03["UC-03: Xóa giao dịch"]
            UC06["UC-06: Xem danh sách & lọc"]
        end

        subgraph Epic02["Epic 02: Ngân sách"]
            UC04["UC-04: Thiết lập hạn mức ngân sách"]
            UC07["UC-07: Theo dõi cảnh báo bội chi"]
        end

        subgraph Epic03["Epic 03: Báo cáo"]
            UC08["UC-08: Xem biểu đồ phân tích"]
            UC09["UC-09: Xuất báo cáo Excel"]
        end

        subgraph Epic05["Epic 05: Sổ nợ"]
            UC05["UC-05: Tạo khoản nợ mới"]
            UC10["UC-10: Ghi nhận trả nợ"]
            UC11["UC-11: Theo dõi nhắc nợ"]
        end
    end

    User --> UC01
    User --> UC02
    User --> UC03
    User --> UC06
    User --> UC04
    User --> UC07
    User --> UC08
    User --> UC09
    User --> UC05
    User --> UC10
    User --> UC11
```

---

## 2. Đặc tả Chi tiết các Use Case Trọng tâm

### 2.1. UC-01: Thêm mới giao dịch thu/chi

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as Giao diện Frontend
    participant API as Backend Service
    participant DB as Database (RDBMS)

    User->>UI: Chọn "Thêm giao dịch", điền thông tin (loại, số tiền, ví, danh mục)
    User->>UI: Nhấn nút "Lưu"
    UI->>UI: Validate Client-side (số tiền > 0, trường bắt buộc)
    alt Không hợp lệ
        UI-->>User: Báo lỗi nhập liệu
    else Hợp lệ
        UI->>API: POST /api/v1/transactions
        API->>DB: Bắt đầu Transaction (BEGIN TRANSACTION)
        API->>DB: INSERT INTO transactions (...)
        API->>DB: UPDATE wallets SET balance = balance +/- amount WHERE id = wallet_id
        API->>DB: COMMIT TRANSACTION
        API-->>UI: 201 Created { transaction, updated_balance }
        UI-->>User: Hiển thị thông báo thành công & cập nhật Dashboard
    end
```

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | **UC-01** |
| **Tên Use Case** | Thêm mới giao dịch thu / chi |
| **Tác nhân chính** | Người dùng đã xác thực (User) |
| **Mô tả** | Người dùng nhập và lưu một giao dịch thu nhập hoặc chi tiêu mới vào hệ thống. |
| **Điều kiện tiên quyết** | 1. Người dùng đã đăng nhập vào hệ thống.<br/>2. Người dùng có ít nhất một Ví đang hoạt động.<br/>3. Người dùng có ít nhất một Danh mục phù hợp với loại giao dịch. |
| **Hậu điều kiện** | 1. Bản ghi giao dịch mới được lưu trữ trong bảng `transactions`.<br/>2. Số dư của ví liên quan được cộng thêm (nếu là Thu) hoặc trừ bớt (nếu là Chi).<br/>3. Thống kê ngân sách liên quan được cập nhật tiến độ sử dụng. |
| **Luồng chính (Main Flow)** | 1. Người dùng bấm nút "+" hoặc chọn "Thêm giao dịch".<br/>2. Hệ thống hiển thị form nhập liệu.<br/>3. Người dùng chọn loại giao dịch (Chi tiền / Thu tiền).<br/>4. Người dùng nhập số tiền giao dịch (> 0).<br/>5. Người dùng chọn Danh mục chi tiêu/thu nhập.<br/>6. Người dùng chọn Ví nguồn tiền thực hiện.<br/>7. Người dùng chọn thời gian (mặc định là thời điểm hiện tại).<br/>8. Người dùng nhập ghi chú và tải ảnh hóa đơn (không bắt buộc).<br/>9. Người dùng bấm "Lưu".<br/>10. Hệ thống xác thực tính hợp lệ của dữ liệu.<br/>11. Hệ thống lưu bản ghi giao dịch và cập nhật số dư ví trong cùng một database transaction.<br/>12. Hệ thống kiểm tra hạn mức ngân sách của danh mục (nếu là Chi phí).<br/>13. Hệ thống trả về thông báo "Thêm giao dịch thành công" và làm mới dữ liệu màn hình chính. |
| **Luồng phụ / Ngoại lệ** | - **E1 - Số tiền không hợp lệ:** Người dùng để trống số tiền hoặc nhập giá trị ≤ 0 -> Hệ thống hiển thị cảnh báo đỏ *"Số tiền phải lớn hơn 0"*, nút "Lưu" bị vô hiệu hóa.<br/>- **E2 - Thiếu danh mục hoặc ví:** Người dùng chưa chọn ví hoặc danh mục -> Hệ thống tô đỏ trường còn thiếu và thông báo *"Vui lòng chọn ví/danh mục"*. |

---

### 2.2. UC-02: Cập nhật giao dịch

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | **UC-02** |
| **Tên Use Case** | Cập nhật thông tin giao dịch |
| **Tác nhân chính** | Người dùng (User) |
| **Mô tả** | Người dùng chỉnh sửa thông tin giao dịch đã ghi nhận trước đó. |
| **Điều kiện tiên quyết** | Giao dịch cần sửa thuộc quyền sở hữu của người dùng đang đăng nhập. |
| **Hậu điều kiện** | Dữ liệu giao dịch được cập nhật; số dư ví cũ/mới được điều chỉnh bù trừ chuẩn xác. |
| **Luồng chính (Main Flow)** | 1. Người dùng chọn một giao dịch từ danh sách lịch sử.<br/>2. Hệ thống hiển thị màn hình chi tiết và cho phép chỉnh sửa.<br/>3. Người dùng thay đổi thông tin (Số tiền, Ví, Danh mục, Ghi chú,...).<br/>4. Người dùng bấm "Cập nhật".<br/>5. Hệ thống kiểm tra hợp lệ và mở transaction CSDL:<br/>&nbsp;&nbsp;&nbsp;&nbsp;a. Hoàn lại số dư ví theo số tiền và loại của giao dịch cũ.<br/>&nbsp;&nbsp;&nbsp;&nbsp;b. Áp dụng số tiền và loại mới vào ví mới được chọn.<br/>&nbsp;&nbsp;&nbsp;&nbsp;c. Cập nhật bản ghi `transactions`.<br/>6. Hoàn tất cập nhật và hiển thị thông báo thành công. |
| **Luồng phụ / Ngoại lệ** | - Người dùng nhập số tiền mới ≤ 0 -> Báo lỗi và từ chối cập nhật.<br/>- Người dùng bấm "Hủy" -> Giữ nguyên dữ liệu cũ. |

---

### 2.3. UC-03: Xóa giao dịch

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | **UC-03** |
| **Tên Use Case** | Xóa giao dịch |
| **Tác nhân chính** | Người dùng (User) |
| **Mô tả** | Loại bỏ hoàn toàn một giao dịch ghi nhận sai hoặc trùng lặp. |
| **Điều kiện tiên quyết** | Giao dịch tồn tại trên hệ thống. |
| **Hậu điều kiện** | Bản ghi giao dịch bị xóa; số dư ví nguồn được hoàn lại nguyên trạng. |
| **Luồng chính (Main Flow)** | 1. Người dùng bấm nút "Xóa" tại màn hình chi tiết giao dịch.<br/>2. Hệ thống hiển thị Modal xác nhận cảnh báo: *"Thao tác này sẽ hoàn tác số dư ví. Bạn có chắc chắn muốn xóa không?"*<br/>3. Người dùng chọn "Xác nhận xóa".<br/>4. Hệ thống thực hiện hoàn tác số dư ví:<br/>&nbsp;&nbsp;&nbsp;&nbsp;- Nếu là Chi tiêu: Cộng lại số tiền vào ví.<br/>&nbsp;&nbsp;&nbsp;&nbsp;- Nếu là Thu nhập: Trừ bớt số tiền khỏi ví.<br/>5. Hệ thống xóa bản ghi khỏi bảng `transactions`.<br/>6. Đóng modal và hiển thị thông báo "Đã xóa giao dịch". |
| **Luồng phụ** | - Người dùng chọn "Hủy bỏ" tại bước 3 -> Modal đóng lại, dữ liệu được giữ nguyên vẹn. |

---

### 2.4. UC-04: Thiết lập hạn mức ngân sách

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | **UC-04** |
| **Tên Use Case** | Thiết lập hạn mức ngân sách |
| **Tác nhân chính** | Người dùng (User) |
| **Mô tả** | Định mức số tiền chi tiêu tối đa cho một danh mục trong một tháng dương lịch. |
| **Điều kiện tiên quyết** | Người dùng đã tạo danh mục chi tiêu cần đặt hạn mức. |
| **Hậu điều kiện** | Bản ghi ngân sách được lưu hoặc cập nhật trong bảng `budgets`. |
| **Luồng chính (Main Flow)** | 1. Người dùng truy cập phân hệ "Ngân sách" và chọn "Tạo ngân sách mới".<br/>2. Người dùng chọn Danh mục chi tiêu áp dụng.<br/>3. Người dùng nhập Số tiền hạn mức mong muốn (> 0).<br/>4. Người dùng chọn kỳ áp dụng (Tháng / Năm). Mặc định là tháng hiện tại.<br/>5. Người dùng bấm "Lưu".<br/>6. Hệ thống kiểm tra nếu đã tồn tại ngân sách của danh mục này trong tháng thì thực hiện cập nhật (`UPSERT`), nếu chưa thì tạo mới.<br/>7. Hệ thống tính toán ngay tỷ lệ % đã chi từ các giao dịch trong tháng đó.<br/>8. Hiển thị thông báo "Thiết lập ngân sách thành công". |
| **Luồng phụ / Ngoại lệ** | - Người dùng nhập số tiền ≤ 0 -> Báo lỗi *"Số tiền hạn mức phải lớn hơn 0"*. |

---

### 2.5. UC-05: Tạo khoản nợ mới (Sổ nợ)

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | **UC-05** |
| **Tên Use Case** | Tạo khoản nợ mới (Vay / Cho vay) |
| **Tác nhân chính** | Người dùng (User) |
| **Mô tả** | Ghi nhận một khoản nợ phát sinh khi người dùng đi vay tiền hoặc cho người khác mượn tiền. |
| **Điều kiện tiên quyết** | Người dùng có ví khả dụng để nhận/chuyển tiền. |
| **Hậu điều kiện** | 1. Bản ghi khoản nợ mới được tạo trong bảng `debts` với `remaining = amount`.<br/>2. Số dư ví được biến động theo nghiệp vụ. |
| **Luồng chính (Main Flow)** | 1. Người dùng vào màn hình Sổ nợ, bấm "Thêm khoản nợ".<br/>2. Chọn loại hình: **Đi vay** (Borrow) hoặc **Cho vay** (Lend).<br/>3. Nhập số tiền vay ban đầu (> 0).<br/>4. Nhập tên người vay/cho vay (Đối tác).<br/>5. Chọn ngày hẹn hoàn trả (Due Date).<br/>6. Chọn Ví thực hiện giao dịch.<br/>7. Nhập ghi chú (nếu có).<br/>8. Bấm "Lưu".<br/>9. Hệ thống kiểm tra hợp lệ:<br/>&nbsp;&nbsp;&nbsp;&nbsp;- Nếu là "Cho vay": Trừ tiền trong ví được chọn.<br/>&nbsp;&nbsp;&nbsp;&nbsp;- Nếu là "Đi vay": Cộng tiền vào ví được chọn.<br/>10. Lưu bản ghi nợ với trạng thái mặc định là `unpaid`.<br/>11. Hiển thị thông báo thành công. |
| **Luồng phụ / Ngoại lệ** | - Bỏ trống tên người liên quan hoặc số tiền -> Hệ thống yêu cầu điền đầy đủ. |
