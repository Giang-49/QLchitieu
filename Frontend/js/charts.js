const chartColors = { income: "#5bd2ad", expense: "#fb9fab", net: "#6366f1" };
const palette = [
  "#fda4af",
  "#7dd3fc",
  "#6ee7b7",
  "#c4b5fd",
  "#fdba74",
  "#fcd34d",
  "#94a3b8",
];
const monthLabel = (row) => "T" + row.month + "/" + String(row.year).slice(-2);

async function monthlySeries(year, month, length) {
  const dates = Array.from(
    { length },
    (_, i) => new Date(Date.UTC(year, month - length + i, 1)),
  );
  const years = [...new Set(dates.map((date) => date.getUTCFullYear()))];
  const responses = await Promise.all(
    years.map((year) => API.get("/reports/income-vs-expense", { year })),
  );
  const byYear = new Map(responses.map(({ data }) => [data.year, data.months]));
  return dates.map((date) => ({
    ...byYear.get(date.getUTCFullYear())[date.getUTCMonth()],
    year: date.getUTCFullYear(),
  }));
}

const legend = (color, label) =>
  '<span><i class="swatch" style="background:' +
  color +
  '"></i>' +
  label +
  "</span>";

function canvasSizer(canvas, paint) {
  const observer = new ResizeObserver(() => {
    if (!canvas.isConnected) {
      observer.disconnect();
      return;
    }
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    paint(context, width, height);
  });
  observer.observe(canvas);
}

function drawSeries(host, rows, mode) {
  const line = mode === "line";
  const daily = mode === "daily";
  if (!rows.some((row) => row.income || row.expense)) {
    host.innerHTML = empty(
      daily
        ? "Chưa ghi nhận chi tiêu trong 7 ngày qua."
        : "Chưa có giao dịch trong các tháng này.",
    );
    return;
  }
  const title = line
    ? "Chênh lệch thu chi theo tháng"
    : daily
      ? "Chi tiêu 7 ngày qua"
      : "Thu nhập và chi tiêu theo tháng";
  const label = (row) =>
    daily ? dateLabel(row.date).slice(0, 5) : monthLabel(row);
  host.innerHTML =
    '<div class="chart-legend">' +
    (line
      ? legend(chartColors.net, "Chênh lệch")
      : (daily ? "" : legend(chartColors.income, "Thu")) +
        legend(chartColors.expense, "Chi")) +
    "</div>" +
    '<canvas tabindex="0" role="img" aria-label="' +
    title +
    '. Dùng phím mũi tên để xem số liệu."></canvas>' +
    '<p class="chart-readout" aria-live="polite"></p>';
  const canvas = host.querySelector("canvas");
  const readout = host.querySelector(".chart-readout");
  let active = rows.length - 1;
  let repaint;
  let plotStart;
  let step;

  function select(index) {
    active = Math.max(0, Math.min(rows.length - 1, index));
    const row = rows[active];
    readout.textContent =
      label(row) +
      " · " +
      (line
        ? "Chênh lệch " + money(row.net)
        : (daily ? "" : "Thu " + money(row.income) + " · ") +
          "Chi " +
          money(row.expense));
    repaint?.();
  }

  canvasSizer(canvas, (ctx, width, height) => {
    const max = Math.max(
      0,
      ...rows.map((row) =>
        line ? row.net : Math.max(row.income, row.expense),
      ),
    );
    const min = line ? Math.min(0, ...rows.map((row) => row.net)) : 0;
    const power = 10 ** Math.floor(Math.log10(Math.max(1, (max - min) / 4)));
    const interval = Math.max(1, Math.ceil((max - min) / 4 / power)) * power;
    const low = Math.floor(min / interval) * interval;
    const high = Math.max(low + interval, Math.ceil(max / interval) * interval);
    const ticks = (high - low) / interval;
    plotStart = 63;
    const top = 16;
    const baseline = height - 24;
    step = (width - plotStart - 10) / rows.length;
    const x = (i) => plotStart + (i + 0.5) * step;
    const y = (value) =>
      top + ((high - value) / (high - low)) * (baseline - top);

    repaint = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(x(active) - step / 2, top - 5, step, baseline - top + 7);
      ctx.font = "11px Segoe UI, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let i = 0; i <= ticks; i++) {
        const value = low + i * interval;
        ctx.strokeStyle = value === 0 ? "#a7b5c8" : "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(plotStart, y(value));
        ctx.lineTo(width - 7, y(value));
        ctx.stroke();
        ctx.fillStyle = "#526176";
        ctx.fillText(compact.format(value), plotStart - 8, y(value));
      }
      ctx.textAlign = "center";
      rows.forEach((row, i) => {
        if (step < 39 && i % 2 !== 0 && i !== active) return;
        ctx.fillStyle = "#526176";
        ctx.fillText(
          !daily && step < 50 ? "T" + row.month : label(row),
          x(i),
          baseline + 14,
        );
      });
      if (line) {
        ctx.strokeStyle = chartColors.net;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        rows.forEach((row, i) =>
          i ? ctx.lineTo(x(i), y(row.net)) : ctx.moveTo(x(i), y(row.net)),
        );
        ctx.stroke();
        ctx.lineWidth = 1;
        rows.forEach((row, i) => {
          ctx.beginPath();
          ctx.arc(x(i), y(row.net), i === active ? 5 : 3, 0, 2 * Math.PI);
          ctx.fillStyle = chartColors.net;
          ctx.fill();
        });
      } else if (daily) {
        ctx.fillStyle = chartColors.expense;
        const barWidth = Math.min(30, step * 0.62);
        rows.forEach((row, i) => {
          ctx.fillRect(
            x(i) - barWidth / 2,
            y(row.expense),
            barWidth,
            y(0) - y(row.expense),
          );
        });
      } else {
        const barWidth = Math.min(22, step * 0.28);
        rows.forEach((row, i) => {
          ctx.fillStyle = chartColors.income;
          ctx.fillRect(
            x(i) - barWidth - 2,
            y(row.income),
            barWidth,
            y(0) - y(row.income),
          );
          ctx.fillStyle = chartColors.expense;
          ctx.fillRect(
            x(i) + 2,
            y(row.expense),
            barWidth,
            y(0) - y(row.expense),
          );
        });
      }
    };
    repaint();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (step) select(Math.floor((event.offsetX - plotStart) / step));
  });
  canvas.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    select(active + (event.key === "ArrowLeft" ? -1 : 1));
  });
  select(active);
}

