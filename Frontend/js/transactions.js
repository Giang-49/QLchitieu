const editor = $("transaction-editor");
const form = $("transaction-form");
const fields = form.elements;
const deleteDialog = $("delete-dialog");
const receiptDialog = $("receipt-dialog");
let categories = [];
let wallets = [];
let transactions = [];
let currentPage = 1;
let requestNumber = 0;
let editing;
let pendingDelete;
let receiptVersion = 0;
let receiptObjectUrl;

function filters() {
  return {
    search: $("filter-search").value.trim(),
    type: $("filter-type").value,
    category_id: $("filter-category").value,
    wallet_id: $("filter-wallet").value,
    ...($("filter-month").value ? monthRange($("filter-month").value) : {}),
  };
}

function storedReceipt(value) {
  return (
    typeof value === "string" &&
    /^\/api\/v1\/transactions\/receipts\/[0-9a-f-]{36}\.(?:png|jpg|webp)$/i.test(value)
  );
}

function receiptLink(value) {
  if (storedReceipt(value)) {
    return (
      '<button class="text-button" type="button" data-receipt="' +
      esc(value) +
      '">Xem hóa đơn ↗</button>'
    );
  }
  try {
    const url = new URL(value);
    if (["https:", "http:"].includes(url.protocol)) {
      return (
        '<a class="text-link" href="' +
        esc(url.href) +
        '" target="_blank" rel="noopener noreferrer">Hóa đơn ↗</a>'
      );
    }
  } catch {}
  return "";
}

function transactionTable(items) {
  return (
    '<table><thead><tr><th>Giao dịch</th><th>Ví</th><th>Ngày</th><th class="amount">Số tiền</th><th>Thao tác</th></tr></thead><tbody>' +
    items
      .map(
        (item) =>
          "<tr><td><strong>" +
          esc(item.category?.name) +
          "</strong><small>" +
          esc(item.note) +
          "</small>" +
          receiptLink(item.image_url) +
          "</td><td>" +
          esc(item.wallet?.name) +
          "</td><td>" +
          dateLabel(item.transaction_date) +
          '</td><td class="amount ' +
          item.type +
          '">' +
          (item.type === "income" ? "+" : "−") +
          money(item.amount) +
          '</td><td><div class="row-actions">' +
          '<button class="text-button" data-edit="' +
          esc(item.id) +
          '">Sửa</button>' +
          '<button class="text-button expense" data-delete="' +
          esc(item.id) +
          '">Xóa</button></div></td></tr>',
      )
      .join("") +
    "</tbody></table>"
  );
}

async function loadTransactions() {
  const current = ++requestNumber;
  $("transaction-list").innerHTML = empty("Đang tải giao dịch…");
  $("pagination").replaceChildren();
  try {
    const { data, meta } = await API.get("/transactions", {
      ...filters(),
      page: currentPage,
      limit: 12,
    });
    if (current !== requestNumber) return;
    const pages = Math.max(1, meta.totalPages);
    if (currentPage > pages) {
      currentPage = pages;
      return loadTransactions();
    }
    transactions = data;
    $("transaction-list").innerHTML = data.length
      ? transactionTable(data)
      : empty(
          $("filter-category").value
            ? "Chưa có giao dịch nào trong danh mục này."
            : "Chưa có giao dịch phù hợp.",
        );
    $("pagination").innerHTML =
      "<span>" +
      meta.totalItems +
      " giao dịch · Trang " +
      currentPage +
      "/" +
      pages +
      "</span>" +
      '<div class="row-actions"><button class="button secondary" id="prev-page"' +
      (currentPage <= 1 ? " disabled" : "") +
      '>← Trước</button><button class="button secondary" id="next-page"' +
      (currentPage >= pages ? " disabled" : "") +
      ">Sau →</button></div>";
    $("prev-page").onclick = () => {
      currentPage--;
      loadTransactions();
    };
    $("next-page").onclick = () => {
      currentPage++;
      loadTransactions();
    };
  } catch (error) {
    if (current === requestNumber)
      $("transaction-list").innerHTML = empty(error.message);
  }
}

function renderCategories(selected) {
  const available = categories.filter(
    (category) => category.type === fields.type.value,
  );
  if (
    editing &&
    editing.category_id === selected &&
    !available.some((category) => category.id === selected) &&
    editing.type === fields.type.value
  ) {
    available.push({ id: selected, name: editing.category.name + " (đã ẩn)" });
  }
  fields.category_id.innerHTML =
    '<option value="">Chọn danh mục</option>' + options(available, selected);
}

function openEditor(item) {
  editing = item;
  form.reset();
  $("editor-title").textContent = item ? "Sửa giao dịch" : "Giao dịch mới";
  $("editor-error").hidden = true;
  fields.type.value = item?.type || "expense";
  fields.amount.value = item?.amount ?? "";
  fields.wallet_id.innerHTML =
    '<option value="">Chọn ví</option>' + options(wallets, item?.wallet_id);
  fields.transaction_date.value = item
    ? item.transaction_date.slice(0, 10)
    : today();
  fields.note.value = item?.note || "";
  fields.image_url.value = storedReceipt(item?.image_url)
    ? ""
    : item?.image_url || "";
  $("remove-receipt-option").hidden = !item?.image_url;
  renderCategories(item?.category_id);
  editor.showModal();
}

async function loadOptions() {
  const [{ data: tree }, { data: walletData }] = await Promise.all([
    API.get("/categories"),
    API.get("/wallets"),
  ]);
  categories = flattenCategories(tree);
  wallets = walletData.wallets;
  $("filter-category").innerHTML =
    '<option value="">Tất cả</option>' + options(categories);
  $("filter-wallet").innerHTML =
    '<option value="">Tất cả</option>' + options(wallets);
}

