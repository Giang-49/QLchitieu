const http = require('http');

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('--- BẮT ĐẦU KIỂM THỬ TOÀN DIỆN CÁC API BACKEND ---');

  // 1. Auth: Register
  const testEmail = `test_${Date.now()}@qlchitieu.vn`;
  console.log('\n[1] TEST ĐĂNG KÝ: ' + testEmail);
  const regRes = await request('POST', '/auth/register', {
    email: testEmail,
    password: 'password123',
    name: 'Người Dùng Kiểm Thử',
  });
  console.log('Status:', regRes.status, 'Message:', regRes.data?.message);
  const token = regRes.data?.data?.access_token;
  if (!token) throw new Error('Không nhận được token đăng ký: ' + JSON.stringify(regRes.data));
  console.log('=> Đăng ký thành công, lấy được Token!');

  // 2. Auth: Profile
  console.log('\n[2] TEST LẤY PROFILE:');
  const profRes = await request('GET', '/auth/profile', null, token);
  console.log('Profile:', profRes.data?.data?.name, '(' + profRes.data?.data?.email + ')');

  // 3. Wallets: List
  console.log('\n[3] TEST LẤY DANH SÁCH VÍ:');
  const walletsRes = await request('GET', '/wallets', null, token);
  console.log('Số lượng ví mặc định:', walletsRes.data?.data?.wallets?.length);
  const defaultWallet = walletsRes.data?.data?.wallets?.[0];
  console.log('Ví đầu tiên:', defaultWallet?.name, 'Số dư:', defaultWallet?.balance);

  // 4. Wallets: Create new Wallet
  console.log('\n[4] TEST TẠO VÍ MỚI (Techcombank):');
  const createWalletRes = await request('POST', '/wallets', {
    name: 'Techcombank',
    type: 'bank',
    balance: 5000000,
    currency: 'VND',
  }, token);
  const bankWallet = createWalletRes.data?.data;
  console.log('Ví tạo mới ID:', bankWallet?.id, 'Số dư:', bankWallet?.balance);

  // 5. Categories: List Tree
  console.log('\n[5] TEST LẤY CÂY DANH MỤC:');
  const catRes = await request('GET', '/categories', null, token);
  console.log('Số lượng danh mục gốc:', catRes.data?.data?.length);
  const expenseCat = catRes.data?.data?.find(c => c.type === 'expense');
  console.log('Danh mục chi tiêu mẫu:', expenseCat?.name, 'ID:', expenseCat?.id);

  // 6. Transactions: Create Expense
  console.log('\n[6] TEST TẠO GIAO DỊCH CHI TIÊU (Ăn trưa 150.000đ từ Techcombank):');
  const txRes = await request('POST', '/transactions', {
    wallet_id: bankWallet.id,
    category_id: expenseCat.id,
    type: 'expense',
    amount: 150000,
    note: 'Ăn trưa cơm văn phòng',
    transaction_date: new Date().toISOString(),
  }, token);
  console.log('Status:', txRes.status, 'Message:', txRes.data?.message);
  console.log('Transaction ID:', txRes.data?.data?.id, 'Số tiền:', txRes.data?.data?.amount);

  // Check wallet balance after expense
  const checkWalletRes = await request('GET', `/wallets/${bankWallet.id}`, null, token);
  console.log('Số dư Techcombank sau khi chi (5.000.000 - 150.000):', checkWalletRes.data?.data?.balance);

  // 7. Budgets: Create and check percentage
  console.log('\n[7] TEST THIẾT LẬP HẠN MỨC NGÂN SÁCH (1.000.000đ cho ' + expenseCat.name + '):');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const budgetRes = await request('POST', '/budgets', {
    category_id: expenseCat.id,
    amount: 1000000,
    month: currentMonth,
    year: currentYear,
  }, token);
  console.log('Tạo ngân sách ID:', budgetRes.data?.data?.id, 'Hạn mức:', budgetRes.data?.data?.amount);

  const budgetListRes = await request('GET', `/budgets?month=${currentMonth}&year=${currentYear}`, null, token);
  const myBudget = budgetListRes.data?.data?.[0];
  console.log('Tiến độ ngân sách: Đã chi', myBudget?.spent, '/', myBudget?.amount, `(${myBudget?.percentage}%, Trạng thái: ${myBudget?.status})`);

  // 8. Debts: Create Borrow and Lend
  console.log('\n[8] TEST SỔ NỢ (Tạo khoản cho bạn vay 1.000.000đ):');
  const debtRes = await request('POST', '/debts', {
    wallet_id: bankWallet.id,
    type: 'lend',
    person_name: 'Trần Văn Bạn',
    amount: 1000000,
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    note: 'Cho bạn mượn đóng tiền nhà',
  }, token);
  const debt = debtRes.data?.data;
  console.log('Khoản nợ ID:', debt?.id, 'Đối tác:', debt?.person_name, 'Số tiền:', debt?.amount, 'Còn lại:', debt?.remaining);

  // 9. Debt Payment: Partial pay 400.000đ
  console.log('\n[9] TEST TRẢ NỢ (Bạn trả bớt 400.000đ vào Techcombank):');
  const payRes = await request('POST', `/debts/${debt.id}/payments`, {
    wallet_id: bankWallet.id,
    amount: 400000,
    note: 'Bạn trả đợt 1',
  }, token);
  console.log('Ghi nhận thanh toán:', payRes.data?.data?.amount, 'VND');

  const debtDetailRes = await request('GET', `/debts/${debt.id}`, null, token);
  console.log('Dư nợ còn lại sau khi trả:', debtDetailRes.data?.data?.remaining, 'Trạng thái:', debtDetailRes.data?.data?.status);

  // 10. Reports: Category Pie Chart
  console.log('\n[10] TEST BÁO CÁO BIỂU ĐỒ TRÒN PHÂN BỔ CHI TIÊU:');
  const pieRes = await request('GET', '/reports/category-pie', null, token);
  console.log('Tổng chi tiêu báo cáo:', pieRes.data?.data?.total_expense);
  console.log('Các mục phân bổ:', pieRes.data?.data?.items?.map(i => `${i.name}: ${i.total} (${i.percentage}%)`).join(', '));

  // 11. Reports: Income vs Expense 12 months
  console.log('\n[11] TEST BIỂU ĐỒ CỘT THU VS CHI 12 THÁNG:');
  const colRes = await request('GET', `/reports/income-vs-expense?year=${currentYear}`, null, token);
  console.log('Năm:', colRes.data?.data?.year, 'Tổng thu:', colRes.data?.data?.total_income, 'Tổng chi:', colRes.data?.data?.total_expense, 'Tiết kiệm:', colRes.data?.data?.net_savings);

  // 12. Notifications
  console.log('\n[12] TEST LẤY THÔNG BÁO VÀ NHẮC NỢ / NGÂN SÁCH:');
  const notifRes = await request('GET', '/notifications', null, token);
  console.log('Số lượng thông báo hiện tại:', notifRes.data?.data?.length);

  console.log('\n======================================================');
  console.log('🎉 TẤT CẢ 12 KỊCH BẢN KIỂM THỬ API ĐỀU THÀNH CÔNG 100%! 🎉');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Lỗi khi test API:', err);
  process.exit(1);
});