function drawDonut(host, report) {
  const total = Number(report.total_expense);
  if (!total) {
    host.innerHTML = empty("Chưa có khoản chi trong kỳ này.");
    return;
  }
  const items = report.items;
  const slices =
    items.length > 7
      ? [
          ...items.slice(0, 6),
          {
            name: "Các danh mục còn lại",
            total: items
              .slice(6)
              .reduce((sum, item) => sum + Number(item.total), 0),
          },
        ]
      : items;
  host.innerHTML =
    '<figure class="donut-figure"><canvas role="img" aria-label="Tỷ trọng chi tiêu theo danh mục"></canvas>' +
    '<figcaption class="donut-centre"><strong>' +
    compact.format(total) +
    " ₫</strong><small>Tổng chi</small></figcaption></figure>" +
    slices
      .map(
        (slice, i) =>
          '<div class="legend-row"><span>' +
          legend(palette[i], esc(slice.name)) +
          '</span><strong title="' +
          money(slice.total) +
          '">' +
          numeric.format((Number(slice.total) / total) * 100) +
          "%</strong></div>",
      )
      .join("") +
    "<details><summary>Xem chi tiết danh mục</summary>" +
    items
      .map(
        (item) =>
          '<div class="item-row"><strong>' +
          esc(item.name) +
          "</strong><span>" +
          money(item.total) +
          "</span></div>" +
          item.subcategories
            .map(
              (child) =>
                '<div class="item-row muted"><span>↳ ' +
                esc(child.name) +
                "</span><span>" +
                money(child.total) +
                "</span></div>",
            )
            .join(""),
      )
      .join("") +
    "</details>";
  canvasSizer(host.querySelector("canvas"), (ctx, width, height) => {
    let angle = -Math.PI / 2;
    const radius = Math.min(width, height) * 0.39;
    ctx.lineWidth = Math.min(width, height) * 0.135;
    slices.forEach((slice, index) => {
      const end = angle + (Number(slice.total) / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.strokeStyle = palette[index];
      ctx.arc(width / 2, height / 2, radius, angle, end);
      ctx.stroke();
      angle = end;
    });
  });
}
