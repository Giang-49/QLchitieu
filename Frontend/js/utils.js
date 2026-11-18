const $ = (id) => document.getElementById(id);
const numeric = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const money = (amount) => numeric.format(Number(amount)) + " ₫";
const dateLabel = (value) =>
  value ? String(value).slice(0, 10).split("-").reverse().join("/") : "—";
const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );
const monthRange = (period) => {
  const [year, month] = period.split("-").map(Number);
  return {
    from_date: period + "-01",
    to_date: period + "-" + new Date(Date.UTC(year, month, 0)).getUTCDate(),
  };
};
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (value) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[value],
  );

function flattenCategories(categories, depth = 0) {
  return categories.flatMap((category) => [
    { ...category, depth },
    ...flattenCategories(category.children || [], depth + 1),
  ]);
}

function options(items, selected) {
  return items
    .map((item) => {
      const prefix = item.depth ? "　".repeat(item.depth) + "↳ " : "";
      return (
        '<option value="' +
        esc(item.id) +
        '"' +
        (String(item.id) === String(selected) ? " selected" : "") +
        ">" +
        prefix +
        esc(item.name) +
        "</option>"
      );
    })
    .join("");
}

function notice(message, variant = "") {
  const alert = $("toast");
  alert.textContent = message;
  alert.dataset.variant = variant;
  alert.hidden = false;
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => {
    alert.hidden = true;
  }, 5500);
}

const refreshEventKey = "smartmoney:record-change";
function announceRecordChange() {
  localStorage.setItem(refreshEventKey, String(Date.now()));
}

function refreshOnRecordChange(refresh) {
  window.addEventListener("storage", (event) => {
    if (event.key === refreshEventKey) refresh();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) refresh();
  });
}

function empty(message) {
  return '<p class="empty">' + esc(message) + "</p>";
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showBudgetAlert(value) {
  const alerts = Array.isArray(value) ? value : value ? [value] : [];
  const messages = [];
  for (const alert of alerts) {
    const key = "sochi:alert:" + API.getUser()?.id + ":" + alert.id;
    if (localStorage.getItem(key)) continue;
    localStorage.setItem(key, "1");
    messages.push(alert.message);
  }
  if (!messages.length) return false;
  notice(messages.join("\n"), "warning");
  return true;
}

const navigation = [
  ["index", "Tổng quan", "home"],
  ["transactions", "Giao dịch", "transfer"],
  ["manage?tab=budgets", "Ngân sách", "target"],
  ["reports", "Báo cáo", "report"],
  ["manage?tab=categories", "Danh mục", "tag"],
  ["manage?tab=wallets", "Ví", "wallet"],
  ["manage?tab=debts", "Sổ nợ", "book"],
  ["manage?tab=notifications", "Thông báo", "bell"],
];

const iconPaths = {
  home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>',
  transfer: '<path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/>',
  report: '<path d="M4 20V4m0 16h17M8 16v-4m5 4V8m5 8V5"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  tag: '<path d="M3 3h7l11 11-7 7L3 10V3z"/><path d="M7 7h.01"/>',
  wallet:
    '<path d="M3 7a2 2 0 0 1 2-2h12v3M5 8h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/><path d="M21 12h-5a1.5 1.5 0 0 0 0 3h5"/>',
  book: '<path d="M5 4h14v16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M7 4v16m4-11h5m-5 4h5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0"/>',
};
function symbol(icon) {
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    iconPaths[icon] +
    "</svg>"
  );
}

function setupShell() {
  const active = document.body.dataset.page;
  const user = API.getUser();
  const shell = $("shell");
  if (!shell) return;
  if (!API.isAuthenticated()) {
    location.replace("login.html");
    return;
  }
  const params = new URLSearchParams(location.search);
  const current =
    active === "manage"
      ? "manage?tab=" + (params.get("tab") || "budgets")
      : active;
  const links = navigation.map(([key, label, icon]) => {
    const [page, query] = key.split("?");
    const href = page + ".html" + (query ? "?" + query : "");
    return (
      '<a href="' +
      href +
      '"' +
      (key === current ? ' aria-current="page"' : "") +
      ">" +
      symbol(icon) +
      label +
      (icon === "bell"
        ? '<span class="notification-indicator" id="notification-indicator" aria-hidden="true" hidden></span>'
        : "") +
      "</a>"
    );
  });

  shell.innerHTML =
    '<a class="wordmark" href="index.html"><span class="brand-mark">' +
    symbol("wallet") +
    "</span>SmartMoney</a>" +
    '<nav aria-label="Điều hướng chính">' +
    links.join("") +
    "</nav>" +
    '<div class="account"><span class="avatar">' +
    esc((user?.name || "S").trim().charAt(0).toUpperCase()) +
    "</span><div><strong>" +
    esc(user?.name || "Tài khoản") +
    '</strong><button class="text-button" id="logout">Đăng xuất</button></div></div>';
  $("logout").addEventListener("click", () => API.logout());
  const updateNotifications = async () => {
    try {
      if (!API.isAuthenticated()) return;
      const { data } = await API.get("/notifications");
      $("notification-indicator").hidden = !data.length;
    } catch {
      $("notification-indicator").hidden = true;
    }
  };
  updateNotifications();
  refreshOnRecordChange(updateNotifications);
}

setupShell();
