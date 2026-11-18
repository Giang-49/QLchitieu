const login = document.getElementById("form-login");
const register = document.getElementById("form-register");
const loginTab = document.getElementById("tab-login");
const registerTab = document.getElementById("tab-register");
const errorBox = document.getElementById("auth-error");

function setMode(signUp) {
  login.hidden = signUp;
  register.hidden = !signUp;
  errorBox.hidden = true;
  loginTab.classList.toggle("active", !signUp);
  registerTab.classList.toggle("active", signUp);
  loginTab.setAttribute("aria-pressed", String(!signUp));
  registerTab.setAttribute("aria-pressed", String(signUp));
  document.getElementById("auth-heading").textContent = signUp
    ? "Tạo tài khoản SmartMoney"
    : "Đăng nhập vào SmartMoney";
  document.title = (signUp ? "Đăng ký" : "Đăng nhập") + " · SmartMoney";
}

loginTab.onclick = () => setMode(false);
registerTab.onclick = () => setMode(true);
for (const toggle of document.querySelectorAll(".password-toggle")) {
  toggle.onclick = () => {
    const form = toggle.closest("form");
    const reveal = form.elements.password.type === "password";
    form.elements.password.type = reveal ? "text" : "password";
    if (form.elements.confirm)
      form.elements.confirm.type = reveal ? "text" : "password";
    toggle.textContent = reveal ? "Ẩn mật khẩu" : "Hiện mật khẩu";
  };
}

for (const form of [login, register]) {
  form.onsubmit = async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const data = new FormData(form);
    const email = data.get("email").trim();
    const password = data.get("password");
    const button = form.querySelector('[type="submit"]');
    const controls = [button, loginTab, registerTab, demoButton];
    for (const control of controls) control.disabled = true;
    try {
      if (form === register) {
        const name = data.get("name").trim();
        if (!name) throw new Error("Vui lòng nhập họ và tên.");
        if (password !== data.get("confirm"))
          throw new Error("Mật khẩu xác nhận chưa khớp.");
        await API.register(name, email, password);
      } else {
        await API.login(email, password, data.has("remember"));
      }
      location.replace("index.html");
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    } finally {
      for (const control of controls) control.disabled = false;
    }
  };
}

const demoButton = document.getElementById("demo-login");
if (CONFIG.DEMO_ENABLED) {
  demoButton.hidden = false;
  demoButton.addEventListener("click", () => {
    setMode(false);
    login.elements.email.value = "demo@sochi.test";
    login.elements.password.value = "SoChiDemo2026!";
    login.elements.remember.checked = false;
    login.requestSubmit();
  });
}

if (API.isAuthenticated()) location.replace("index.html");
else
  API.checkBackendHealth().then((online) => {
    if (online) return;
    const status = document.getElementById("connection");
    status.textContent = "Không kết nối được máy chủ. Vui lòng thử lại sau.";
    status.hidden = false;
  });
