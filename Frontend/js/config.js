const CONFIG = Object.freeze({
  API_BASE_URL: globalThis.SMARTMONEY_RUNTIME?.apiBase || 'http://localhost:3000/api/v1',
  DEMO_ENABLED: globalThis.SMARTMONEY_RUNTIME?.demo ?? ['localhost', '127.0.0.1'].includes(location.hostname),
  TOKEN_KEY: 'qlchitieu_access_token',
  USER_KEY: 'qlchitieu_user_info',
  TIMEOUT_MS: 15000,
});
