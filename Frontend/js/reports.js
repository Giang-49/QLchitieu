/* Tổng hợp ở client từ GET /transactions (1 request cho 6 tháng). Dữ liệu lớn nên chuyển sang endpoint /reports ở backend. */
const $ = id => document.getElementById(id);
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#cbd5e1'];
const ym = d => d.toISOString().slice(0, 7);
const monthsBack = n => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - n); return ym(new Date(d.getFullYear(), d.getMonth(), 15)); };
const sum = (a, type) => a.filter(t => isType(t, type)).reduce((s, t) => s + Number(t.amount), 0);
const inMonth = (txs, m) => txs.filter(t => String(t.date).slice(0, 7) === m);
const short = n => n >= 1e6 ? (n / 1e6).toFixed(2).replace('.', ',') + ' triệu' : vnd(n);
let all = [];

function donut(exp) {
  const by = {}; exp.forEach(t => { const n = t.category?.name || 'Khác'; by[n] = (by[n] || 0) + Number(t.amount); });
  let rows = Object.entries(by).sort((a, b) => b[1] - a[1]);
  if (rows.length > 5) { const rest = rows.slice(4).reduce((s, r) => s + r[1], 0); rows = [...rows.slice(0, 4), ['Khác', rest]]; }
  const total = rows.reduce((s, r) => s + r[1], 0);
  if (!total) { $('donut-wrap').innerHTML = '<div class="empty">Chưa có khoản chi nào trong kỳ này.</div>'; return rows; }
  const C = 2 * Math.PI * 70; let off = 0;
  const arcs = rows.map(([, v], i) => { const len = v / total * C; const s = `<circle cx="90" cy="90" r="70" fill="none" stroke="${COLORS[i]}" stroke-width="28" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}"/>`; off += len; return s; }).join('');
  $('donut-wrap').innerHTML = `<div class="donut"><svg width="180" height="180" viewBox="0 0 180 180">${arcs}</svg><div class="mid"><b>${short(total)}</b><small>Tổng chi</small></div></div>
    <div class="leg">${rows.map(([n, v], i) => `<div><i style="background:${COLORS[i]}"></i><span>${esc(n)}</span><b>${Math.round(v / total * 100)}%</b></div>`).join('')}</div>`;
  return rows;
}

function bars() {
  const ms = [5, 4, 3, 2, 1, 0].map(monthsBack), data = ms.map(m => { const t = inMonth(all, m); return [sum(t, 'INCOME'), sum(t, 'EXPENSE')]; });
  const max = Math.max(1, ...data.flat());
  $('bars').innerHTML = data.map(([i, e]) => `<div class="m"><div class="b inc" style="height:${i / max * 100}%" title="Thu ${vnd(i)}"></div><div class="b exp" style="height:${e / max * 100}%" title="Chi ${vnd(e)}"></div></div>`).join('');
  $('xl').innerHTML = ms.map(m => `<span>T${+m.slice(5)}</span>`).join('');
}

function render() {
  const n = +$('period').value, cur = inMonth(all, monthsBack(n)), prev = inMonth(all, monthsBack(n + 1));
  const inc = sum(cur, 'INCOME'), exp = sum(cur, 'EXPENSE'), pe = sum(prev, 'EXPENSE');
  $('s-inc').textContent = vnd(inc); $('s-exp').textContent = vnd(exp); $('s-bal').textContent = vnd(inc - exp);
  const rows = donut(cur.filter(t => isType(t, 'EXPENSE'))); bars();
  const by = {}; cur.filter(t => isType(t, 'EXPENSE')).forEach(t => { const k = t.category?.name || 'Khác'; by[k] = (by[k] || 0) + Number(t.amount); });
  const full = Object.entries(by).sort((a, b) => b[1] - a[1]);
  $('detail').innerHTML = full.map(([k, v], i) => `<div class="dl"><div class="top"><span>${esc(k)}</span><span>${vnd(v)} · ${Math.round(v / exp * 100)}%</span></div><div class="track"><div style="width:${v / exp * 100}%;background:${COLORS[Math.min(i, 4)]}"></div></div></div>`).join('') || '<div class="empty">Chưa có dữ liệu chi tiêu.</div>';
  const notes = [];
  if (full[0]) notes.push(['🏆', `${full[0][0]} là nhóm chi nhiều nhất`, `Chiếm ${Math.round(full[0][1] / exp * 100)}% tổng chi (${vnd(full[0][1])}).`]);
  if (pe) notes.push([exp > pe ? '📈' : '📉', `Chi tiêu ${exp > pe ? 'tăng' : 'giảm'} ${Math.abs(Math.round((exp - pe) / pe * 100))}%`, `So với tháng trước (${vnd(pe)}).`]);
  if (inc) notes.push(['💰', `Bạn tiết kiệm được ${Math.round((inc - exp) / inc * 100)}% thu nhập`, inc >= exp ? 'Dòng tiền trong kỳ đang dương.' : 'Chi tiêu đang vượt thu nhập, hãy xem lại các nhóm lớn.']);
  $('notes').innerHTML = notes.map(([i, t, d]) => `<div class="note"><span>${i}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></div>`).join('') || '<div class="empty">Thêm giao dịch để xem nhận xét.</div>';
}

$('period').addEventListener('change', render);
(async () => {
  const from = monthsBack(6) + '-01', to = monthRange(monthsBack(0)).to;
  try { all = list(await API.getTransactions({ from, to })); } catch (e) { toast(e.message); }
  render();
})();
