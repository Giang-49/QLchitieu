/**
 * MODULE GIAO TIẾP VỚI BACKEND API (FETCH CLIENT)
 */
const API = {
  /**
   * Lưu thông tin đăng nhập vào LocalStorage
   */
  saveAuth(accessToken, user) {
    if (accessToken) localStorage.setItem(CONFIG.TOKEN_KEY, accessToken);
    if (user) localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  },

  /**
   * Lấy JWT Access Token từ LocalStorage
   */
  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  /**
   * Lấy thông tin User hiện tại từ LocalStorage
   */
  getUser() {
    const raw = localStorage.getItem(CONFIG.USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Kiểm tra người dùng đã đăng nhập chưa
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Đăng xuất: Xóa sạch dữ liệu trong LocalStorage
   */
  logout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    window.location.href = 'index.html';
  },

  /**
   * Hàm gọi API chung với Timeout & Exception handling
   */
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      let payload = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        const text = await response.text();
        payload = { message: text };
      }

      if (!response.ok) {
        // Backend trả về format chuẩn { success: false, message: ... }
        const errMsg = payload?.message || `Lỗi máy chủ (${response.status})`;
        throw new Error(errMsg);
      }

      return payload;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('Hết thời gian chờ kết nối máy chủ backend (Timeout).');
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error(
          'Không thể kết nối đến máy chủ Backend tại ' +
            CONFIG.API_BASE_URL +
            '. Vui lòng kiểm tra Backend đã được khởi chạy chưa (PORT 3000).'
        );
      }
      throw err;
    }
  },

  /**
   * Kiểm tra kết nối nhanh tới Backend
   */
  async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
        method: 'OPTIONS',
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.status < 500;
    } catch {
      return false;
    }
  },

  /**
   * API Đăng nhập
   * POST /api/v1/auth/login
   */
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res?.data?.access_token) {
      this.saveAuth(res.data.access_token, res.data.user);
    }
    return res;
  },

  /**
   * API Đăng ký tài khoản
   * POST /api/v1/auth/register
   */
  async register(name, email, password) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (res?.data?.access_token) {
      this.saveAuth(res.data.access_token, res.data.user);
    }
    return res;
  },

  /**
   * API Lấy thông tin tài khoản hiện tại
   * GET /api/v1/auth/profile
   */
  async getProfile() {
    return this.request('/auth/profile', { method: 'GET' });
  },

  /**
   * API Lấy danh sách ví (để kiểm tra sau khi đăng nhập thành công)
   * GET /api/v1/wallets
   */
  async getWallets() {
    return this.request('/wallets', { method: 'GET' });
  },

  /**
   * API Lấy danh sách danh mục
   * GET /api/v1/categories
   */
  async getCategories() {
    return this.request('/categories', { method: 'GET' });
  },

  /**
   * API Lấy danh sách giao dịch (lọc theo from, to, walletId, categoryId, type)
   * GET /api/v1/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async getTransactions(params = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return this.request('/transactions' + (qs ? '?' + qs : ''), { method: 'GET' });
  },

  /**
   * API Thêm giao dịch mới
   * POST /api/v1/transactions
   */
  async createTransaction(data) {
    return this.request('/transactions', { method: 'POST', body: JSON.stringify(data) });
  },
};
