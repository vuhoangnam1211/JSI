// ─────────────────────────────────────────
//   CineVerse — signup.js
// ─────────────────────────────────────────

import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

function togglePassword() {
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const checkbox = document.getElementById("showPass");
  const type = checkbox.checked ? "text" : "password";
  password.type = type;
  confirmPassword.type = type;
}

async function register() {
  const fullname = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const btn = document.querySelector(".btn");

  if (!fullname) {
    alert("Please enter your full name.");
    return;
  }
  if (!email) {
    alert("Please enter your email.");
    return;
  }
  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  btn.textContent = "Creating account...";
  btn.disabled = true;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await updateProfile(userCredential.user, { displayName: fullname });
    alert("Account created successfully! Please sign in.");
    window.location.href = "signin.html";
  } catch (error) {
    btn.textContent = "Sign up";
    btn.disabled = false;

    switch (error.code) {
      case "auth/email-already-in-use":
        alert("This email is already registered. Please sign in instead.");
        break;
      case "auth/invalid-email":
        alert("Please enter a valid email address.");
        break;
      case "auth/weak-password":
        alert("Password is too weak. Use at least 6 characters.");
        break;
      default:
        alert("Sign up failed: " + error.message);
    }
  }
}

async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const btn = document.querySelector(".btn-google");

  btn.textContent = "Signing in...";
  btn.disabled = true;

  try {
    await signInWithPopup(auth, provider);
    // Google accounts don't need a separate sign up step —
    // Firebase creates the account automatically on first sign in
    window.location.href = "main.html";
  } catch (error) {
    btn.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" /> Continue with Google`;
    btn.disabled = false;

    if (error.code !== "auth/popup-closed-by-user") {
      alert("Google sign up failed: " + error.message);
    }
  }
}

window.togglePassword = togglePassword;
window.register = register;
window.loginWithGoogle = loginWithGoogle;
