# KỊCH BẢN KIỂM THỬ HÀNH VI (BDD TEST SCENARIOS)
## HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN (QLchitieu)

> **Tham chiếu Google Sheet:** N4_QLchitieu (Sheet: *kịch bản*)  
> **Phương pháp tiếp cận:** BDD / Gherkin Syntax (Given - When - Then - And)  
> **Bao phủ:** Toàn bộ 17 User Stories (US1.1 – US5.4) cho các luồng nghiệp vụ thành công và ngoại lệ.

---

## 📌 US1.1: thêm giao dịch mới
> **User Story:** *Là người dùng, tôi muốn thêm mới giao dịch thu/chi (số tiền, loại, danh mục, ví, ghi chú, ảnh hóa đơn) để ghi nhận biến động số dư chính xác*

`gherkin
Scenario: Thêm giao dịch chi tiêu thành công
- Given tôi mở biểu mẫu thêm giao dịch mới
- When tôi nhập vào các thông tin hợp lệ:
       Số tiền  : 50.000
       Loại : Chi tiêu 
       Danh mục : Ăn uống 
       Ví :Tiền mặt 
       Ghi chú :Ăn trưa 
- And tôi nhấn nút "Lưu"
- Then hệ thống hiển thị thông báo "Thêm giao dịch thành công"
- And số dư ví bị trừ đi 50.000 và giao dịch được lưu vào cơ sở dữ liệu
Scenario: Thông báo lỗi khi để trống số tiền bắt buộc
- Given tôi mở biểu mẫu thêm giao dịch mới
- When tôi bỏ trống trường "Số tiền"
-And tôi nhấn nút "Lưu"
-Then hệ thống hiển thị thông báo lỗi "Vui lòng nhập số tiền"
`

---

## 📌 US1.2: sửa giao dịch
> **User Story:** *Là người dùng, tôi muốn cập nhật thông tin giao dịch để sửa sai sót*

`gherkin
Scenario: Cập nhật thông tin giao dịch thành công
-Given tôi đang ở màn hình chi tiết của một giao dịch "Chi tiêu" có số tiền là 50.000
-When tôi sửa thông tin hợp lệ:
        Số tiền :100.000
-And tôi nhấn nút "Lưu"
-Then hệ thống hiển thị thông báo "Cập nhật giao dịch thành công"
-And số dư ví bị trừ thêm 50.000 (để khớp với số tiền mới) và dữ liệu được cập nhật
Scenario: Thông báo lỗi khi nhập số tiền không hợp lệ
-Given tôi đang ở màn hình chi tiết của một giao dịch
-When tôi sửa trường "Số tiền" thành "0" hoặc số âm
-And tôi nhấn nút "Lưu"
-Then hệ thống hiển thị thông báo lỗi "Số tiền không hợp lệ"
`

---

## 📌 US1.3: xóa giao dịch
> **User Story:** *Là người dùng, tôi muốn xóa giao dịch và hệ thống tự động hoàn lại số dư ví*

`gherkin
Scenario: Xóa giao dịch thành công và hoàn lại số dư ví
-Given tôi đang xem chi tiết một giao dịch "Chi tiêu" trị giá 100.000
-When tôi nhấn nút "Xóa"
-And tôi xác nhận "Đồng ý" trên hộp thoại cảnh báo
-Then hệ thống hiển thị thông báo "Đã xóa giao dịch"
-And giao dịch biến mất khỏi danh sách và số dư ví được cộng hoàn lại 100.000
Scenario: Hủy thao tác xóa giao dịch
-Given tôi đang xem chi tiết một giao dịch
-When tôi nhấn nút "Xóa"
-And tôi chọn "Hủy" trên hộp thoại cảnh báo
-Then hộp thoại đóng lại và giao dịch vẫn được giữ nguyên trong cơ sở dữ liệu
`

---

## 📌 US1.4: xem theo danh mục
> **User Story:** *Là người dùng, tôi muốn xem danh sách giao dịch theo danh mục để có thể nhanh chóng tra cứu và kiểm tra lịch sử chi tiêu*

