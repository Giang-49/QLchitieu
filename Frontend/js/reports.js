let reportRequest = 0;
let exportRange;

function reportRange() {
  const value = $("report-date").value;
  const period = $("report-period").value;
  if (period === "month") return monthRange(value.slice(0, 7));
  if (period === "year")
    return {
      from_date: value.slice(0, 4) + "-01-01",
      to_date: value.slice(0, 4) + "-12-31",
    };
  const start = new Date(value + "T00:00:00Z");
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return {
    from_date: start.toISOString().slice(0, 10),
    to_date: end.toISOString().slice(0, 10),
  };
}

async function loadReport() {
  if (!API.isAuthenticated()) return;
  const request = ++reportRequest;
  const status = $("report-status");
  $("export-report").disabled = true;
  if (!$("report-date").value || !$("report-date").validity.valid) {
    delete status.dataset.loading;
    status.textContent = "Chọn ngày hợp lệ để xem kỳ báo cáo.";
    status.hidden = false;
    return;
  }
  const range = reportRange();
  const mode = $("report-period").value;
  const [year, month] = $("report-date").value.split("-").map(Number);
  const years = [
    ...new Set([range.from_date.slice(0, 4), range.to_date.slice(0, 4)]),
  ];
  $("report-range").textContent =
    dateLabel(range.from_date) + " – " + dateLabel(range.to_date);
  status.hidden = false;
  status.dataset.loading = "";
  status.textContent = "Đang tải báo cáo…";
  $("chart-data").hidden = true;
  for (const id of ["report-income", "report-expense", "report-net"])
    $(id).textContent = "—";
  for (const id of ["donut", "bars", "trend"]) $(id).replaceChildren();

  try {
    const [pie, summaries, rows] = await Promise.all([
      API.get("/reports/category-pie", range),
      Promise.all(
        years.map((year) =>
          API.get("/reports/income-vs-expense", { ...range, year }),
        ),
      ),
      monthlySeries(
        year,
        mode === "year" ? 12 : month,
        mode === "year" ? 12 : 6,
      ),
    ]);
    if (request !== reportRequest) return;
    const income = summaries.reduce(
      (sum, { data }) => sum + Number(data.total_income),
      0,
    );
    const expense = summaries.reduce(
      (sum, { data }) => sum + Number(data.total_expense),
      0,
    );
    $("report-income").textContent = money(income);
    $("report-expense").textContent = money(expense);
    $("report-net").textContent = money(income - expense);
    $("report-net").classList.toggle("negative", income < expense);
    $("comparison-range").textContent =
      "Tháng " +
      rows[0].month +
      "/" +
      rows[0].year +
      " – " +
      rows.at(-1).month +
      "/" +
      rows.at(-1).year +
      " · đơn vị ₫";
    drawDonut($("donut"), pie.data);
    drawSeries($("bars"), rows, "bar");
    drawSeries($("trend"), rows, "line");
    $("report-table").innerHTML =
      "<table><thead><tr><th>Tháng</th><th>Thu</th><th>Chi</th><th>Chênh lệch</th></tr></thead><tbody>" +
      rows
        .map(
          (row) =>
            "<tr><td>" +
            monthLabel(row) +
            "</td><td>" +
            money(row.income) +
            "</td><td>" +
            money(row.expense) +
            "</td><td>" +
            money(row.net) +
            "</td></tr>",
        )
        .join("") +
      "</tbody></table>";
    $("chart-data").hidden = false;
    status.hidden = true;
    exportRange = range;
    $("export-report").disabled = false;
  } catch (error) {
    if (request !== reportRequest) return;
    delete status.dataset.loading;
    status.textContent = error.message;
  }
}

function shiftPeriod(amount) {
  const date = new Date(($("report-date").value || today()) + "T00:00:00Z");
  const mode = $("report-period").value;
  if (mode === "week") date.setUTCDate(date.getUTCDate() + amount * 7);
  if (mode === "month") date.setUTCMonth(date.getUTCMonth() + amount, 1);
  if (mode === "year")
    date.setUTCFullYear(date.getUTCFullYear() + amount, 0, 1);
  const value = date.toISOString().slice(0, 10);
  if (value < $("report-date").min || value > $("report-date").max) return;
  $("report-date").value = value;
  loadReport();
}

$("report-date").value = today();
$("report-date").addEventListener("change", loadReport);
$("report-period").addEventListener("change", loadReport);
$("prev-period").addEventListener("click", () => shiftPeriod(-1));
$("next-period").addEventListener("click", () => shiftPeriod(1));
$("export-report").addEventListener("click", async () => {
  const range = exportRange;
  try {
    download(
      await API.downloadExcel(range),
      "so-chi-" + range.from_date + ".xlsx",
    );
  } catch (error) {
    notice(error.message, "error");
  }
});
loadReport();
refreshOnRecordChange(loadReport);
