const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { loadEnvFile } = require('node:process');
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const envFile = resolve(__dirname, '../.env');
if (existsSync(envFile)) loadEnvFile(envFile);

const localHosts = ['localhost', '127.0.0.1', '[::1]'];
const apiUrl = new URL(
  process.env.SMOKE_URL || 'http://localhost:' + (process.env.PORT || 3000),
);
const dbUrl = new URL(process.env.DATABASE_URL || 'mysql://localhost');
if (
  !localHosts.includes(apiUrl.hostname) ||
  ![...localHosts, 'mysql'].includes(dbUrl.hostname) ||
  process.env.NODE_ENV === 'production'
) {
  throw new Error(
    'Chạy smoke test trên web và cơ sở dữ liệu phát triển cục bộ.',
  );
}

const prisma = new PrismaClient();
const owners = [];
const today = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Ho_Chi_Minh',
}).format(new Date());
const [year, month] = today.split('-').map(Number);
const dateRange = { from_date: today, to_date: today };

function client(token) {
  return async function request(
    method,
    path,
    { body, query, status = 200, binaryType } = {},
  ) {
    const url = new URL('/api/v1' + path, apiUrl);
    if (query) url.search = new URLSearchParams(query);
    const multipart = body instanceof FormData;
    const response = await fetch(url, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}),
      },
      body: multipart ? body : body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12_000),
    });
    assert.equal(
      response.status,
      status,
      response.status === status
        ? method + ' ' + path
        : method + ' ' + path + ' → ' + (await response.text()).slice(0, 500),
    );
    if (binaryType) {
      assert.match(response.headers.get('content-type'), binaryType);
      return Buffer.from(await response.arrayBuffer());
    }
    return response.json();
  };
}

async function createAccount(request, name) {
  const email = 'qa-' + randomUUID() + '@sochi.test';
  const password = randomUUID() + 'aA1!';
  const registered = await request('POST', '/auth/register', {
    body: { name, email, password },
    status: 201,
  });
  const owner = await prisma.user.findUnique({
    where: { email, name },
    select: { id: true, email: true },
  });
  assert.ok(owner, 'API và smoke test phải kết nối cùng một MySQL.');
  owners.push(owner);
  assert.equal(Number(owner.id), Number(registered.data.user.id));
  const loggedIn = await request('POST', '/auth/login', {
    body: { email, password },
    status: 201,
  });
  assert.ok(loggedIn.data.access_token);
  return client(loggedIn.data.access_token);
}

async function checkWallets(owner) {
  const cash = (await owner('GET', '/wallets')).data.wallets[0];
  const { data: bank } = await owner('POST', '/wallets', {
    body: {
      name: 'Ví ngân hàng QA',
      type: 'bank',
      balance: 1_000_000,
      currency: 'VND',
    },
    status: 201,
  });
  await owner('PUT', '/wallets/' + bank.id, {
    body: { name: 'Ví QA đã đổi tên' },
  });
  const { data } = await owner('GET', '/wallets/' + bank.id);
  assert.equal(Number(data.balance), 1_000_000);
  assert.equal(data.type, 'bank');
  return { cash, bank };
}