`gherkin
Scenario: Lọc và hiển thị chính xác danh sách giao dịch
Given tôi đang ở màn hình danh sách lịch sử giao dịch
When tôi chọn lọc theo danh mục:
          Danh mục : mua sắm 
Then hệ thống chỉ hiển thị các giao dịch thuộc danh mục "Mua sắm"
And danh sách được sắp xếp theo thời gian mới nhất
Scenario: Hiển thị thông báo khi danh mục trống
Given tôi đang ở màn hình danh sách lịch sử giao dịch
When tôi chọn lọc theo một danh mục chưa có bất kỳ giao dịch nào
Then hệ thống hiển thị thông báo "Chưa có giao dịch nào thuộc danh mục này"
`

---

## 📌 US2.1: Cài đặt hạn mức ngân sách tháng
> **User Story:** *Là một người dùng, tôi muốn thiết lập hạn mức ngân sách chi tiêu cho từng danh mục để không bị chi tiêu quá tay trong tháng.*

`gherkin
Scenario: Thiết lập hạn mức ngân sách cho danh mục thành công
Given tôi mở màn hình cài đặt ngân sách
When tôi nhập vào các thông tin hợp lệ:
Trường                             Giá trị
Danh mục                        Ăn uống
Hạn mức ngân sách        3.000.000
Thời gian                        xx/xx/2026
And tôi nhấn nút "Lưu"
Then hệ thống hiển thị thông báo "Thiết lập ngân sách thành công"
And hạn mức ngân sách được lưu vào hệ thống
Scenario: Thông báo lỗi khi nhập hạn mức ngân sách không hợp lệ
Given tôi mở màn hình cài đặt ngân sách
When tôi nhập hạn mức ngân sách không hợp lệ "0"
And tôi nhấn nút "Lưu"
Then hệ thống hiển thị thông báo lỗi "Hạn mức ngân sách không hợp lệ"
`

---

## 📌 US2.2: Hiển thị tiến độ sử dụng ngân sách
> **User Story:** *Là một người dùng, tôi muốn theo dõi thanh tiến độ sử dụng ngân sách để biết được tỷ lệ phần trăm hạn mức đã tiêu dùng.*

`gherkin
Scenario: Hiển thị đúng tiến độ sử dụng ngân sách
Given tôi đã thiết lập hạn mức ngân sách cho danh mục "Ăn uống" là 3.000.000
When tổng chi tiêu của danh mục "Ăn uống" là 1.500.000
And tôi mở màn hình "Ngân sách"
Then hệ thống hiển thị thanh tiến độ sử dụng ngân sách
And hệ thống hiển thị tỷ lệ sử dụng là "50%"
And thanh tiến độ phản ánh đúng tỷ lệ giữa tổng chi tiêu và hạn mức ngân sách
Scenario: Hiển thị tiến độ khi chưa có giao dịch
Given tôi đã thiết lập hạn mức ngân sách cho danh mục "Ăn uống" là 3.000.000
When danh mục "Ăn uống" chưa phát sinh giao dịch chi tiêu
And tôi mở màn hình "Ngân sách"
Then hệ thống hiển thị tiến độ sử dụng ngân sách là "0%"
And hệ thống hiển thị tổng chi tiêu là "0"
`

---

## 📌 US2.3: Cảnh báo khi vượt ngưỡng ngân sách
> **User Story:** *Là một người dùng, tôi muốn nhận thông báo cảnh báo khi chi tiêu sắp chạm ngưỡng hạn mức để kịp thời điều chỉnh kế hoạch chi tiêu.*

`gherkin
Scenario: Cảnh báo khi chi tiêu chạm 80% hạn mức ngân sách
Given tôi đã thiết lập hạn mức ngân sách cho danh mục "Ăn uống" là 3.000.000
When tôi thêm giao dịch chi tiêu:
Trường               Giá trị
Số tiền              100.000
Loại                      Chi tiêu
Danh mục      Ăn uống
Ví                       Tiền mặt
And tổng chi tiêu đạt 2.400.000
Then hệ thống hiển thị thông báo "Bạn đã sử dụng 80% ngân sách"
And hệ thống gửi thông báo Push cho người dùng
Scenario: Cảnh báo khi chi tiêu chạm 100% hạn mức ngân sách
Given tôi đã thiết lập hạn mức ngân sách cho danh mục "Ăn uống" là 3.000.000
When tôi thêm giao dịch chi tiêu 100.000
And tổng chi tiêu đạt 3.000.000
Then hệ thống hiển thị thông báo "Bạn đã sử dụng hết ngân sách"
And hệ thống gửi thông báo Push cho người dùng
`

