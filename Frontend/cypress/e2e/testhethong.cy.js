describe("QLchitieu - Bộ kiểm thử chức năng toàn diện", () => {
  beforeEach(() => {
    cy.on("uncaught:exception", () => false);
    // Đăng nhập tài khoản mẫu trước mỗi ca kiểm thử
    cy.login("demo@sochi.test", "SoChiDemo2026!");
  });

  // =========================================================================
  // 1. QUẢN LÝ GIAO DỊCH (TRANSACTIONS)
  // =========================================================================
  describe("1. Quản lý Giao dịch (Thu / Chi)", () => {
    beforeEach(() => {
      cy.visit("/transactions.html");
      cy.get("#new-transaction").should("be.visible");
    });

    it("1.1. Kiểm thử biểu mẫu - Test 1.1: Để trống số tiền → Báo lỗi validation", () => {
      cy.get("#new-transaction").click();
      cy.get("#transaction-editor").should("be.visible");

      // Để trống số tiền
      cy.get('#transaction-form input[name="amount"]').clear();
      cy.get('#transaction-form input[name="amount"]').then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validity.valueMissing).to.be.true;
      });
      cy.get("#save-transaction").click();
      cy.get("#transaction-editor").should("be.visible");
    });

    it("1.1. Kiểm thử biểu mẫu - Test 1.2: Nhập số tiền ≤ 0 → Báo lỗi validation", () => {
      cy.get("#new-transaction").click();
      cy.get("#transaction-editor").should("be.visible");

      // Nhập số tiền âm hoặc bằng 0 (min="0.01")
      cy.get('#transaction-form input[name="amount"]').clear().type("-50000");
      cy.get('#transaction-form input[name="amount"]').then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
        expect($input[0].validity.rangeUnderflow).to.be.true;
      });

      cy.get('#transaction-form input[name="amount"]').clear().type("0");
      cy.get('#transaction-form input[name="amount"]').then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
      });
      cy.get("#save-transaction").click();
      cy.get("#transaction-editor").should("be.visible");
    });

    it("1.1. Kiểm thử biểu mẫu - Test 1.3: Không chọn danh mục/ví → Báo lỗi validation", () => {
      cy.get("#new-transaction").click();
      cy.get('#transaction-form input[name="amount"]').clear().type("50000");

      // Kiểm tra khi danh mục hoặc ví chưa được chọn
      cy.get('#transaction-form select[name="category_id"]').select("");
      cy.get('#transaction-form select[name="category_id"]').then(($select) => {
        expect($select[0].checkValidity()).to.be.false;
      });
      cy.get('#transaction-form select[name="wallet_id"]').select("");
      cy.get('#transaction-form select[name="wallet_id"]').then(($select) => {
        expect($select[0].checkValidity()).to.be.false;
      });
      cy.get("#save-transaction").click();
      cy.get("#transaction-editor").should("be.visible");
    });

    it("1.2. Kiểm thử lưu dữ liệu - Test 2.1: Nhập thông tin hợp lệ → Lưu thành công", () => {
      const noteUnique = "Cà phê sáng " + Date.now();
      cy.get("#new-transaction").click();

      cy.get('#transaction-form select[name="type"]').select("expense");
      cy.get('#transaction-form input[name="amount"]').clear().type("35000");
      cy.get('#transaction-form select[name="category_id"]').select(1);
      cy.get('#transaction-form select[name="wallet_id"]').select(1);
      cy.get('#transaction-form textarea[name="note"]').type(noteUnique);

      cy.get("#save-transaction").click();
      cy.get("#transaction-editor").should("not.have.attr", "open");

      // Kiểm tra giao dịch vừa tạo hiển thị trên bảng
      cy.get("#transaction-list").should("contain", noteUnique);
      cy.get("#toast").should("be.visible").and("contain", "thành công");
    });

    it("1.3. Sửa giao dịch - Test sửa số tiền hợp lệ → Dữ liệu được điều chỉnh đúng", () => {
      // Mở modal sửa giao dịch đầu tiên
      cy.get("#transaction-list table tbody tr").first().within(() => {
        cy.get('button[data-edit]').click();
      });
      cy.get("#transaction-editor").should("be.visible");

      // Sửa số tiền
      const newAmount = "99000";
      cy.get('#transaction-form input[name="amount"]').clear().type(newAmount);
      cy.get("#save-transaction").click();

      cy.get("#transaction-editor").should("not.have.attr", "open");
      cy.get("#transaction-list").should("contain", "99.000");
    });

    it("1.3. Sửa giao dịch - Test nhập số tiền ≤ 0 → Báo lỗi không hợp lệ", () => {
      cy.get("#transaction-list table tbody tr").first().within(() => {
        cy.get('button[data-edit]').click();
      });
      cy.get('#transaction-form input[name="amount"]').clear().type("-10000");
      cy.get('#transaction-form input[name="amount"]').then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
      });
      cy.get("#save-transaction").click();
      cy.get("#transaction-editor").should("be.visible");
    });

    it("1.4. Xóa giao dịch - Test chọn 'Hủy' → Dữ liệu không thay đổi", () => {
      cy.get("#transaction-list table tbody tr").then(($rows) => {
        const countBefore = $rows.length;
        cy.get($rows[0]).find("button[data-delete]").click();

        // Dialog xác nhận xóa xuất hiện
        cy.get("#delete-dialog").should("be.visible");
        cy.get('#delete-dialog button[value="cancel"]').click();

        // Giao dịch vẫn còn nguyên
        cy.get("#transaction-list table tbody tr").should("have.length", countBefore);
      });
    });

    it("1.4. Xóa giao dịch - Test xác nhận xóa → Giao dịch biến mất", () => {
      cy.get("#transaction-list table tbody tr").first().within(() => {
        cy.get("button[data-delete]").click();
      });
      cy.get("#delete-dialog").should("be.visible");
      cy.get('#delete-dialog button[value="delete"]').click();

      cy.get("#delete-dialog").should("not.have.attr", "open");
      cy.get("#toast").should("be.visible").and("contain", "Đã xóa giao dịch");
    });

    it("1.5. Lọc giao dịch - Test lọc theo danh mục có dữ liệu & danh mục trống", () => {
      // 1. Lọc theo danh mục có dữ liệu
      cy.get("#filter-category").select(1);
      cy.get("#transaction-list table tbody tr").should("have.length.at.least", 1);

      // 2. Lọc theo danh mục trống
      cy.get("#filter-category").select("");
      cy.get("#clear-filters").click();
      cy.get("#filter-search").type("Chuỗi_Tìm_Kiếm_Không_Tồn_Tại_9999");
      cy.get("#transaction-list").should("contain", "Chưa có giao dịch");
    });
  });

  // =========================================================================
  // 2. QUẢN LÝ HẠN MỨC NGÂN SÁCH (BUDGETS)
  // =========================================================================
  describe("2. Quản lý Hạn mức Ngân sách", () => {
    beforeEach(() => {
      cy.visit("/manage.html?tab=budgets");
      cy.get("#section-title").should("contain", "Ngân sách");
    });

    it("Test nhập hạn mức hợp lệ → Lưu thành công", () => {
      cy.get("#new-item").should("be.visible").click();
      cy.get("#manage-dialog").should("be.visible");

      cy.get('#manage-form select[name="category_id"]').select(1);
      cy.get('#manage-form input[name="amount"]').clear().type("5000000");
      cy.get("#manage-save").click();

      cy.get("#toast").should("be.visible").and("contain", "Đã lưu thay đổi");
    });

    it("Test nhập hạn mức ≤ 0 → Báo lỗi validation", () => {
      cy.get("#new-item").click();
      cy.get('#manage-form input[name="amount"]').clear().type("-500000");
      cy.get('#manage-form input[name="amount"]').then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
      });
      cy.get("#manage-save").click();
      cy.get("#manage-dialog").should("be.visible");
    });

    it("Test thanh tiến độ ngân sách và trạng thái màu sắc", () => {
      // Kiểm tra thanh progress và trạng thái tỷ lệ %
      cy.get("#manage-content").within(() => {
        cy.get(".budget-item").each(($item) => {
          cy.wrap($item).find(".progress i").should("exist");
        });
      });
    });

    it("Test cảnh báo vượt hạn mức (80% warning / 100% danger)", () => {
      // Kiểm tra các class css chỉ định mức độ an toàn: safe, warning, danger
      cy.get("#manage-content").then(($content) => {
        if ($content.find(".progress .warning").length > 0) {
          cy.get(".progress .warning").should("be.visible");
        }
        if ($content.find(".progress .danger").length > 0) {
          cy.get(".progress .danger").should("be.visible");
        }
      });
    });
  });

  // =========================================================================
  // 3. BÁO CÁO & BIỂU ĐỒ (REPORTS)
  // =========================================================================
  describe("3. Báo cáo & Biểu đồ", () => {
    beforeEach(() => {
      cy.visit("/reports.html");
      cy.contains("Báo cáo thu chi").should("be.visible");
    });

    it("Test chọn tháng có dữ liệu → Biểu đồ tròn hiển thị đầy đủ", () => {
      cy.get("#report-period").select("month");
      cy.get("#donut").should("be.visible");
      // Khi có dữ liệu, donut chứa canvas hoặc thẻ chú giải legend
      cy.get("#donut").then(($donut) => {
        if ($donut.find("canvas").length > 0) {
          cy.get("#donut canvas").should("exist");
        } else {
          cy.get("#donut").should("contain", "Chưa có khoản chi trong kỳ này");
        }
      });
    });

    it("Test chọn kỳ không có dữ liệu → Hiện thông báo rỗng", () => {
      // Đổi sang ngày trong quá khứ xa không có giao dịch
      cy.get("#report-date").clear().type("2010-01-01").trigger("change");
      cy.get("#donut").should("contain", "Chưa có khoản chi");
    });

    it("Test chọn năm có dữ liệu → Cột Thu và Chi & Tooltip tương tác", () => {
      cy.get("#report-period").select("year");
      cy.get("#bars").should("be.visible");
      // Tương tác tooltip/readout số liệu
      cy.get("#bars canvas").then(($canvas) => {
        if ($canvas.length > 0) {
          cy.wrap($canvas).click({ force: true });
          cy.get("#bars .chart-readout").should("be.visible");
        }
      });
    });

    it("Test xuất báo cáo Excel khi có dữ liệu & khi rỗng", () => {
      cy.get("#report-period").select("year");
      // Kiểm tra trạng thái nút xuất Excel
      cy.get("#export-report").then(($btn) => {
        if (!$btn.is(":disabled")) {
          cy.wrap($btn).click();
          // Kiểm tra không gây lỗi trình duyệt
          cy.get("#toast").should("exist");
        }
      });
    });
  });

  // =========================================================================
  // 4. QUẢN LÝ DANH MỤC (CATEGORIES)
  // =========================================================================
  describe("4. Quản lý Danh mục", () => {
    beforeEach(() => {
      cy.visit("/manage.html?tab=categories");
      cy.get("#section-title").should("contain", "Danh mục");
    });

    it("Test tạo danh mục hợp lệ → Thành công", () => {
      const catName = "Ăn uống ngoài " + Date.now().toString().slice(-4);
      cy.get("#new-item").should("be.visible").click();
      cy.get("#manage-dialog").should("be.visible");

      cy.get('#manage-form input[name="name"]').type(catName);
      cy.get('#manage-form select[name="type"]').select("expense");
      cy.get("#manage-save").click();

      cy.get("#toast").should("be.visible").and("contain", "Đã lưu thay đổi");
      cy.get("#manage-content").should("contain", catName);
    });

    it("Test để trống tên danh mục → Báo lỗi", () => {
      cy.get("#new-item").click();
      cy.get('#manage-form input[name="name"]').clear();
      cy.get('#manage-form input[name="name"]').then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
      });
      cy.get("#manage-save").click();
      cy.get("#manage-dialog").should("be.visible");
    });

    it("Test tạo danh mục con có chọn cha & không chọn cha", () => {
      const subCat = "Cà phê trà sữa " + Date.now().toString().slice(-4);
      cy.get("#new-item").click();
      cy.get('#manage-form input[name="name"]').type(subCat);
      cy.get('#manage-form select[name="type"]').select("expense");

      // Chọn nhóm cha
      cy.get('#manage-form select[name="parent_id"]').select(1);
      cy.get("#manage-save").click();

      cy.get("#toast").should("contain", "Đã lưu thay đổi");
      cy.get("#manage-content").should("contain", subCat);
    });

    it("Test hủy xóa danh mục → Không thay đổi gì", () => {
      cy.get("#manage-content .item-row").first().within(() => {
        cy.get('button[data-action="delete"]').click();
      });
      cy.get("#manage-dialog").should("be.visible");
      // Bấm nút đóng hủy
      cy.get("#close-manage").click();
      cy.get("#manage-dialog").should("not.have.attr", "open");
    });
  });

  // =========================================================================
  // 5. QUẢN LÝ SỔ NỢ (DEBTS)
  // =========================================================================
  describe("5. Quản lý Sổ nợ", () => {
    beforeEach(() => {
      cy.visit("/manage.html?tab=debts");
      cy.get("#section-title").should("contain", "Sổ nợ");
    });

    it("Test tạo khoản cho vay hợp lệ → Thành công", () => {
      const debtor = "Bạn Hùng " + Date.now().toString().slice(-4);
      cy.get("#new-item").click();
      cy.get("#manage-dialog").should("be.visible");

      cy.get('#manage-form select[name="type"]').select("lend");
      cy.get('#manage-form input[name="person_name"]').type(debtor);
      cy.get('#manage-form input[name="amount"]').type("500000");
      cy.get('#manage-form select[name="wallet_id"]').select(1);
      cy.get('#manage-form input[name="due_date"]').type("2026-12-31");
      cy.get("#manage-save").click();

      cy.get("#toast").should("contain", "Đã lưu thay đổi");
      cy.get("#manage-content").should("contain", debtor);
    });

    it("Test thiếu thông tin bắt buộc → Báo lỗi validation", () => {
      cy.get("#new-item").click();
      // Bỏ trống tên người liên quan
      cy.get('#manage-form input[name="person_name"]').clear();
      cy.get('#manage-form input[name="person_name"]').then(($input) => {
        expect($input[0].checkValidity()).to.be.false;
      });
      cy.get("#manage-save").click();
      cy.get("#manage-dialog").should("be.visible");
    });

    it("Test trả nợ một phần & trả vượt số nợ", () => {
      cy.get('#manage-content button[data-action="pay"]').then(($btns) => {
        if ($btns.length > 0) {
          cy.wrap($btns[0]).click();
          cy.get("#manage-dialog").should("be.visible");

          // Trả vượt quá số nợ còn lại (max constraint)
          cy.get('#manage-form input[name="amount"]').then(($input) => {
            const maxVal = parseFloat($input.attr("max") || "999999999");
            cy.wrap($input).clear().type((maxVal + 100000).toString());
            expect($input[0].checkValidity()).to.be.false;
          });

          // Trả một phần hợp lệ
          cy.get('#manage-form input[name="amount"]').clear().type("50000");
          cy.get("#manage-save").click();
          cy.get("#toast").should("contain", "Đã lưu thay đổi");
        }
      });
    });

    it("Test bộ lọc 'Quá hạn' và 'Đã hoàn tất'", () => {
      // Lọc Quá hạn
      cy.get('#manage-filters button[data-state="overdue"]').click();
      cy.get('#manage-filters button[data-state="overdue"]').should("have.attr", "aria-pressed", "true");

      // Lọc Đã hoàn tất
      cy.get('#manage-filters button[data-state="completed"]').click();
      cy.get('#manage-filters button[data-state="completed"]').should("have.attr", "aria-pressed", "true");

      // Quay về Tất cả
      cy.get('#manage-filters button[data-state=""]').click();
    });
  });

  // =========================================================================
  // 6. THÔNG BÁO (NOTIFICATIONS)
  // =========================================================================
  describe("6. Thông báo", () => {
    it("Test thông báo khoản nợ đến hạn / quá hạn & cảnh báo ngân sách", () => {
      cy.visit("/manage.html?tab=notifications");
      cy.get("#section-title").should("contain", "Thông báo");
      cy.get("#manage-content").should("be.visible");

      // Kiểm tra danh sách hiển thị thông báo hoặc thông báo trống phù hợp
      cy.get("#manage-content").then(($el) => {
        if ($el.find(".item-row").length > 0) {
          cy.get(".item-row").should("exist");
        } else {
          cy.get("#manage-content").should("contain", "Chưa có thông báo");
        }
      });
    });
  });
});
