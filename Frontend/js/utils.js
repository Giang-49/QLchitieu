/* Hàm tiện ích dùng chung cho transactions.html & reports.html (cần nạp sau config.js và api.js) */

// Chặn người chưa đăng nhập, giống dashboard.html
if (!API.isAuthenticated()) location.replace('index.html');

// Giá trị "type" mà backend NestJS dùng cho giao dịch. Đổi nếu backend khác (ví dụ 'INCOME').
const TX_TYPE = { EXPENSE: 'expense', INCOME: 'income' };
const isType = (t, ty) => String(t.type).toUpperCase() === ty;

// API.request trả về { success, message, data } nên lấy mảng ở trường data
const list = res => Array.isArray(res) ? res : (res && (Array.isArray(res.data) ? res.data : res.data?.items)) || [];

const vnd = n => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + ' ₫';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const thisMonth = () => new Date().toISOString().slice(0, 7);
const monthRange = ym => { const [y, m] = ym.split('-').map(Number); return { from: `${ym}-01`, to: `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}` }; };
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400); }

document.getElementById('btn-logout')?.addEventListener('click', () => { if (confirm('Bạn có chắc muốn đăng xuất?')) API.logout(); });