---

## 📌 US3.1: Biểu đồ tròn phân bổ chi tiêu
> **User Story:** *Là một người dùng, tôi muốn xem biểu đồ tròn phân tích cơ cấu chi tiêu để có thể biết nhóm chi phí nào đang chiếm tỷ trọng lớn nhất.*

`gherkin
Scenario: Hiển thị biểu đồ tròn thành công khi có dữ liệu

-Given tôi đang ở màn hình "Báo cáo thống kê"
-When tôi chọn loại biểu đồ là "Biểu đồ tròn cơ cấu chi tiêu"
-And tôi chọn bộ lọc thời gian (VD: Tháng này) có phát sinh các giao dịch chi tiêu
-Then hệ thống hiển thị một biểu đồ tròn
-And biểu đồ chia tỷ lệ phần trăm chính xác cho từng nhóm danh mục chi phí

Scenario: Xử lý ngoại lệ khi không có dữ liệu

-Given tôi đang ở màn hình "Báo cáo thống kê"
-When tôi chọn bộ lọc thời gian vào một tháng chưa có bất kỳ giao dịch chi tiêu nào
-Then hệ thống không hiển thị biểu đồ
-And hệ thống hiển thị thông báo "Chưa có dữ liệu chi tiêu trong khoảng thời gian này"
`

---

## 📌 US3.2: Biểu đồ cột so sánh Thu vs Chi
> **User Story:** *Là một người dùng, tôi muốn xem biểu đồ so sánh tổng thu và tổng chi qua các tháng để đánh giá được khả năng tiết kiệm ròng.*

`gherkin
Scenario: Hiển thị biểu đồ cột so sánh thành công

-Given tôi đang ở màn hình "Báo cáo thống kê"
-When tôi chọn loại biểu đồ là "Biểu đồ cột so sánh Thu vs Chi"
-And tôi chọn bộ lọc thời gian theo năm (VD: Năm 2026)
-Then hệ thống hiển thị biểu đồ cột với trục hoành là các tháng trong năm
-And mỗi tháng hiển thị chính xác 2 cột đứng cạnh nhau đại diện cho "Tổng Thu" và "Tổng Chi" theo dữ liệu thực tế

Scenario: Tương tác xem chi tiết số liệu trên biểu đồ

-Given biểu đồ cột so sánh đang được hiển thị
-When tôi chạm (hoặc rê chuột) vào một cột bất kỳ trên biểu đồ
-Then hệ thống hiển thị một tooltip (khung chú thích) hiện rõ số tiền cụ thể của cột đó
`

---

## 📌 US3.3: Xuất dữ liệu báo cáo ra Excel/CSV
> **User Story:** *Là một người dùng, tôi muốn xuất báo cáo danh sách giao dịch ra file Excel để thuận tiện lưu trữ hoặc phân tích chuyên sâu trên máy tính.*

`gherkin
Scenario: Tải xuống file Excel báo cáo thành công

-Given tôi đang xem danh sách giao dịch hoặc báo cáo của một khoảng thời gian nhất định
-When tôi nhấn vào nút "Xuất Excel" (hoặc Export)
-Then hệ thống xử lý và trình duyệt tự động tải xuống một file có định dạng .xlsx
-And khi mở file, dữ liệu bên trong chứa đầy đủ các cột thông tin (Ngày, Loại, Danh mục, Số tiền, Ghi chú) khớp với lịch sử giao dịch trên ứng dụng


Scenario: Báo lỗi khi xuất dữ liệu rỗng

-Given tôi đang ở màn hình danh sách giao dịch nhưng không có dữ liệu nào hiển thị
-When tôi nhấn nút "Xuất Excel"
-Then hệ thống hiển thị thông báo cảnh báo "Không có dữ liệu để xuất"
-And không có file nào được tải xuống
`

---

## 📌 US4.1: tạo danh mục thu/chi
> **User Story:** *Là một người dùng, tôi muốn tạo mới danh mục thu/chi (tên, biểu tượng, loại thu/chi) để cá nhân hóa việc phân loại giao dịch.*

