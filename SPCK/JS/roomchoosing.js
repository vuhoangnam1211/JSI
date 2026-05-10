// ─────────────────────────────────────────
//   CineVerse — roomchoosing.js
// ─────────────────────────────────────────

import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// ─────────────────────────────────────────
//   ROOM CONFIG
// ─────────────────────────────────────────
const ROOM_CONFIG = {
  1: { type: "Standard", seats: 56, screen: "Standard Screen" },
  2: { type: "IMAX", seats: 120, screen: "IMAX Screen" },
  3: { type: "4DX", seats: 64, screen: "Motion Seats" },
  4: { type: "Standard", seats: 56, screen: "Standard Screen" },
  5: { type: "VIP", seats: 32, screen: "Premium Screen" },
  6: { type: "Standard", seats: 56, screen: "Standard Screen" },
  7: { type: "Dolby Atmos", seats: 80, screen: "Curved Screen" },
  8: { type: "Standard", seats: 56, screen: "Standard Screen" },
  9: { type: "Standard", seats: 56, screen: "Standard Screen" },
  10: { type: "VIP Lounge", seats: 24, screen: "Premium Screen" },
};

// ─────────────────────────────────────────
//   SCHEDULE PATTERNS
// ─────────────────────────────────────────
const ROOM_SCHEDULES = {
  1: [
    ["10:00", "13:30", "19:30"],
    ["09:00", "12:30", "16:00", "20:00"],
    ["11:00", "14:30", "18:00"],
    ["10:00", "13:00", "17:30", "21:00"],
    ["09:30", "12:00", "15:30", "19:00"],
    ["10:00", "14:00", "20:30"],
    ["11:30", "15:00", "18:30", "22:00"],
  ],
  2: [
    ["12:00", "15:30", "20:00"],
    ["10:00", "14:00", "18:30"],
    ["09:00", "13:00", "17:00", "21:00"],
    ["11:00", "15:00", "19:30"],
    ["10:30", "14:30", "20:00"],
    ["09:30", "13:30", "17:30"],
    ["12:00", "16:00", "21:30"],
  ],
  3: [
    ["17:30", "21:00"],
    ["13:00", "18:00"],
    ["14:30", "19:00"],
    ["11:30", "16:30", "21:00"],
    ["12:00", "17:00"],
    ["13:30", "18:30"],
    ["15:00", "20:00"],
  ],
  4: [
    ["10:30", "14:30", "18:00", "21:30"],
    ["09:00", "13:00", "17:00", "21:00"],
    ["10:00", "14:00", "18:30"],
    ["11:00", "15:00", "19:00"],
    ["09:30", "13:30", "17:30", "21:00"],
    ["10:30", "14:30", "19:30"],
    ["12:00", "16:00", "20:00"],
  ],
  5: [
    ["13:00", "20:30"],
    ["14:00", "19:00"],
    ["12:30", "18:00"],
    ["13:30", "20:00"],
    ["15:00", "21:00"],
    ["12:00", "17:30"],
    ["14:30", "19:30"],
  ],
  6: [
    ["09:30", "12:30", "16:30", "19:00"],
    ["10:00", "13:00", "17:00", "21:00"],
    ["09:00", "12:00", "16:00", "20:00"],
    ["10:30", "14:00", "18:00"],
    ["11:00", "15:00", "19:30"],
    ["09:30", "13:30", "17:30", "21:30"],
    ["10:00", "14:30", "19:00"],
  ],
  7: [
    ["14:00", "18:30", "22:00"],
    ["13:00", "17:00", "21:00"],
    ["12:00", "16:30", "20:30"],
    ["14:30", "18:00", "22:00"],
    ["13:30", "17:30", "21:30"],
    ["12:30", "16:00", "20:00"],
    ["14:00", "18:30", "22:30"],
  ],
  8: [
    ["19:00"],
    ["17:30", "21:30"],
    ["18:00", "22:00"],
    ["16:00", "20:30"],
    ["17:00", "21:00"],
    ["18:30"],
    ["19:30", "22:30"],
  ],
  9: [
    ["09:00", "13:00", "17:00", "21:00"],
    ["10:00", "14:00", "18:00", "22:00"],
    ["09:30", "13:30", "17:30", "21:30"],
    ["10:30", "14:30", "18:30"],
    ["09:00", "13:00", "17:00", "21:00"],
    ["11:00", "15:00", "19:00"],
    ["10:00", "14:00", "18:00", "22:00"],
  ],
  10: [
    ["12:00", "16:00", "20:00"],
    ["13:00", "17:00", "21:00"],
    ["12:30", "16:30", "20:30"],
    ["14:00", "18:00"],
    ["13:30", "17:30", "21:30"],
    ["12:00", "16:00", "20:00"],
    ["14:30", "19:00"],
  ],
};

