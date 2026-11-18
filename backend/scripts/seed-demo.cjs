const bcrypt = require('bcrypt');
const { Prisma, PrismaClient } = require('@prisma/client');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { loadEnvFile } = require('node:process');

const envFile = resolve(__dirname, '../.env');
if (existsSync(envFile)) loadEnvFile(envFile);

const email = 'demo@sochi.test';
const password = 'SoChiDemo2026!';
const name = 'Minh Anh · Tài khoản mẫu';

const walletSpecs = {
  bank: { name: 'Ngân hàng', type: 'bank', balance: 8_000_000 },
  cash: { name: 'Tiền mặt', type: 'cash', balance: 3_400_000 },
  ewallet: { name: 'Ví điện tử', type: 'ewallet', balance: 7_000_000 },
};

const categorySpecs = [
  ['salary', 'Tiền lương', 'income', 'briefcase', '#15803D'],
  ['freelance', 'Thu nhập thêm', 'income', 'laptop', '#0F766E'],
  ['food', 'Ăn uống', 'expense', 'utensils', '#E11D48'],
  [
    'groceries',
    'Đi chợ và siêu thị',
    'expense',
    'shopping-cart',
    '#F43F5E',
    'food',
  ],
  ['eatingOut', 'Ăn ngoài', 'expense', 'utensils', '#FB7185', 'food'],
  ['coffee', 'Cà phê', 'expense', 'coffee', '#BE123C', 'food'],
  ['transport', 'Đi lại', 'expense', 'car', '#2563EB'],
  ['home', 'Nhà ở và hóa đơn', 'expense', 'home', '#D97706'],
  ['shopping', 'Mua sắm', 'expense', 'shopping-bag', '#7C3AED'],
  ['leisure', 'Giải trí', 'expense', 'film', '#059669'],
  ['health', 'Sức khỏe', 'expense', 'heart', '#0891B2'],
];

const day = 86_400_000;
const monthCount = 6;

function vietnamDate() {
  const date = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date());
  return new Date(date + 'T00:00:00.000Z');
}

function makeTransactions(today) {
  const transactions = [];
  for (let offset = monthCount - 1; offset >= 0; offset--) {
    const monthStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1),
    );
    const month = monthStart.getUTCMonth();
    const year = monthStart.getUTCFullYear();
    const lastDay = offset === 0 ? today.getUTCDate() : 28;
    const add = (on, wallet, category, type, amount, note) => {
      transactions.push({
        wallet,
        category,
        type,
        amount,
        note,
        transaction_date: new Date(
          Date.UTC(year, month, Math.min(on, lastDay), 2),
        ),
      });
    };

    add(
      1,
      'bank',
      'salary',
      'income',
      14_400_000 + (5 - offset) * 120_000,
      'Lương tháng ' + (month + 1),
    );
    if (offset % 2 === 0) {
      add(
        16,
        'bank',
        'freelance',
        'income',
        750_000 + offset * 125_000,
        'Nhận phí thiết kế',
      );
    }
    add(3, 'bank', 'home', 'expense', 4_800_000, 'Tiền thuê nhà');
    add(
      7,
      'bank',
      'home',
      'expense',
      650_000 + offset * 55_000,
      'Điện, nước và Internet',
    );
    add(
      6,
      'ewallet',
      'transport',
      'expense',
      315_000 + offset * 25_000,
      'Xăng và gửi xe',
    );
    add(
      19,
      'bank',
      'transport',
      'expense',
      245_000 + offset * 30_000,
      'Xe buýt và đi lại',
    );
    add(
      4,
      'cash',
      'groceries',
      'expense',
      285_000 + offset * 35_000,
      'Mua rau, thịt và trái cây',
    );
    add(
      12,
      'bank',
      'groceries',
      'expense',
      680_000 + offset * 15_000,
      'Mua thực phẩm cuối tuần',
    );
    add(
      22,
      'bank',
      'groceries',
      'expense',
      425_000 + offset * 18_000,
      'Mua thực phẩm ở siêu thị',
    );
    add(
      9,
      'ewallet',
      'eatingOut',
      'expense',
      420_000 + offset * 25_000,
      'Ăn tối cùng bạn bè',
    );
    add(
      23,
      'bank',
      'eatingOut',
      'expense',
      320_000 + offset * 12_000,
      'Liên hoan nhóm',
    );
    add(10, 'ewallet', 'coffee', 'expense', 95_000, 'Cà phê cuối tuần');
    add(
      15,
      'bank',
      'shopping',
      'expense',
      offset % 2 === 0 ? 720_000 : 1_420_000,
      'Đồ dùng sinh hoạt',
    );
    add(
      21,
      'bank',
      'leisure',
      'expense',
      offset === 3 ? 6_700_000 : 280_000 + offset * 160_000,
      offset === 3 ? 'Chuyến đi Đà Lạt' : 'Phim và giải trí',
    );
    if (offset % 3 === 0) {
      add(25, 'bank', 'health', 'expense', 480_000, 'Khám sức khỏe');
    }
  }
  return transactions;
}