$("new-transaction").onclick = () => openEditor();
$("close-editor").onclick = () => editor.close();
editor.addEventListener("cancel", (event) => {
  if ($("save-transaction").disabled) event.preventDefault();
});
fields.type.onchange = () => renderCategories();
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if ($("save-transaction").disabled) return;
  const data = Object.fromEntries(new FormData(form));
  const receipt = data.receipt;
  const hasReceipt = receipt?.size > 0;
  const removeReceipt = data.remove_receipt === "on";
  delete data.receipt;
  delete data.remove_receipt;
  const image = data.image_url.trim();
  const errorLabel = $("editor-error");
  errorLabel.hidden = true;
  if (
    hasReceipt &&
    (receipt.size > 5 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(receipt.type))
  ) {
    errorLabel.textContent =
      "Chọn ảnh PNG, JPEG hoặc WebP có dung lượng tối đa 5 MB.";
    errorLabel.hidden = false;
    return;
  }
  if (!hasReceipt && image && !/^https?:\/\//i.test(image)) {
    errorLabel.textContent =
      "Liên kết hóa đơn phải bắt đầu bằng https:// hoặc http://.";
    errorLabel.hidden = false;
    return;
  }
  const body = {
    ...data,
    amount: Number(data.amount),
    wallet_id: Number(data.wallet_id),
    category_id: Number(data.category_id),
    note: data.note.trim(),
  };
  delete body.image_url;
  if (!hasReceipt) {
    if (removeReceipt) body.image_url = null;
    else if (image) body.image_url = image;
    else if (editing?.image_url && !storedReceipt(editing.image_url))
      body.image_url = null;
  }
  if (
    editing &&
    data.transaction_date === editing.transaction_date.slice(0, 10)
  ) {
    body.transaction_date = editing.transaction_date;
  }
  $("save-transaction").disabled = true;
  $("close-editor").disabled = true;
  try {
    let payload = body;
    if (hasReceipt) {
      payload = new FormData();
      for (const [key, value] of Object.entries(body))
        payload.append(key, String(value));
      payload.append("receipt", receipt);
    }
    const result = editing
      ? await API.put("/transactions/" + editing.id, payload)
      : await API.post("/transactions", payload);
    editor.close();
    announceRecordChange();
    if (
      !showBudgetAlert(result.data?.budget_alerts ?? result.data?.budget_alert)
    )
      notice(result.message);
    currentPage = 1;
    loadTransactions();
  } catch (error) {
    errorLabel.textContent = error.message;
    errorLabel.hidden = false;
  } finally {
    $("save-transaction").disabled = false;
    $("close-editor").disabled = false;
  }
});

async function showReceipt(path) {
  if (!storedReceipt(path)) return;
  const version = ++receiptVersion;
  const content = $("receipt-content");
  content.textContent = "Đang tải ảnh…";
  receiptDialog.showModal();
  try {
    const blob = await API.request(path.slice("/api/v1".length), {
      binary: true,
    });
    if (version !== receiptVersion || !receiptDialog.open) return;
    receiptObjectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.src = receiptObjectUrl;
    image.alt = "Ảnh hóa đơn của giao dịch";
    image.className = "receipt-preview";
    content.replaceChildren(image);
  } catch (error) {
    if (version === receiptVersion) content.textContent = error.message;
  }
}

$("close-receipt").onclick = () => receiptDialog.close();
receiptDialog.addEventListener("close", () => {
  ++receiptVersion;
  if (receiptObjectUrl) URL.revokeObjectURL(receiptObjectUrl);
  receiptObjectUrl = undefined;
});

$("transaction-list").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button?.dataset.receipt) showReceipt(button.dataset.receipt);
  if (button?.dataset.edit) {
    const item = transactions.find(
      (item) => item.id === Number(button.dataset.edit),
    );
    if (item) openEditor(item);
  }
  if (button?.dataset.delete) {
    pendingDelete = button.dataset.delete;
    deleteDialog.returnValue = "";
    deleteDialog.showModal();
  }
});
deleteDialog.addEventListener("close", async () => {
  if (deleteDialog.returnValue !== "delete") return;
  try {
    await API.remove("/transactions/" + pendingDelete);
    announceRecordChange();
    notice("Đã xóa giao dịch và cập nhật số dư ví.");
    loadTransactions();
  } catch (error) {
    notice(error.message, "error");
  }
});

const resetPage = () => {
  currentPage = 1;
  loadTransactions();
};
let searchTimer;
$("filter-search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(resetPage, 250);
});
for (const id of [
  "filter-type",
  "filter-month",
  "filter-category",
  "filter-wallet",
])
  $(id).onchange = resetPage;
$("filters").addEventListener("submit", (event) => {
  event.preventDefault();
  resetPage();
});
$("clear-filters").onclick = () => {
  $("filters").reset();
  resetPage();
};
$("export-transaction").onclick = async () => {
  try {
    download(await API.downloadExcel(filters()), "so-chi-giao-dich.xlsx");
  } catch (error) {
    notice(error.message, "error");
  }
};

if (API.isAuthenticated()) {
  $("new-transaction").disabled = true;
  loadTransactions();
  loadOptions()
    .then(() => {
      $("new-transaction").disabled = false;
      if (location.hash === "#new") {
        history.replaceState(null, "", location.pathname + location.search);
        openEditor();
      }
    })
    .catch((error) => notice(error.message, "error"));
}
refreshOnRecordChange(() => {
  if (API.isAuthenticated() && !editor.open) loadTransactions();
});