async function checkTransactions(owner, other, cash, bank) {
  const { data: root } = await owner('POST', '/categories', {
    body: { name: 'Sinh hoạt QA', type: 'expense' },
    status: 201,
  });
  const { data: child } = await owner('POST', '/categories', {
    body: { name: 'Ăn uống QA', type: 'expense', parent_id: Number(root.id) },
    status: 201,
  });
  const categories = (await owner('GET', '/categories')).data;
  const income = categories.find((category) => category.type === 'income');
  assert.ok(income);
  assert.ok(
    categories
      .find((category) => category.id === root.id)
      .children.some((item) => item.id === child.id),
  );
  const body = { category_id: Number(root.id), month, year, amount: 1_000_000 };
  await owner('POST', '/budgets', { body, status: 201 });
  await owner('POST', '/budgets', { body, status: 409 });

  const transaction_date = today + 'T16:45:00.000Z';
  const cashId = Number(cash.id);
  const nextExpense = (amount, note, categoryId = child.id) =>
    owner('POST', '/transactions', {
      body: {
        wallet_id: cashId,
        category_id: Number(categoryId),
        type: 'expense',
        amount,
        note,
        transaction_date,
      },
      status: 201,
    });
  await owner('POST', '/transactions', {
    body: {
      wallet_id: cashId,
      category_id: Number(income.id),
      type: 'income',
      amount: 5_000_000,
      transaction_date,
    },
    status: 201,
  });
  await owner('POST', '/transactions', {
    body: {
      wallet_id: cashId,
      category_id: Number(income.id),
      type: 'expense',
      amount: 200,
      transaction_date,
    },
    status: 400,
  });
  const { data: first } = await nextExpense(800_000, 'QA Xuất Excel 1');
  const { data: second } = await nextExpense(200_000, 'QA Xuất Excel 2');
  const { data: third } = await nextExpense(50_000, 'QA khoản chi khác');
  assert.equal(first.budget_alert?.level, 'warning');
  assert.equal(second.budget_alert?.level, 'danger');
  assert.equal(third.budget_alert ?? null, null);

  const { meta, data } = await owner('GET', '/transactions', {
    query: { ...dateRange, page: 2, limit: 1, category_id: child.id },
  });
  assert.equal(meta.totalItems, 3);
  assert.equal(meta.currentPage, 2);
  assert.equal(meta.totalPages, 3);
  assert.equal(data.length, 1);
  await owner('GET', '/transactions', { query: { limit: -1 }, status: 400 });
  await owner('GET', '/transactions', {
    query: { to_date: year + '-02-31' },
    status: 400,
  });
  await other('GET', '/transactions/' + first.id, { status: 404 });
  await other('GET', '/wallets/' + cash.id, { status: 404 });

  const categoryPie = (
    await owner('GET', '/reports/category-pie', { query: dateRange })
  ).data;
  assert.equal(Number(categoryPie.total_expense), 1_050_000);
  assert.equal(Number(categoryPie.items[0].category_id), Number(root.id));
  assert.equal(
    Number(categoryPie.items[0].subcategories[0].id),
    Number(child.id),
  );
  const report = (
    await owner('GET', '/reports/income-vs-expense', {
      query: { ...dateRange, year },
    })
  ).data;
  assert.equal(report.months.length, 12);
  assert.equal(Number(report.total_income), 5_000_000);
  assert.equal(Number(report.total_expense), 1_050_000);
  assert.equal(Number(report.net_savings), 3_950_000);
  const binary = await owner('GET', '/reports/export-excel', {
    query: { ...dateRange, category_id: child.id, search: 'QA Xuất Excel' },
    binaryType: /spreadsheetml/,
  });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(binary);
  assert.equal(
    workbook.worksheets[0].rowCount,
    3,
    'Hai giao dịch khớp bộ lọc và dòng tiêu đề.',
  );
  const budget = (await owner('GET', '/budgets', { query: { month, year } }))
    .data[0];
  assert.equal(Number(budget.spent), 1_050_000);
  assert.equal(Number(budget.percentage), 105);
  const notifications = (await owner('GET', '/notifications')).data;
  assert.ok(
    notifications.some((notification) => notification.type === 'budget_danger'),
  );

  await owner('PUT', '/transactions/' + first.id, {
    body: { wallet_id: Number(bank.id), amount: 600_000 },
  });
  assert.equal(await balance(owner, cash.id), 4_750_000);
  assert.equal(await balance(owner, bank.id), 400_000);
  await owner('DELETE', '/transactions/' + first.id);
  assert.equal(await balance(owner, bank.id), 1_000_000);
  const { data: again } = await nextExpense(550_000, 'QA qua ngưỡng lần nữa');
  assert.equal(
    again.budget_alert ?? null,
    null,
    'Ngưỡng 80% chỉ cảnh báo một lần trong tháng.',
  );
  await owner('DELETE', '/transactions/' + again.id);
  await owner('DELETE', '/categories/' + child.id, {
    query: { replace_id: income.id },
    status: 400,
  });
  await owner('DELETE', '/categories/' + child.id, {
    query: { replace_id: root.id },
  });
  assert.equal(
    Number((await owner('GET', '/transactions/' + second.id)).data.category_id),
    Number(root.id),
  );
}

async function balance(owner, walletId) {
  return Number((await owner('GET', '/wallets/' + walletId)).data.balance);
}

