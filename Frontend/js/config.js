/**
 * CẤU HÌNH HỆ THỐNG FRONTEND QLchitieu
 * Kết nối với Backend NestJS RESTful API
 */
const CONFIG = {
  // Địa chỉ máy chủ Backend (chạy mặc định cổng 3000, prefix /api/v1)
  API_BASE_URL: 'http://localhost:3000/api/v1',
  
  // Key lưu trữ trong LocalStorage
  TOKEN_KEY: 'qlchitieu_access_token',
  USER_KEY: 'qlchitieu_user_info',

  // Thời gian chờ phản hồi tối đa (ms)
  TIMEOUT_MS: 8000,
};
