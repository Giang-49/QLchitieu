const sections = {
  budgets: [
    "Ngân sách",
    "Đặt hạn mức cho từng danh mục chi theo tháng.",
    "＋ Đặt hạn mức",
  ],
  categories: [
    "Danh mục",
    "Sắp xếp khoản thu và chi theo nhóm.",
    "＋ Thêm danh mục",
  ],
  wallets: ["Ví", "Quản lý các nguồn tiền và số dư.", "＋ Thêm ví"],
  debts: [
    "Sổ nợ",
    "Theo dõi khoản vay, khoản cho vay và lịch sử thanh toán.",
    "＋ Ghi khoản nợ",
  ],
  notifications: [
    "Thông báo",
    "Cảnh báo ngân sách và nhắc các khoản nợ đến hạn.",
  ],
};
const params = new URLSearchParams(location.search);
const requested = params.get("tab");
const section = Object.hasOwn(sections, requested) ? requested : "budgets";
const [title, description, action] = sections[section];
const dialog = $("manage-dialog");
const form = $("manage-form");
const container = $("manage-content");
const filtersArea = $("manage-filters");
const debtStatuses = {
  unpaid: "Chưa thanh toán",
  partial: "Trả một phần",
  overdue: "Quá hạn",
  completed: "Đã hoàn tất",
};
const walletTypes =
  '<option value="cash">Tiền mặt</option><option value="bank">Ngân hàng</option><option value="ewallet">Ví điện tử</option>';
let items = [];
let categories = [];
let wallets = [];
let formAction;
let loadVersion = 0;
let debtFilter = "";

$("section-title").textContent = title;
$("section-description").textContent = description;
document.title = title + " · SmartMoney";
if (action) {
  $("new-item").textContent = action;
  $("new-item").hidden = false;
  $("new-item").disabled = true;
}
if (section === "budgets") {
  filtersArea.innerHTML =
    '<label>Tháng<input id="budget-month" type="month" min="2000-01" max="9998-12" required></label>';
  $("budget-month").value = today().slice(0, 7);
  $("budget-month").onchange = () => {
    if ($("budget-month").validity.valid) load();
  };
}
if (section === "debts") {
  filtersArea.innerHTML =
    '<div class="segmented-control" role="group" aria-label="Lọc trạng thái khoản nợ">' +
    '<button type="button" data-state="" aria-pressed="true">Tất cả</button>' +
    '<button type="button" data-state="open" aria-pressed="false">Chưa tất toán</button>' +
    '<button type="button" data-state="overdue" aria-pressed="false">Quá hạn</button>' +
    '<button type="button" data-state="completed" aria-pressed="false">Đã hoàn tất</button></div>';
  filtersArea.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-state]");
    if (!target) return;
    debtFilter = target.dataset.state;
    for (const tab of filtersArea.querySelectorAll("button[data-state]")) {
      tab.setAttribute("aria-pressed", String(tab === target));
    }
    render();
  });
}

const amountField = (label, value = "", min = 0.01, max = 9999999999999.99) =>
  "<label>" +
  label +
  '<input name="amount" type="number" inputmode="decimal" step="0.01" min="' +
  min +
  '" max="' +
  max +
  '" value="' +
  esc(value) +
  '" required></label>';
const textField = (label, name, value = "", max = 100) =>
  "<label>" +
  label +
  '<input name="' +
  name +
  '" value="' +
  esc(value) +
  '" maxlength="' +
  max +
  '" required></label>';
const noteField =
  '<label class="full">Ghi chú<textarea name="note" rows="2" maxlength="255"></textarea></label>';
const selectField = (label, name, choices, selected) =>
  "<label>" +
  label +
  '<select name="' +
  name +
  '" required><option value="">Chọn ' +
  label.toLowerCase() +
  "</option>" +
  options(choices, selected) +
  "</select></label>";
const rowButton = (action, label, id) =>
  '<button class="text-button" data-action="' +
  action +
  '" data-id="' +
  esc(id) +
  '">' +
  label +
  "</button>";

function itemRow(heading, detail, right, id = "") {
  return (
    '<div class="item-row"' +
    (id ? ' id="item-' + esc(id) + '"' : "") +
    "><div>" +
    "<strong>" +
    heading +
    "</strong><small>" +
    detail +
    "</small></div>" +
    right +
    "</div>"
  );
}

