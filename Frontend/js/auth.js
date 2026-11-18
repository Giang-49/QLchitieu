/**
 * LOGIC ĐIỀU KHIỂN GIAO DIỆN ĐĂNG NHẬP & ĐĂNG KÝ
 */
document.addEventListener('DOMContentLoaded', () => {
  // Nếu đã đăng nhập từ trước, tự động chuyển đến dashboard
  if (API.isAuthenticated()) {
    // Có thể cho chuyển hướng ngay hoặc để người dùng tự do xem
  }

  // DOM Elements
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const alertBanner = document.getElementById('alert-banner');
  const alertMessage = document.getElementById('alert-message');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  // Input fields Login
  const loginEmail = document.getElementById('login-email');
  const loginPass = document.getElementById('login-password');
  const btnLogin = document.getElementById('btn-login');

  // Input fields Register
  const regName = document.getElementById('reg-name');
  const regEmail = document.getElementById('reg-email');
  const regPass = document.getElementById('reg-password');
  const regPassConfirm = document.getElementById('reg-password-confirm');
  const btnRegister = document.getElementById('btn-register');

  // Kiểm tra trạng thái Backend
  checkBackendStatus();

  // Tab switching
  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));

  function switchTab(tab) {
    hideAlert();
    clearErrors();
    if (tab === 'login') {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.classList.add('active');
      formRegister.classList.remove('active');
    } else {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formRegister.classList.add('active');
      formLogin.classList.remove('active');
    }
  }

  // Toggle Password Visibility
  document.querySelectorAll('.toggle-password-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Thay đổi icon mắt mở / đóng
      this.innerHTML = isPassword
        ? `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`
        : `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
    });
  });

  // Xử lý SUBMIT ĐĂNG NHẬP
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    clearErrors();

    const email = loginEmail.value.trim();
    const password = loginPass.value;

    let hasError = false;
    if (!validateEmail(email)) {
      showFieldError('login-email-error', 'Vui lòng nhập định dạng email hợp lệ');
      loginEmail.classList.add('input-error');
      hasError = true;
    }
    if (!password || password.length < 6) {
      showFieldError('login-pass-error', 'Mật khẩu phải có ít nhất 6 ký tự');
      loginPass.classList.add('input-error');
      hasError = true;
    }

    if (hasError) return;

    setLoading(btnLogin, true);

    try {
      const result = await API.login(email, password);
      showAlert('success', result.message || 'Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 900);
    } catch (err) {
      showAlert('error', err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(btnLogin, false);
    }
  });

  // Xử lý SUBMIT ĐĂNG KÝ
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    clearErrors();

    const name = regName.value.trim();
    const email = regEmail.value.trim();
    const password = regPass.value;
    const confirm = regPassConfirm.value;

    let hasError = false;
    if (!validateEmail(email)) {
      showFieldError('reg-email-error', 'Vui lòng nhập email hợp lệ');
      regEmail.classList.add('input-error');
      hasError = true;
    }
    if (!password || password.length < 6) {
      showFieldError('reg-pass-error', 'Mật khẩu phải có ít nhất 6 ký tự');
      regPass.classList.add('input-error');
      hasError = true;
    }
    if (password !== confirm) {
      showFieldError('reg-confirm-error', 'Mật khẩu xác nhận không khớp');
      regPassConfirm.classList.add('input-error');
      hasError = true;
    }

    if (hasError) return;

    setLoading(btnRegister, true);

    try {
      const result = await API.register(name, email, password);
      showAlert('success', 'Đăng ký thành công! Hệ thống đã tạo sẵn Ví tiền mặt & Danh mục ban đầu.');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (err) {
      showAlert('error', err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(btnRegister, false);
    }
  });

  // Điền nhanh tài khoản mẫu
  const btnDemo = document.getElementById('btn-fill-demo');
  if (btnDemo) {
    btnDemo.addEventListener('click', () => {
      switchTab('login');
      loginEmail.value = 'user@qlchitieu.vn';
      loginPass.value = 'password123';
      showAlert('success', 'Đã điền thông tin tài khoản mẫu. Nhấn "Đăng nhập ngay".');
    });
  }

  // Helper Functions
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showFieldError(elemId, message) {
    const el = document.getElementById(elemId);
    if (el) el.textContent = message;
  }

  function clearErrors() {
    document.querySelectorAll('.field-error-msg').forEach((el) => (el.textContent = ''));
    document.querySelectorAll('.input-field').forEach((el) => el.classList.remove('input-error'));
  }

  function showAlert(type, message) {
    alertBanner.className = `alert-banner ${type}`;
    alertMessage.textContent = message;
  }

  function hideAlert() {
    alertBanner.className = 'alert-banner';
    alertMessage.textContent = '';
  }

  function setLoading(btn, isLoading) {
    if (isLoading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  async function checkBackendStatus() {
    statusDot.className = 'status-dot';
    statusText.textContent = 'Đang kiểm tra backend...';
    const isOnline = await API.checkBackendHealth();
    if (isOnline) {
      statusDot.className = 'status-dot online';
      statusText.textContent = 'Backend: Sẵn sàng (Port 3000)';
    } else {
      statusDot.className = 'status-dot offline';
      statusText.textContent = 'Backend: Chưa kết nối (Port 3000)';
    }
  }
});