const MONTHS = [
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

function getNext7Dates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      label: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
      dayIndex: i,
    });
  }
  return dates;
}

// ─────────────────────────────────────────
//   AUTO-GENERATE missing schedules
// ─────────────────────────────────────────
async function ensureSchedulesExist(movieTitle) {
  const dates = getNext7Dates();
  const q = query(
    collection(db, "schedules"),
    where("movie", "==", movieTitle),
  );
  const snapshot = await getDocs(q);

  const existing = new Set();
  snapshot.forEach((d) => existing.add(`${d.data().room}|${d.data().date}`));

  const missing = [];
  for (const [roomNum, schedule] of Object.entries(ROOM_SCHEDULES)) {
    for (let i = 0; i < dates.length; i++) {
      if (!existing.has(`${roomNum}|${dates[i].label}`)) {
        missing.push({
          movie: movieTitle,
          room: String(roomNum),
          date: dates[i].label,
          times: schedule[i],
        });
      }
    }
  }

  if (missing.length === 0) return;

  for (let i = 0; i < missing.length; i += 490) {
    const batch = writeBatch(db);
    missing.slice(i, i + 490).forEach((entry) => {
      batch.set(doc(collection(db, "schedules")), entry);
    });
    await batch.commit();
  }
}

// ─────────────────────────────────────────
//   AUTH NAV BAR
// ─────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  const nav = document.querySelector("nav");
  if (user) {
    nav.innerHTML = `
      <a href="main.html">Home</a>
      <a href="#" class="btn-logout" id="logoutBtn">Log Out</a>
    `;
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "../HTML/signin.html";
    });
  } else {
    nav.innerHTML = `
      <a href="main.html">Home</a>
      <a href="../HTML/signin.html" class="btn-logout">Sign In</a>
      <a href="../HTML/signup.html" class="btn-logout">Sign Up</a>
    `;
  }
});

// ─────────────────────────────────────────
//   MOVIE HERO
// ─────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const title = params.get("title") || "Unknown Movie";
const poster = params.get("poster") || "";
const genre = params.get("genre") || "";
const age = params.get("age") || "";
const duration = params.get("duration") || "";
const year = params.get("year") || "";

document.getElementById("hero-poster").src = poster;
document.getElementById("hero-poster").alt = title;
document.getElementById("hero-title").textContent = title;
document.getElementById("hero-tags").innerHTML = `
  <span class="tag-pill accent">${age}</span>
  <span class="tag-pill">${genre}</span>
  <span class="tag-pill">${duration} min</span>
  <span class="tag-pill">${year}</span>
`;

// ─────────────────────────────────────────
//   DATE PICKER
// ─────────────────────────────────────────
const dateRow = document.getElementById("dateRow");
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = new Date();
const dateObjects = getNext7Dates();

dateObjects.forEach(({ label }, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  const btn = document.createElement("button");
  btn.className = "date-btn" + (i === 0 ? " active" : "");
  btn.dataset.date = label;
  btn.innerHTML = `
    <span class="day-name">${days[d.getDay()]}</span>
    <span class="day-num">${d.getDate()}</span>
    <span class="month">${MONTHS[d.getMonth()]}</span>
  `;
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".date-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedChip = null; // reset selection when date changes
    renderRooms(label);
  });
  dateRow.appendChild(btn);
});

// ─────────────────────────────────────────
//   SELECTED CHIP STATE
//   Tracks which chip was clicked first
// ─────────────────────────────────────────
let selectedChip = null; // { roomNum, time, element }

// ─────────────────────────────────────────
//   RENDER ROOMS
// ─────────────────────────────────────────
let renderToken = 0;