function render() {
  if (section === "budgets") {
    container.innerHTML =
      items
        .map(
          (item) =>
            '<div class="budget-item">' +
            itemRow(
              esc(item.category?.name || "Danh mục đã ẩn"),
              money(item.spent) + " / " + money(item.amount),
              '<div class="row-actions"><strong>' +
                numeric.format(item.percentage) +
                "%</strong>" +
                rowButton("edit", "Sửa", item.id) +
                rowButton("delete", "Xóa", item.id) +
                "</div>",
              item.id,
            ) +
            '<div class="progress"><i class="' +
            item.status +
            '" style="width:' +
            Math.min(100, item.percentage) +
            '%"></i></div></div>',
        )
        .join("") || empty("Chưa có hạn mức trong tháng này.");
  }
  if (section === "categories") {
    container.innerHTML =
      items
        .map((item) =>
          itemRow(
            "　".repeat(item.depth) +
              (item.depth ? "↳ " : "") +
              esc(item.icon || "") +
              " " +
              esc(item.name),
            item.type === "expense" ? "Chi tiêu" : "Thu nhập",
            '<div class="row-actions">' +
              rowButton("edit", "Sửa", item.id) +
              rowButton("delete", "Ẩn", item.id) +
              "</div>",
          ),
        )
        .join("") || empty("Chưa có danh mục.");
  }
  if (section === "wallets") {
    const labels = {
      cash: "Tiền mặt",
      bank: "Ngân hàng",
      ewallet: "Ví điện tử",
    };
    container.innerHTML =
      items
        .map((item) =>
          itemRow(
            esc(item.name),
            labels[item.type] || esc(item.type),
            '<div class="row-actions"><strong>' +
              (item.currency === "VND"
                ? money(item.balance)
                : numeric.format(item.balance) + " " + esc(item.currency)) +
              "</strong>" +
              rowButton("edit", "Sửa", item.id) +
              rowButton("delete", "Xóa", item.id) +
              "</div>",
          ),
        )
        .join("") || empty("Chưa có ví.");
  }
  if (section === "debts") {
    const rows = items.filter(
      (item) =>
        !debtFilter ||
        (debtFilter === "open"
          ? ["unpaid", "partial"].includes(item.status)
          : item.status === debtFilter),
    );
    container.innerHTML =
      rows
        .map((item) =>
          itemRow(
            esc(item.person_name),
            (item.type === "lend" ? "Cho vay" : "Đi vay") +
              " · Hạn " +
              dateLabel(item.due_date) +
              " · Gốc " +
              money(item.amount),
            '<div class="row-actions"><span class="status ' +
              item.status +
              '">' +
              debtStatuses[item.status] +
              "</span>" +
              "<strong>" +
              money(item.remaining) +
              "</strong>" +
              rowButton("detail", "Chi tiết", item.id) +
              (item.status === "completed"
                ? ""
                : rowButton("pay", "Thanh toán", item.id)) +
              "</div>",
            item.id,
          ),
        )
        .join("") || empty("Chưa có khoản nợ phù hợp.");
  }
  if (section === "notifications") {
    container.innerHTML =
      items
        .map((item) => {
          const path = item.type.startsWith("debt_") ? "debts" : "budgets";
          return itemRow(
            esc(item.title),
            esc(item.message),
            '<a class="text-link" href="manage.html?tab=' +
              path +
              "&id=" +
              esc(item.target_id) +
              '">Chi tiết →</a>',
          );
        })
        .join("") || empty("Chưa có thông báo.");
  }
}

function openForm(heading, fields, handler, label = "Lưu") {
  $("manage-dialog-title").textContent = heading;
  $("manage-fields").innerHTML = fields;
  $("manage-error").hidden = true;
  $("manage-save").hidden = !handler;
  $("manage-save").textContent = label;
  $("manage-save").className =
    "button " + (label === "Xóa" ? "danger" : "primary");
  formAction = handler;
  if (!dialog.open) dialog.showModal();
}