async function checkReceipt(owner, other, anonymous, cash) {
  const category = (await owner('GET', '/categories')).data.find(
    (entry) => entry.type === 'expense',
  );
  const image = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jT7sAAAAASUVORK5CYII=',
    'base64',
  );
  function form(contents) {
    const payload = new FormData();
    const fields = {
      wallet_id: cash.id,
      category_id: category.id,
      type: 'expense',
      amount: 1500,
      transaction_date: today,
      note: 'QA ảnh hóa đơn',
    };
    for (const [key, value] of Object.entries(fields))
      payload.set(key, String(value));
    payload.set(
      'receipt',
      new Blob([contents], { type: 'image/png' }),
      'receipt.png',
    );
    return payload;
  }
  await owner('POST', '/transactions', {
    body: form('Tệp không phải ảnh'),
    status: 400,
  });
  const { data: transaction } = await owner('POST', '/transactions', {
    body: form(image),
    status: 201,
  });
  assert.match(
    transaction.image_url,
    /^\/api\/v1\/transactions\/receipts\/[\da-f-]{36}\.png$/,
  );
  const path = transaction.image_url.slice('/api/v1'.length);
  try {
    const read = await owner('GET', path, { binaryType: /^image\/png/ });
    assert.deepEqual(read, image);
    await anonymous('GET', path, { status: 401 });
    await other('GET', path, { status: 404 });
    const { data: edited } = await owner(
      'PUT',
      '/transactions/' + transaction.id,
      { body: { note: 'QA sửa ghi chú' } },
    );
    assert.equal(edited.image_url, transaction.image_url);
  } finally {
    await owner('DELETE', '/transactions/' + transaction.id);
  }
  await owner('GET', path, { status: 404 });
}

async function checkDebt(owner, cash) {
  const yesterday = new Date(new Date(today).getTime() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  const original = await balance(owner, cash.id);
  const { data: debt } = await owner('POST', '/debts', {
    body: {
      wallet_id: Number(cash.id),
      type: 'borrow',
      person_name: 'QA Sổ nợ',
      amount: 100_000,
      due_date: yesterday,
    },
    status: 201,
  });
  assert.equal(await balance(owner, cash.id), original + 100_000);
  assert.ok(
    (await owner('GET', '/debts', { query: { status: 'overdue' } })).data.some(
      (entry) => entry.id === debt.id,
    ),
  );
  assert.equal(
    (await owner('GET', '/debts', { query: { status: 'unpaid' } })).data.length,
    0,
  );
  assert.ok(
    (await owner('GET', '/notifications')).data.some(
      (item) => item.type === 'debt_overdue',
    ),
  );
  const pay = (amount, status = 201) =>
    owner('POST', '/debts/' + debt.id + '/payments', {
      body: { wallet_id: Number(cash.id), amount },
      status,
    });
  await pay(100_001, 400);
  await pay(32_000);
  const partial = (await owner('GET', '/debts/' + debt.id)).data;
  assert.equal(Number(partial.remaining), 68_000);
  assert.equal(partial.payments.length, 1);
  await pay(68_000);
  const completed = (await owner('GET', '/debts/' + debt.id)).data;
  assert.equal(completed.status, 'completed');
  assert.equal(Number(completed.remaining), 0);
  assert.equal(completed.payments.length, 2);
  assert.equal(await balance(owner, cash.id), original);
}

async function cleanAccounts() {
  for (const user of owners) {
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { user_id: user.id } }),
      prisma.debt.deleteMany({ where: { user_id: user.id } }),
      prisma.user.delete({ where: { id: user.id, email: user.email } }),
    ]);
  }
}

async function main() {
  try {
    for (const path of [
      '/',
      '/login.html',
      '/dashboard.html',
      '/transactions.html',
      '/reports.html',
      '/manage.html',
    ]) {
      const response = await fetch(new URL(path, apiUrl), {
        signal: AbortSignal.timeout(5_000),
      });
      assert.equal(response.status, 200, path);
      assert.match(response.headers.get('content-type'), /text\/html/, path);
      await response.body?.cancel();
    }
    const request = client();
    await request('GET', '/wallets', { status: 401 });
    const owner = await createAccount(request, 'Tài khoản QA sở hữu');
    const other = await createAccount(request, 'Tài khoản QA độc lập');
    console.log('PASS: Trang web, đăng ký, đăng nhập, quyền truy cập.');
    const { cash, bank } = await checkWallets(owner);
    await checkTransactions(owner, other, cash, bank);
    console.log(
      'PASS: Ví, giao dịch, danh mục cha con, phân trang, ngưỡng ngân sách, báo cáo và Excel.',
    );
    await checkReceipt(owner, other, request, cash);
    console.log(
      'PASS: Tải ảnh hóa đơn, phân quyền, giữ ảnh khi sửa và dọn ảnh khi xóa.',
    );
    await checkDebt(owner, cash);
    console.log('PASS: Sổ nợ, nhắc quá hạn, thanh toán từng phần và tất toán.');
  } finally {
    try {
      await cleanAccounts();
    } finally {
      await prisma.$disconnect();
    }
  }
}

main().catch((error) => {
  console.error('FAIL: ' + error.message);
  process.exitCode = 1;
});
