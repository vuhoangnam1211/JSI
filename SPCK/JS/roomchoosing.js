// ─────────────────────────────────────────
//   CineVerse — roomchoosing.js
// ─────────────────────────────────────────

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// ── Auth nav bar ──
onAuthStateChanged(auth, (user) => {
  const nav = document.querySelector("nav");
  if (user) {
    nav.innerHTML = `
      <a href="main.html">Home</a>
      <a href="#" class="btn-logout" id="logoutBtn">Log Out</a>
    `;
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "../SPCK/HTML/signin.html";
    });
  } else {
    nav.innerHTML = `
      <a href="main.html">Home</a>
      <a href="/SPCK/HTML/signin.html" class="btn-logout">Sign In</a>
      <a href="/SPCK/HTML/signup.html" class="btn-logout">Sign Up</a>
    `;
  }
});

// ── Read movie data from URL ──
const params = new URLSearchParams(window.location.search);
const title = params.get("title") || "Unknown Movie";
const poster = params.get("poster") || "";
const genre = params.get("genre") || "";
const age = params.get("age") || "";
const duration = params.get("duration") || "";
const year = params.get("year") || "";

// ── Populate movie hero ──
document.getElementById("hero-poster").src = poster;
document.getElementById("hero-poster").alt = title;
document.getElementById("hero-title").textContent = title;
document.getElementById("hero-tags").innerHTML = `
  <span class="tag-pill accent">${age}</span>
  <span class="tag-pill">${genre}</span>
  <span class="tag-pill">${duration} min</span>
  <span class="tag-pill">${year}</span>
`;

// ── Date picker ──
const dateRow = document.getElementById("dateRow");
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const today = new Date();

for (let i = 0; i < 7; i++) {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  const btn = document.createElement("button");
  btn.className = "date-btn" + (i === 0 ? " active" : "");
  btn.innerHTML = `
    <span class="day-name">${days[d.getDay()]}</span>
    <span class="day-num">${d.getDate()}</span>
    <span class="month">${months[d.getMonth()]}</span>
  `;
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".date-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
  dateRow.appendChild(btn);
}

// ── Showtime chip click — navigate to seats with all data ──
document.querySelectorAll(".showtime-chip:not(.sold-out)").forEach((chip) => {
  chip.style.cursor = "pointer";
  chip.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent room card click

    const time = chip.dataset.time;
    const roomCard = chip.closest(".room-card");
    const room = roomCard.dataset.room;

    // Get selected date
    const activeDateBtn = document.querySelector(".date-btn.active");
    const dateText = activeDateBtn
      ? activeDateBtn.querySelector(".day-num").textContent +
        " " +
        activeDateBtn.querySelector(".month").textContent
      : "Today";

    const seatsParams = new URLSearchParams({
      title,
      poster,
      genre,
      age,
      duration,
      year,
      room,
      time,
      date: dateText,
    });

    window.location.href = `choosingseats.html?${seatsParams.toString()}`;
  });
});
