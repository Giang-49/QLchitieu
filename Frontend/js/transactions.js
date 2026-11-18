const $ = id => document.getElementById(id);
const st = { type: 'EXPENSE', cats: [], wallets: [], catId: null };
const ICONS = [['ăn', '🍜'], ['di chuyển', '🚗'], ['mua', '🛍️'], ['hóa đơn', '🧾'], ['giải trí', '🎮'], ['sức khỏe', '💊'], ['gia đình', '🏠'], ['lương', '💼'], ['thưởng', '🎁'], ['khác', '•••']];
const iconOf = n => (ICONS.find(([k]) => n.toLowerCase().includes(k)) || [0, '💰'])[1];
const amountVal = () => Number($('amount').value.replace(/\D/g, '')) || 0;
const fmtDate = d => d ? d.split('-').reverse().join('/') : '—';

function renderCats() {
  const list_ = st.cats.filter(c => !c.type || String(c.type).toUpperCase() === st.type);
  if (!list_.some(c => c.id === st.catId)) st.catId = list_[0]?.id || null;
  $('cats').innerHTML = list_.map(c => `<button type="button" class="cat ${c.id === st.catId ? 'on' : ''}" role="radio" aria-checked="${c.id === st.catId}" data-id="${esc(c.id)}"><i>${iconOf(c.name)}</i>${esc(c.name)}</button>`).join('') || '<div class="empty" style="grid-column:1/-1">Chưa có danh mục. Hãy tạo danh mục trước.</div>';
  preview();
}
function preview() {
  const exp = st.type === 'EXPENSE', a = amountVal();
  $('pv-amt').textContent = (exp ? '−' : '+') + vnd(a); $('pv-amt').className = 'preview-amt ' + (exp ? 'chi' : 'thu');
  $('pv-pill').textContent = exp ? 'KHOẢN CHI' : 'KHOẢN THU'; $('pv-pill').className = 'pill ' + (exp ? 'chi' : 'thu');
  $('pv-type').textContent = exp ? 'Khoản chi' : 'Khoản thu';
  $('pv-cat').textContent = st.cats.find(c => c.id === st.catId)?.name || '—';
  $('pv-wallet').textContent = $('wallet').selectedOptions[0]?.text || '—';
  $('pv-date').textContent = fmtDate($('date').value);
  $('pv-note').textContent = $('note').value.trim() || 'Chưa có';
}
function reset() {
  $('tx-form').reset(); $('date').value = new Date().toISOString().slice(0, 10); $('form-err').textContent = ''; setType('EXPENSE');
}
function setType(t) {
  st.type = t; document.querySelectorAll('.type-tabs button').forEach(b => b.classList.toggle('on', b.dataset.type === t)); renderCats();
}

document.querySelectorAll('.type-tabs button').forEach(b => b.addEventListener('click', () => setType(b.dataset.type)));
$('cats').addEventListener('click', e => { const b = e.target.closest('.cat'); if (b) { st.catId = b.dataset.id; renderCats(); } });
$('amount').addEventListener('input', e => { const n = e.target.value.replace(/\D/g, ''); e.target.value = n ? new Intl.NumberFormat('vi-VN').format(n) : ''; preview(); });
['wallet', 'date', 'note'].forEach(id => $(id).addEventListener('input', preview));
$('btn-reset').addEventListener('click', reset);

$('tx-form').addEventListener('submit', async e => {
  e.preventDefault();
  const amount = amountVal();
  if (amount <= 0) return $('form-err').textContent = 'Nhập số tiền lớn hơn 0.';
  if (!st.catId) return $('form-err').textContent = 'Chọn một danh mục.';
  if (!$('wallet').value) return $('form-err').textContent = 'Chọn ví giao dịch.';
  if (!$('date').value) return $('form-err').textContent = 'Chọn ngày giao dịch.';
  $('btn-save').disabled = true;
  try {
    await API.createTransaction({ type: TX_TYPE[st.type], amount, categoryId: st.catId, walletId: $('wallet').value, date: $('date').value, note: $('note').value.trim() });
    toast('Đã lưu giao dịch'); reset();
  } catch (err) { $('form-err').textContent = err.message; }
  finally { $('btn-save').disabled = false; }
});

(async () => {
  reset();
  try {
    const [w, c] = await Promise.all([API.getWallets(), API.getCategories()]);
    st.wallets = list(w); st.cats = list(c);
    $('wallet').innerHTML = st.wallets.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
    renderCats();
  } catch (err) { $('form-err').textContent = err.message; }
})();
