const API = {
  saveAuth(token, user, remember = true) {
    this.clearAuth();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(CONFIG.TOKEN_KEY, token);
    storage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  },

  clearAuth() {
    for (const storage of [sessionStorage, localStorage]) {
      storage.removeItem(CONFIG.TOKEN_KEY);
      storage.removeItem(CONFIG.USER_KEY);
    }
  },

  getToken() {
    return sessionStorage.getItem(CONFIG.TOKEN_KEY) || localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  getUser() {
    try {
      return JSON.parse(sessionStorage.getItem(CONFIG.USER_KEY) || localStorage.getItem(CONFIG.USER_KEY));
    } catch {
      return null;
    }
  },

  isAuthenticated() { return Boolean(this.getToken()); },

  logout() {
    this.clearAuth();
    location.replace('login.html');
  },

  query(params = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== '' && value != null) query.set(key, value);
    }
    return query.size ? '?' + query.toString() : '';
  },

  async request(endpoint, { method = 'GET', body, binary = false, publicRoute = false } = {}) {
    const headers = new Headers();
    const token = this.getToken();
    const multipart = body instanceof FormData;
    if (body !== undefined && !multipart) headers.set('Content-Type', 'application/json');
    if (token && !publicRoute) headers.set('Authorization', 'Bearer ' + token);

    try {
      const response = await fetch(CONFIG.API_BASE_URL + endpoint, {
        method,
        headers,
        body: multipart ? body : JSON.stringify(body),
        signal: AbortSignal.timeout(CONFIG.TIMEOUT_MS),
      });

      if (response.ok && binary) return await response.blob();
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 && token && !publicRoute) this.logout();
        const message = Array.isArray(payload.message) ? payload.message.join(' · ') : payload.message;
        const error = new Error(message || 'Yêu cầu không thành công (' + response.status + ').');
        error.status = response.status;
        throw error;
      }
      return payload;
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new Error('Máy chủ phản hồi quá lâu. Vui lòng thử lại.');
      }
      if (error instanceof TypeError) throw new Error('Không kết nối được máy chủ. Vui lòng thử lại.');
      throw error;
    }
  },

  async authenticate(path, body, remember) {
    const result = await this.request('/auth/' + path, { method: 'POST', body, publicRoute: true });
    if (!result.data?.access_token) throw new Error('Máy chủ không trả về phiên đăng nhập.');
    this.saveAuth(result.data.access_token, result.data.user, remember);
    return result;
  },

  login(email, password, remember) { return this.authenticate('login', { email, password }, remember); },
  register(name, email, password) { return this.authenticate('register', { name, email, password }); },

  async checkBackendHealth() {
    try {
      const response = await fetch(CONFIG.API_BASE_URL, { signal: AbortSignal.timeout(2500) });
      return response.ok && (response.headers.get('content-type') || '').includes('application/json');
    } catch {
      return false;
    }
  },

  get(path, filters) { return this.request(path + this.query(filters)); },
  post(path, body) { return this.request(path, { method: 'POST', body }); },
  put(path, body) { return this.request(path, { method: 'PUT', body }); },
  remove(path, filters) { return this.request(path + this.query(filters), { method: 'DELETE' }); },
  downloadExcel(filters) { return this.request('/reports/export-excel' + this.query(filters), { binary: true }); },
};