function edit(item) {
  if (section === "budgets") {
    const [year, month] = $("budget-month").value.split("-").map(Number);
    const available = categories.filter(
      (category) => category.type === "expense",
    );
    openForm(
      item ? "Sửa hạn mức" : "Đặt hạn mức",
      '<p class="full muted">Tháng ' +
        month +
        " / " +
        year +
        "</p>" +
        (item
          ? "<p>" + esc(item.category?.name || "Danh mục đã ẩn") + "</p>"
          : selectField("Danh mục", "category_id", available)) +
        amountField("Hạn mức (₫)", item?.amount),
      (data) =>
        item
          ? API.put("/budgets/" + item.id, { amount: Number(data.amount) })
          : API.post("/budgets", {
              year,
              month,
              category_id: Number(data.category_id),
              amount: Number(data.amount),
            }),
    );
  }
  if (section === "categories") {
    const candidates = categories.filter(
      (category) => category.id !== item?.id,
    );
    const color = /^#[a-f\d]{6}$/i.test(item?.color || "")
      ? item.color
      : "#196d57";
    openForm(
      item ? "Sửa danh mục" : "Thêm danh mục",
      textField("Tên danh mục", "name", item?.name) +
        '<label>Loại<select name="type">' +
        '<option value="expense">Chi tiêu</option><option value="income">Thu nhập</option></select></label>' +
        '<label>Nhóm cha<select name="parent_id"></select></label>' +
        '<label>Màu<input type="color" name="color" value="' +
        color +
        '"></label>' +
        '<label>Biểu tượng<input name="icon" maxlength="50" placeholder="Ví dụ 🍜" value="' +
        esc(item?.icon) +
        '"></label>',
      (data) => {
        const body = {
          ...data,
          name: data.name.trim(),
          icon: data.icon.trim(),
          parent_id: data.parent_id ? Number(data.parent_id) : null,
        };
        return item
          ? API.put("/categories/" + item.id, body)
          : API.post("/categories", body);
      },
    );
    const type = form.elements.type;
    type.value = item?.type || "expense";
    if (item) type.disabled = true;
    const updateParents = () => {
      form.elements.parent_id.innerHTML =
        '<option value="">Không có</option>' +
        options(
          candidates.filter((category) => category.type === type.value),
          item?.parent_id,
        );
    };
    type.onchange = updateParents;
    updateParents();
  }
  if (section === "wallets") {
    openForm(
      item ? "Sửa ví" : "Thêm ví",
      textField("Tên ví", "name", item?.name) +
        '<label>Loại<select name="type">' +
        walletTypes +
        "</select></label>" +
        (item ? "" : amountField("Số dư ban đầu (₫)", 0, 0)),
      (data) =>
        item
          ? API.put("/wallets/" + item.id, {
              name: data.name.trim(),
              type: data.type,
            })
          : API.post("/wallets", {
              name: data.name.trim(),
              type: data.type,
              balance: Number(data.amount),
              currency: "VND",
            }),
    );
    form.elements.type.value = item?.type || "cash";
  }
  if (section === "debts") {
    openForm(
      "Ghi khoản nợ",
      '<label>Loại<select name="type"><option value="borrow">Đi vay</option><option value="lend">Cho vay</option></select></label>' +
        textField("Người liên quan", "person_name") +
        amountField("Số tiền (₫)") +
        selectField("Ví", "wallet_id", wallets) +
        '<label>Hạn trả<input name="due_date" type="date" required></label>' +
        noteField,
      (data) =>
        API.post("/debts", {
          ...data,
          amount: Number(data.amount),
          wallet_id: Number(data.wallet_id),
        }),
    );
  }
}

function remove(item) {
  if (section === "categories") {
    openForm(
      "Ẩn danh mục " + item.name,
      '<p class="full">Chọn danh mục thay thế nếu mục này đã có giao dịch.</p>' +
        '<label class="full">Danh mục thay thế<select name="replace_id"><option value="">Không chọn</option>' +
        options(
          categories.filter(
            (category) =>
              category.id !== item.id && category.type === item.type,
          ),
        ) +
        "</select></label>",
      (data) => API.remove("/categories/" + item.id, data),
      "Ẩn danh mục",
    );
    return;
  }
  const label = section === "wallets" ? "ví" : "hạn mức";
  openForm(
    "Xóa " + label + "?",
    '<p class="full">' + esc(item.name || item.category.name) + "</p>",
    () => API.remove("/" + section + "/" + item.id),
    "Xóa",
  );
}

