function togglePassword() {
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const checkbox = document.getElementById("showPass");

  const type = checkbox.checked ? "text" : "password";
  password.type = type;
  confirmPassword.type = type;
}
