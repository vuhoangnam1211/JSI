function togglePassword() {
  const passwordInput = document.getElementById("password");
  const checkbox = document.getElementById("showPass");

  passwordInput.type = checkbox.checked ? "text" : "password";
}