async function showDebt(id) {
  try {
    const { data } = await API.get("/debts/" + id);
    openForm(
      data.person_name,
      '<p class="full">Còn lại <strong>' +
        money(data.remaining) +
        "</strong> · " +
        debtStatuses[data.status] +
        '</p><p class="full">Hạn trả ' +
        dateLabel(data.due_date) +
        "</p>" +
        (data.note ? '<p class="full">' + esc(data.note) + "</p>" : "") +
        '<div class="full"><h2>Lịch sử thanh toán</h2>' +
        (data.payments?.length
          ? data.payments
              .map((payment) =>
                itemRow(
                  money(payment.amount),
                  dateLabel(payment.paid_at),
                  "<span>" + esc(payment.note) + "</span>",
                ),
              )
              .join("")
          : empty("Chưa ghi nhận thanh toán.")) +
        "</div>",
    );
  } catch (error) {
    notice(error.message, "error");
  }
}

async function load() {
  const version = ++loadVersion;
  try {
    const [year, month] = ($("budget-month")?.value || today().slice(0, 7))
      .split("-")
      .map(Number);
    const filters = section === "budgets" ? { year, month } : undefined;
    const { data } = await API.get("/" + section, filters);
    if (version !== loadVersion) return;
    items =
      section === "wallets"
        ? data.wallets
        : section === "categories"
          ? flattenCategories(data)
          : data;
    if (section === "categories") categories = items;
    render();
    const requestedId = params.get("id");
    if (
      section === "debts" &&
      requestedId &&
      items.some((item) => item.id === Number(requestedId))
    ) {
      params.delete("id");
      showDebt(requestedId);
    } else if (requestedId) {
      $("item-" + requestedId)?.scrollIntoView({ block: "center" });
    }
  } catch (error) {
    if (version === loadVersion) container.innerHTML = empty(error.message);
  }
}

$("new-item").onclick = () => edit();
$("close-manage").onclick = () => dialog.close();
dialog.addEventListener("cancel", (event) => {
  if ($("manage-save").disabled) event.preventDefault();
});
container.onclick = (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = items.find((row) => row.id === Number(button.dataset.id));
  if (!item) return;
  if (button.dataset.action === "edit") edit(item);
  if (button.dataset.action === "delete") remove(item);
  if (button.dataset.action === "detail") showDebt(item.id);
  if (button.dataset.action === "pay") {
    openForm(
      "Thanh toán · " + item.person_name,
      amountField("Số tiền (₫)", item.remaining, 0.01, item.remaining) +
        selectField("Ví", "wallet_id", wallets, item.wallet_id) +
        noteField,
      (data) =>
        API.post("/debts/" + item.id + "/payments", {
          ...data,
          wallet_id: Number(data.wallet_id),
          amount: Number(data.amount),
        }),
      "Ghi thanh toán",
    );
  }
};
form.onsubmit = async (event) => {
  event.preventDefault();
  if (!formAction) return;
  const save = $("manage-save");
  if (save.disabled) return;
  const errorLabel = $("manage-error");
  errorLabel.hidden = true;
  save.disabled = true;
  $("close-manage").disabled = true;
  try {
    const data = Object.fromEntries(new FormData(form));
    if (
      (data.name !== undefined && !data.name.trim()) ||
      (data.person_name !== undefined && !data.person_name.trim())
    ) {
      throw new Error("Vui lòng nhập tên.");
    }
    await formAction(data);
    dialog.close();
    announceRecordChange();
    notice("Đã lưu thay đổi.");
    await load();
  } catch (error) {
    errorLabel.textContent = error.message;
    errorLabel.hidden = false;
  } finally {
    save.disabled = false;
    $("close-manage").disabled = false;
  }
};

async function initManage() {
  if (!API.isAuthenticated()) return;
  try {
    if (section === "budgets")
      categories = flattenCategories((await API.get("/categories")).data);
    if (section === "debts") wallets = (await API.get("/wallets")).data.wallets;
    await load();
    $("new-item").disabled = false;
  } catch (error) {
    container.innerHTML = empty(error.message);
  }
}
initManage();
refreshOnRecordChange(() => {
  if (API.isAuthenticated() && !dialog.open) load();
});
