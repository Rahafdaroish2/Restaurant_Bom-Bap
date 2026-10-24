function setActiveAuthForm(activeFormId, inactiveFormId) {
  document.getElementById(inactiveFormId).classList.remove("active");
  document.getElementById(activeFormId).classList.add("active");
}

// Keep these entry points available to the existing inline click handlers.
function showLoginForm() {
  setActiveAuthForm("login-form", "register-form");
}

function showRegisterForm() {
  setActiveAuthForm("register-form", "login-form");
}
