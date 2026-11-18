async function weeklyExpenses() {
  const date = new Date(today() + "T00:00:00Z");
  const rows = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date);
    day.setUTCDate(date.getUTCDate() - 6 + index);
    return { date: day.toISOString().slice(0, 10), income: 0, expense: 0 };
  });
  const byDay = new Map(rows.map((row) => [row.date, row]));
  const filters = {
    from_date: rows[0].date,
    to_date: rows.at(-1).date,
    type: "expense",
    limit: 100,
  };
  let page = 1;
  let totalPages;
  do {
    const { data, meta } = await API.get("/transactions", { ...filters, page });
    for (const transaction of data) {
      const row = byDay.get(transaction.transaction_date.slice(0, 10));
      if (row) row.expense += Number(transaction.amount);
    }
    totalPages = meta.totalPages;
    page++;
  } while (page <= totalPages);
  return rows;
}

async function loadDashboard() {
  if (!API.isAuthenticated()) return;
  const period = today().slice(0, 7);
  const [year, month] = period.split("-").map(Number);
  $("dashboard-period").textContent = "Tháng " + month + " / " + year;
  const jobs = [
    API.get("/wallets").then(({ data }) => {
      const localWallets = data.wallets.filter(
        (wallet) => wallet.currency === "VND",
      );
      $("balance").textContent = money(
        localWallets.reduce(
          (total, wallet) => total + Number(wallet.balance),
          0,
        ),
      );
      $("wallet-count").textContent = localWallets.length + " ví VND";
      $("wallets").innerHTML =
        data.wallets
          .map(
            (wallet) =>
              '<div class="item-row"><div><strong>' +
              esc(wallet.name) +
              "</strong><small>" +
              esc(wallet.currency) +
              "</small></div><strong>" +
              (wallet.currency === "VND"
                ? money(wallet.balance)
                : numeric.format(wallet.balance) + " " + esc(wallet.currency)) +
              "</strong></div>",
          )
          .join("") || empty("Chưa có ví.");
    }),
    monthlySeries(year, month, 6).then((rows) => {
      const current = rows.at(-1);
      $("income").textContent = money(current.income);
      $("expense").textContent = money(current.expense);
      const volume = current.income + current.expense;
      if (volume > 0) {
        $("income-ring").style.setProperty(
          "--portion",
          (current.income / volume) * 100 + "%",
        );
        $("expense-ring").style.setProperty(
          "--portion",
          (current.expense / volume) * 100 + "%",
        );
      }
      drawSeries($("overview-chart"), rows, "line");
    }),
    weeklyExpenses().then((rows) =>
      drawSeries($("weekly-chart"), rows, "daily"),
    ),
    API.get("/reports/category-pie", monthRange(period)).then(({ data }) =>
      drawDonut($("dashboard-donut"), data),
    ),
    API.get("/transactions", { limit: 6 }).then(({ data }) => {
      $("recent").innerHTML = data.length
        ? '<table><thead><tr><th>Khoản thu chi</th><th>Ngày</th><th class="amount">Số tiền</th></tr></thead><tbody>' +
          data
            .map(
              (transaction) =>
                "<tr><td><strong>" +
                esc(transaction.category.name) +
                "</strong><small>" +
                esc(transaction.note || transaction.wallet.name) +
                "</small></td><td>" +
                dateLabel(transaction.transaction_date) +
                '</td><td class="amount ' +
                transaction.type +
                '">' +
                (transaction.type === "expense" ? "−" : "+") +
                money(transaction.amount) +
                "</td></tr>",
            )
            .join("") +
          "</tbody></table>"
        : empty("Thêm giao dịch để bắt đầu theo dõi thu chi.");
    }),
    API.get("/budgets", { year, month }).then(({ data }) => {
      $("dashboard-budgets").innerHTML =
        data
          .slice(0, 5)
          .map(
            (budget) =>
              '<div class="budget-item"><div class="item-row"><strong>' +
              esc(budget.category.name) +
              "</strong><span>" +
              numeric.format(budget.percentage) +
              '%</span></div><div class="progress"><i class="' +
              budget.status +
              '" style="width:' +
              Math.min(100, budget.percentage) +
              '%"></i></div><small class="muted">' +
              money(budget.spent) +
              " / " +
              money(budget.amount) +
              "</small></div>",
          )
          .join("") || empty("Chưa đặt hạn mức cho tháng này.");
    }),
  ];
  const failures = await Promise.allSettled(jobs);
  const targetIds = [
    "wallets",
    "overview-chart",
    "weekly-chart",
    "dashboard-donut",
    "recent",
    "dashboard-budgets",
  ];
  failures.forEach((result, i) => {
    if (result.status === "rejected")
      $(targetIds[i]).innerHTML = empty(result.reason.message);
  });
}

loadDashboard();
refreshOnRecordChange(loadDashboard);