`gherkin
Scenario: Tạo danh mục thu/chi thành công
Given tôi đang ở màn hình "Quản lý danh mục"
When tôi chọn "Thêm danh mục"
And tôi nhập các thông tin hợp lệ:
Tên danh mục: "Ăn uống"
Loại: "Chi tiêu"
Biểu tượng: 
Màu sắc: "Xanh"
And tôi nhấn nút "Lưu"
Then hệ thống hiển thị thông báo "Tạo danh mục thành công"
And danh mục "Ăn uống" được hiển thị trong danh sách danh mục
Scenario: Thông báo lỗi khi để trống tên danh mục
Given tôi đang ở màn hình "Thêm danh mục"
When tôi bỏ trống trường "Tên danh mục"
And tôi chọn loại "Chi tiêu"
And tôi nhấn nút "Lưu"
Then hệ thống hiển thị thông báo lỗi "Vui lòng nhập tên danh mục"
And hệ thống không tạo danh mục mới
`

---

## 📌 US4.2: Ẩn danh mục & bảo lưu dữ liệu
> **User Story:** *Là một người dùng, tôi muốn xóa mục không dùng nữa kèm lựa chọn chuyển giao dịch cũ sang danh mục khác để bảo toàn lịch sử thu chi.*

`gherkin
Scenario: Xóa danh mục và chuyển giao dịch sang danh mục "Khác"
Given tôi đang ở màn hình "Quản lý danh mục"
And danh mục "Ăn uống" đang có các giao dịch đã phát sinh
When tôi chọn danh mục "Ăn uống"
And tôi nhấn nút "Xóa"
And hệ thống hiển thị lựa chọn "Chuyển giao dịch sang danh mục Khác"
And tôi chọn "Đồng ý"
Then hệ thống hiển thị thông báo "Xóa danh mục thành công"
And danh mục "Ăn uống" được ẩn khỏi danh sách danh mục
And các giao dịch trước đây thuộc danh mục "Ăn uống" được chuyển sang danh mục "Khác"
And lịch sử giao dịch vẫn được bảo toàn
Scenario: Hủy thao tác xóa danh mục
Given tôi đang ở màn hình "Quản lý danh mục"
And tôi chọn danh mục "Ăn uống"
When tôi nhấn nút "Xóa"
And tôi chọn "Hủy" trên hộp thoại xác nhận
Then hộp thoại xác nhận được đóng
And danh mục "Ăn uống" vẫn được giữ nguyên
And các giao dịch thuộc danh mục "Ăn uống" không bị thay đổi
`

---

## 📌 US4.3: Quản lý danh mục cha - con
> **User Story:** *Là một người dùng, tôi muốn tạo các danh mục con trực thuộc danh mục cha để quản lý chi tiêu chi tiết theo từng nhóm nhỏ.*

`gherkin
Scenario: Tạo danh mục con thành công
Given tôi đang ở màn hình "Quản lý danh mục"
And danh mục cha "Ăn uống" đã tồn tại
When tôi chọn "Thêm danh mục"
And tôi nhập tên danh mục con là "Ăn sáng"
And tôi chọn danh mục cha là "Ăn uống"
And tôi chọn loại "Chi tiêu"
And tôi nhấn nút "Lưu"
Then hệ thống hiển thị thông báo "Tạo danh mục thành công"
And danh mục "Ăn sáng" được tạo
And danh mục "Ăn sáng" được hiển thị trực thuộc danh mục cha "Ăn uống"
Scenario: Thông báo lỗi khi không chọn danh mục cha
Given tôi đang ở màn hình "Thêm danh mục con"
When tôi nhập tên danh mục con là "Ăn sáng"
And tôi không chọn danh mục cha
And tôi nhấn nút "Lưu"
Then hệ thống hiển thị thông báo lỗi "Vui lòng chọn danh mục cha"
And hệ thống không tạo danh mục con
`

---

## 📌 US5.1: Ghi nhận khoản nợ mới (Vay/Cho vay)
> **User Story:** *Là một người dùng, tôi muốn tạo khoản nợ mới (cho vay hoặc đi vay) gồm số tiền, người vay/cho vay, ngày hẹn trả để theo dõi công nợ rõ ràng.*