async function renderRooms(dateLabel) {
  const myToken = ++renderToken;
  const grid = document.getElementById("roomsGrid");
  grid.innerHTML = `<p style="color:var(--text-muted);padding:20px;">Loading schedules...</p>`;

  await ensureSchedulesExist(title);
  if (myToken !== renderToken) return;

  const q = query(
    collection(db, "schedules"),
    where("movie", "==", title),
    where("date", "==", dateLabel),
  );
  const snapshot = await getDocs(q);
  if (myToken !== renderToken) return;

  const scheduleMap = {};
  snapshot.forEach((d) => {
    scheduleMap[d.data().room] = d.data().times;
  });

  grid.innerHTML = "";

  for (let roomNum = 1; roomNum <= 10; roomNum++) {
    const cfg = ROOM_CONFIG[roomNum];
    const times = scheduleMap[String(roomNum)] || [];

    // Count booked seats overall for availability bar
    const bookedQ = query(
      collection(db, "bookings"),
      where("room", "==", String(roomNum)),
      where("date", "==", dateLabel),
      where("movie", "==", title),
    );
    const bookedSnap = await getDocs(bookedQ);
    if (myToken !== renderToken) return;

    let bookedCount = 0;
    bookedSnap.forEach((d) => {
      bookedCount += Array.isArray(d.data().seats) ? d.data().seats.length : 1;
    });

    const seatsLeft = cfg.seats - bookedCount;
    const pct = Math.max(0, Math.round((seatsLeft / cfg.seats) * 100));
    const barClass = pct > 50 ? "high" : pct > 20 ? "mid" : "low";

    const chipsHtml =
      times
        .map((t) => `<span class="showtime-chip" data-time="${t}">${t}</span>`)
        .join("") ||
      `<span style="font-size:12px;color:var(--text-muted)">No showtimes</span>`;

    const card = document.createElement("div");
    card.className = "room-card";
    card.dataset.room = roomNum;
    card.dataset.type = cfg.type;
    card.innerHTML = `
      <div class="room-number">${String(roomNum).padStart(2, "0")}</div>
      <div class="room-type">${cfg.type}</div>
      <div class="room-info-row">
        <div class="room-info-item">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          ${cfg.seats} seats total
        </div>
        <div class="room-info-item">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          ${cfg.screen}
        </div>
      </div>
      <div class="room-availability">
        <div class="avail-bar-wrap">
          <div class="avail-bar ${barClass}" style="width:${pct}%"></div>
        </div>
        <span class="avail-text" id="availText-${roomNum}">${seatsLeft} left</span>
      </div>
      <div class="showtime-chips" id="chips-${roomNum}">${chipsHtml}</div>
    `;

    // ── Showtime chip click logic ──
    card.querySelectorAll(".showtime-chip").forEach((chip) => {
      chip.style.cursor = "pointer";
      chip.addEventListener("click", async (e) => {
        e.stopPropagation();
        const time = chip.dataset.time;
        const activeDateBtn = document.querySelector(".date-btn.active");
        const dateLabel = activeDateBtn
          ? activeDateBtn.dataset.date
          : dateObjects[0].label;

        const isSameChip =
          selectedChip &&
          selectedChip.roomNum === roomNum &&
          selectedChip.time === time;

        if (isSameChip) {
          // ── SECOND CLICK → navigate to seat selection ──
          const seatsParams = new URLSearchParams({
            title,
            poster,
            genre,
            age,
            duration,
            year,
            room: String(roomNum),
            time,
            date: dateLabel,
          });
          window.location.href = `choosingseats.html?${seatsParams.toString()}`;
          return;
        }

        // ── FIRST CLICK → deselect old, select this chip, show seats left for this time ──

        // Deselect previously selected chip visually
        if (selectedChip && selectedChip.element) {
          selectedChip.element.classList.remove("chip-selected");
          // Restore old avail text
          const oldAvailEl = document.getElementById(
            `availText-${selectedChip.roomNum}`,
          );
          if (oldAvailEl)
            oldAvailEl.textContent = `${selectedChip.prevSeatsLeft} left`;
        }

        // Mark this chip as selected
        chip.classList.add("chip-selected");

        // Count booked seats specifically for this time
        const timeBookedQ = query(
          collection(db, "bookings"),
          where("movie", "==", title),
          where("room", "==", String(roomNum)),
          where("date", "==", dateLabel),
          where("time", "==", time),
        );
        const timeBookedSnap = await getDocs(timeBookedQ);
        let timeBooked = 0;
        timeBookedSnap.forEach((d) => {
          timeBooked += Array.isArray(d.data().seats)
            ? d.data().seats.length
            : 1;
        });

        const timeSeatsLeft = cfg.seats - timeBooked;
        const availEl = document.getElementById(`availText-${roomNum}`);
        const prevSeatsLeft = timeSeatsLeft; // save for restore

        if (availEl) {
          availEl.textContent = `${timeSeatsLeft} left for ${time}`;
        }

        selectedChip = { roomNum, time, element: chip, prevSeatsLeft };
      });
    });

    grid.appendChild(card);
  }
}

// Load today on page load
renderRooms(dateObjects[0].label);
