// ─────────────────────────────────────────
//   CineVerse — signin.js
// ─────────────────────────────────────────

import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

function togglePassword() {
  const passwordInput = document.getElementById("password");
  const checkbox = document.getElementById("showPass");
  passwordInput.type = checkbox.checked ? "text" : "password";
}

async function login(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = document.querySelector(".btn");

  btn.textContent = "Signing in...";
  btn.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "index.html";
  } catch (error) {
    btn.textContent = "Sign in";
    btn.disabled = false;

    switch (error.code) {
      case "auth/user-not-found":
        alert("No account found with this email.");
        break;
      case "auth/wrong-password":
        alert("Incorrect password. Please try again.");
        break;
      case "auth/invalid-email":
        alert("Please enter a valid email address.");
        break;
      case "auth/too-many-requests":
        alert("Too many failed attempts. Please try again later.");
        break;
      default:
        alert("Sign in failed: " + error.message);
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
    window.location.href = "index.html";
  } catch (error) {
    btn.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" /> Continue with Google`;
    btn.disabled = false;

    if (error.code !== "auth/popup-closed-by-user") {
      alert("Google sign in failed: " + error.message);
    }
  }
}

window.togglePassword = togglePassword;
window.login = login;
window.loginWithGoogle = loginWithGoogle;