`gherkin
Scenario: Tạo khoản nợ mới (Cho vay) thành công
- Given tôi mở biểu mẫu tạo khoản nợ mới
- When tôi nhập vào các thông tin hợp lệ:
- Loại: Cho vay
- Số tiền: 1.000.000 
- Người vay: Nguyễn Văn A
- Ngày hẹn trả: 20/11/2026 
- Ví: Tiền mặt Ghi chú: Cho A mượn tiền
- And tôi nhấn nút "Lưu"
- Then hệ thống hiển thị thông báo "Tạo khoản nợ thành công"
- And số dư ví Tiền mặt bị trừ đi 1.000.000 và khoản nợ mới được lưu vào danh sách sổ nợ
Scenario: Thông báo lỗi khi để trống thông tin bắt buộc
- Given tôi mở biểu mẫu tạo khoản nợ mới
- When tôi nhập số tiền nhưng bỏ trống trường "Người vay/cho vay" hoặc "Ngày hẹn trả"
- And tôi nhấn nút "Lưu"
- Then hệ thống hiển thị thông báo lỗi "Vui lòng nhập đầy đủ các thông tin bắt buộc"
`

---

## 📌 US5.2: Cập nhật trả nợ
> **User Story:** *Là một người dùng, tôi muốn ghi nhận trả nợ từng phần hoặc tất toán để hệ thống cập nhật số dư nợ còn lại.*

`gherkin
Scenario: Ghi nhận trả nợ một phần thành công
- Given tôi đang ở màn hình chi tiết khoản nợ có số dư nợ là 1.000.000
- When tôi chọn "Trả nợ" và nhập số tiền trả là 400.000
- And tôi chọn ví nhận/thanh toán và nhấn nút "Xác nhận"
- Then hệ thống hiển thị thông báo "Cập nhật trả nợ thành công"
- And số dư nợ còn lại của khoản nợ được cập nhật thành 600.000
Scenario: Thông báo lỗi khi số tiền trả nợ lớn hơn số nợ còn lại
- Given tôi đang ở màn hình chi tiết khoản nợ có số dư nợ là 1.000.000
- When tôi nhập số tiền trả là 1.500.000
- And tôi nhấn nút "Xác nhận"
- Then hệ thống hiển thị thông báo lỗi "Số tiền trả không được vượt quá số dư nợ hiện tại"
`

---

## 📌 US5.3: Xem danh sách sổ nợ theo trạng thái
> **User Story:** *Là một người dùng, tôi muốn xem danh sách các khoản nợ được phân loại rõ ràng (chưa thanh toán, đã hoàn tất, quá hạn) để kiểm soát tổng nợ nhanh chóng.*

`gherkin
Scenario: Lọc danh sách khoản nợ theo trạng thái "Quá hạn"
- Given tôi đang ở màn hình Danh sách sổ nợ
- When tôi chọn tab/bộ lọc "Quá hạn"
- Then hệ thống chỉ hiển thị các khoản nợ có ngày hẹn trả trước ngày hiện tại và chưa được hoàn tất
- And tổng số tiền nợ quá hạn được tính toán và hiển thị ở phần tổng quan
Scenario: Hiển thị trạng thái trống khi không có khoản nợ phù hợp
- Given tôi đang ở màn hình Danh sách sổ nợ
- When tôi chọn bộ lọc "Đã hoàn tất" nhưng chưa có khoản nợ nào được tất toán
- Then hệ thống hiển thị thông báo "Chưa có khoản nợ nào hoàn tất"
`

---

## 📌 US5.4: Thông báo nhắc hẹn trả/thu hồi nợ
> **User Story:** *Là một người dùng, tôi muốn nhận thông báo nhắc nhở khi đến ngày hẹn trả/đòi nợ để tránh việc trễ hạn hoặc quên đối soát công nợ.*

`gherkin
Scenario: Hệ thống gửi thông báo khi đến ngày hẹn trả/thu nợ
- Given có một khoản nợ có ngày hẹn trả trùng với ngày hiện tại và trạng thái là "Chưa thanh toán"
- When hệ thống đến thời gian quét nhắc nhở định kỳ trong ngày
- Then hệ thống gửi thông báo nhắc nhở đến thiết bị: "Hôm nay là ngày hẹn thu hồi/trả nợ khoản vay của [Tên người vay/cho vay]"
- And thông báo được lưu vào trung tâm thông báo của ứng dụng
Scenario: Chuyển hướng đến chi tiết khoản nợ từ thông báo
- Given tôi nhận được thông báo nhắc nợ trên thanh thông báo của thiết bị
- When tôi nhấn vào thông báo đó
- Then ứng dụng mở ra và chuyển trực tiếp đến màn hình chi tiết của khoản nợ cần thanh toán
`

---
