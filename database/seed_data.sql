-- ============================================================
-- Sample Seed Data: Hệ Thống Quản Lý Chi Tiêu Cá Nhân (QLchitieu)
-- Database: MySQL 8.0+ / PostgreSQL
-- ============================================================

USE qlchitieu;

-- 1. Tài khoản mẫu (Mật khẩu mặc định: 'password123' đã băm bằng bcrypt)
INSERT INTO users (id, email, password_hash, name) VALUES
(1, 'demo@qlchitieu.vn', '$2a$12$e8Y5t1d1w1vjL9fUoVqFie3Q8kO8YvQJ/M4i7bJ7y8m8G9h8.2K1e', 'Nguyễn Văn Demo')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Ví nguồn tiền mẫu
INSERT INTO wallets (id, user_id, name, balance, type, currency) VALUES
(1, 1, 'Ví tiền mặt', 2500000.00, 'cash', 'VND'),
(2, 1, 'Tài khoản Techcombank', 18500000.00, 'bank', 'VND'),
(3, 1, 'Ví điện tử MoMo', 850000.00, 'ewallet', 'VND')
ON DUPLICATE KEY UPDATE balance=VALUES(balance);

-- 3. Danh mục thu chi mẫu (bao gồm quan hệ cha - con)
-- Danh mục cha Chi phí
INSERT INTO categories (id, user_id, name, icon, color, type, parent_id) VALUES
(1, 1, 'Ăn uống', 'utensils', '#E11D48', 'expense', NULL),
(2, 1, 'Đi lại & Xăng xe', 'car', '#2563EB', 'expense', NULL),
(3, 1, 'Mua sắm & Sinh hoạt', 'shopping-bag', '#7C3AED', 'expense', NULL),
(4, 1, 'Hóa đơn & Tiện ích', 'receipt', '#D97706', 'expense', NULL),
(5, 1, 'Giải trí & Du lịch', 'film', '#059669', 'expense', NULL)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Danh mục con của Ăn uống (id = 1)
INSERT INTO categories (id, user_id, name, icon, color, type, parent_id) VALUES
(6, 1, 'Cà phê & Trà sữa', 'coffee', '#F43F5E', 'expense', 1),
(7, 1, 'Đi chợ & Siêu thị', 'shopping-cart', '#FB7185', 'expense', 1),
(8, 1, 'Ăn ngoài hàng', 'award', '#FDA4AF', 'expense', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Danh mục Thu nhập
INSERT INTO categories (id, user_id, name, icon, color, type, parent_id) VALUES
(9, 1, 'Lương chính thức', 'briefcase', '#16A34A', 'income', NULL),
(10, 1, 'Thưởng & Nghề phụ (Freelance)', 'dollar-sign', '#10B981', 'income', NULL),
(11, 1, 'Thu lãi & Cổ tức', 'trending-up', '#047857', 'income', NULL)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Giao dịch mẫu
INSERT INTO transactions (id, user_id, wallet_id, category_id, type, amount, note, transaction_date) VALUES
(1, 1, 2, 9, 'income', 22000000.00, 'Nhận lương tháng 11/2026', '2026-11-01 09:00:00'),
(2, 1, 1, 1, 'expense', 45000.00, 'Bún bò Huế ăn sáng', '2026-11-02 07:30:00'),
(3, 1, 3, 6, 'expense', 55000.00, 'Highlands Coffee cùng đồng nghiệp', '2026-11-03 14:15:00'),
(4, 1, 2, 4, 'expense', 850000.00, 'Thanh toán tiền điện và Internet', '2026-11-05 19:40:00'),
(5, 1, 2, 2, 'expense', 120000.00, 'Đổ xăng xe máy', '2026-11-06 08:20:00')
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- 5. Hạn mức ngân sách tháng 11/2026
INSERT INTO budgets (id, user_id, category_id, amount, month, year) VALUES
(1, 1, 1, 4500000.00, 11, 2026), -- Hạn mức Ăn uống 4.500.000 VND
(2, 1, 2, 1200000.00, 11, 2026), -- Hạn mức Đi lại 1.200.000 VND
(3, 1, 3, 2000000.00, 11, 2026)  -- Hạn mức Mua sắm 2.000.000 VND
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- 6. Sổ nợ mẫu
INSERT INTO debts (id, user_id, wallet_id, type, person_name, amount, remaining, due_date, status, note) VALUES
(1, 1, 1, 'lend', 'Nguyễn Văn Tuấn', 2000000.00, 1000000.00, '2026-11-20', 'partial', 'Cho Tuấn mượn tiền đóng tiền nhà'),
(2, 1, 2, 'borrow', 'Trần Thị Mai', 5000000.00, 5000000.00, '2026-12-05', 'unpaid', 'Vay tiền Mai mua laptop mới')
ON DUPLICATE KEY UPDATE remaining=VALUES(remaining);

-- 7. Lịch sử trả nợ mẫu
INSERT INTO debt_payments (id, debt_id, wallet_id, amount, note, paid_at) VALUES
(1, 1, 1, 1000000.00, 'Tuấn trả trước đợt 1 bằng tiền mặt', '2026-11-07 10:00:00')
ON DUPLICATE KEY UPDATE amount=VALUES(amount);