function makeDebts(today) {
  const relative = (offset) => new Date(today.getTime() + offset * day);
  return [
    {
      wallet: 'bank',
      type: 'lend',
      person_name: 'Tuấn',
      amount: 1_200_000,
      due_date: relative(0),
      note: 'Cho bạn mượn để sửa xe',
      opened: relative(-17),
      payment: {
        wallet: 'bank',
        amount: 400_000,
        paid_at: relative(-5),
        note: 'Nhận lại một phần',
      },
    },
    {
      wallet: 'bank',
      type: 'borrow',
      person_name: 'Mai',
      amount: 750_000,
      due_date: relative(-3),
      note: 'Mượn tạm tiền mua sách',
      opened: relative(-21),
    },
    {
      wallet: 'cash',
      type: 'lend',
      person_name: 'Linh',
      amount: 300_000,
      due_date: relative(-7),
      note: 'Mua vé giúp bạn',
      opened: relative(-20),
      payment: {
        wallet: 'cash',
        amount: 300_000,
        paid_at: relative(-8),
        note: 'Đã nhận đủ',
      },
    },
    {
      wallet: 'bank',
      type: 'borrow',
      person_name: 'Huy',
      amount: 1_000_000,
      due_date: relative(12),
      note: 'Ứng trước tiền đặt chỗ',
      opened: relative(-2),
    },
  ];
}

function demoBalances(transactions, debts) {
  const balances = Object.fromEntries(
    Object.entries(walletSpecs).map(([key, wallet]) => [key, wallet.balance]),
  );
  for (const row of transactions) {
    balances[row.wallet] += row.type === 'income' ? row.amount : -row.amount;
  }
  for (const { wallet, type, amount, payment } of debts) {
    const sign = type === 'borrow' ? 1 : -1;
    balances[wallet] += sign * amount;
    if (payment) balances[payment.wallet] -= sign * payment.amount;
  }
  return balances;
}

async function seedDemo(prisma) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (
      existing.name !== name ||
      !(await bcrypt.compare(password, existing.password_hash))
    ) {
      throw new Error(
        'Email demo đã có tài khoản khác. Dữ liệu hiện tại được giữ nguyên.',
      );
    }
    console.log('Tài khoản mẫu đã có. Giữ nguyên các giao dịch bạn đã thử.');
    return;
  }

  const today = vietnamDate();
  const transactions = makeTransactions(today);
  const debts = makeDebts(today);
  const balances = demoBalances(transactions, debts);
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: { email, name, password_hash: passwordHash },
      });
      const wallets = {};
      const categories = {};
      for (const [key, spec] of Object.entries(walletSpecs)) {
        const wallet = await tx.wallet.create({
          data: {
            ...spec,
            user_id: user.id,
            balance: balances[key],
            currency: 'VND',
          },
        });
        wallets[key] = wallet.id;
      }
      for (const [key, name, type, icon, color, parent] of categorySpecs) {
        const category = await tx.category.create({
          data: {
            user_id: user.id,
            name,
            type,
            icon,
            color,
            parent_id: parent ? categories[parent] : null,
          },
        });
        categories[key] = category.id;
      }
      await tx.transaction.createMany({
        data: transactions.map(({ wallet, category, ...transaction }) => ({
          ...transaction,
          user_id: user.id,
          wallet_id: wallets[wallet],
          category_id: categories[category],
        })),
      });
      const month = today.getUTCMonth() + 1;
      const year = today.getUTCFullYear();
      await tx.budget.createMany({
        data: [
          { category_id: categories.food, amount: 2_000_000 },
          { category_id: categories.home, amount: 6_400_000 },
          { category_id: categories.transport, amount: 1_200_000 },
        ].map((budget) => ({ ...budget, user_id: user.id, month, year })),
      });
      for (const { wallet, opened, payment, ...debt } of debts) {
        const remaining = debt.amount - (payment?.amount ?? 0);
        const status =
          remaining === 0
            ? 'completed'
            : debt.due_date < today
              ? 'overdue'
              : payment
                ? 'partial'
                : 'unpaid';
        const record = await tx.debt.create({
          data: {
            ...debt,
            user_id: user.id,
            wallet_id: wallets[wallet],
            created_at: opened,
            status,
            remaining,
          },
        });
        if (payment) {
          const { wallet, ...recordedPayment } = payment;
          await tx.debtPayment.create({
            data: {
              ...recordedPayment,
              debt_id: record.id,
              wallet_id: wallets[wallet],
            },
          });
        }
      }
    },
    { timeout: 20_000 },
  );
  console.log(
    'Đã thêm dữ liệu mẫu: ' +
      transactions.length +
      ' giao dịch trong 6 tháng, 3 ví, 3 ngân sách và 4 khoản nợ.',
  );
}

async function main() {
  const database = new URL(process.env.DATABASE_URL ?? 'mysql://localhost');
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '[::1]', 'mysql'].includes(database.hostname)
  ) {
    throw new Error(
      'Chỉ tạo dữ liệu mẫu trong cơ sở dữ liệu phát triển cục bộ.',
    );
  }
  const prisma = new PrismaClient();
  try {
    await seedDemo(prisma);
    console.log('Email: ' + email);
    console.log('Mật khẩu mẫu: ' + password);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error(
        'Tài khoản mẫu vừa được tạo bởi tiến trình khác. Hãy chạy lại lệnh.',
      );
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    'Không thể tạo tài khoản mẫu: ' + (error.code || error.message),
  );
  process.exitCode = 1;
});
