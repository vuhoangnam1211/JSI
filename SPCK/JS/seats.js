// ─────────────────────────────────────────
//   CineVerse — seats.js
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
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

(function () {
  "use strict";

  // ── Configuration ──
  const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const SEATS_PER_ROW = 8;
  const TICKET_PRICE = 12.5;
  const VIP_PRICE = 18.0;
  const VIP_ROWS = ["G", "H"];

  const ROOM_TYPES = {
    1: "Standard",
    2: "IMAX",
    3: "4DX",
    4: "Standard",
    5: "VIP",
    6: "Standard",
    7: "Dolby Atmos",
    8: "Standard",
    9: "Standard",
    10: "VIP Lounge",
  };

  // ── Read data from URL ──
  const params = new URLSearchParams(window.location.search);
  const title = params.get("title") || "Unknown Movie";
  const poster = params.get("poster") || "";
  const genre = params.get("genre") || "";
  const age = params.get("age") || "";
  const duration = params.get("duration") || "";
  const year = params.get("year") || "";
  const roomNum = params.get("room") || "1";
  const time = params.get("time") || "—";
  const date = params.get("date") || "Today";
  const roomType = ROOM_TYPES[roomNum] || "Standard";

  // ── State ──
  let selectedSeats = new Set();
  let takenSeats = new Set(); // loaded from Firestore
  let mySeats = new Set(); // seats booked by current user
  let currentUser = null;

  // ── DOM ──
  const seatGrid = document.getElementById("seatGrid");
  const roomBadge = document.getElementById("roomBadge");
  const selectedDisplay = document.getElementById("selectedDisplay");
  const totalPriceEl = document.getElementById("totalPrice");
  const confirmBtn = document.getElementById("confirmBtn");

  // ── Auth guard ──
  onAuthStateChanged(auth, async (user) => {
    const nav = document.querySelector("nav");
    currentUser = user;

    if (user) {
      nav.innerHTML = `
        <a href="main.html">Home</a>
        <a href="#" class="btn-logout" id="logoutBtn">Log Out</a>
      `;
      document
        .getElementById("logoutBtn")
        .addEventListener("click", async () => {
          await signOut(auth);
          window.location.href = "/SPCK/HTML/signin.html";
        });

      initPage();

      // Load taken seats from Firestore, then build grid
      seatGrid.innerHTML = `<p style="color:var(--text-muted);padding:20px;">Loading seats...</p>`;
      await loadTakenSeats();
      buildSeatGrid();

      if (confirmBtn) confirmBtn.addEventListener("click", handleConfirm);
    } else {
      nav.innerHTML = `
        <a href="main.html">Home</a>
        <a href="/SPCK/HTML/signin.html" class="btn-logout">Sign In</a>
        <a href="/SPCK/HTML/signup.html" class="btn-logout">Sign Up</a>
      `;
      seatGrid.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
          <p style="font-size:18px;font-weight:600;color:var(--text);margin-bottom:12px;">🔒 Please sign in to select seats</p>
          <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px;">You need an account to book tickets.</p>
          <a href="/SPCK/HTML/signin.html" style="background:var(--accent);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Sign In</a>
        </div>
      `;
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Sign in to confirm";
      }
      initPage();
    }
  });

  // ── Populate hero + summary ──
  function initPage() {
    const heroPoster = document.getElementById("hero-poster");
    const heroTitle = document.getElementById("hero-title");
    const heroTags = document.getElementById("hero-tags");

    if (heroPoster) {
      heroPoster.src = poster;
      heroPoster.alt = title;
    }
    if (heroTitle) heroTitle.textContent = title;
    if (heroTags)
      heroTags.innerHTML = `
      <span class="tag-pill accent">${age}</span>
      <span class="tag-pill">${genre}</span>
      <span class="tag-pill">${duration} min</span>
      <span class="tag-pill">Room ${roomNum}</span>
      <span class="tag-pill">${time}</span>
    `;

    const screenIcon = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
    if (roomBadge)
      roomBadge.innerHTML = `${screenIcon} Room ${roomNum} · ${roomType}`;

    const summaryMovie = document.getElementById("summaryMovie");
    const summaryRoom = document.getElementById("summaryRoom");
    const summaryDate = document.getElementById("summaryDate");
    const summaryTime = document.getElementById("summaryTime");

    if (summaryMovie) summaryMovie.textContent = title;
    if (summaryRoom) summaryRoom.textContent = `Room ${roomNum} · ${roomType}`;
    if (summaryDate) summaryDate.textContent = date;
    if (summaryTime) summaryTime.textContent = time;
  }

  // ── Load taken seats from Firestore ──
  // A seat is "taken" if it appears in any booking for this movie + room + date + time
  async function loadTakenSeats() {
    try {
      const q = query(
        collection(db, "bookings"),
        where("movie", "==", title),
        where("date", "==", date),
        where("time", "==", time),
      );
      const snapshot = await getDocs(q);

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Match room — bookings store "Room 1 · Standard" or just "1"
        const bookingRoom = String(data.room)
          .replace(/Room\s*/i, "")
          .split("·")[0]
          .trim();
        if (bookingRoom === String(roomNum)) {
          const seats = Array.isArray(data.seats) ? data.seats : [data.seats];
          seats.forEach((s) => takenSeats.add(s));
          if (data.userId === currentUser?.uid) {
            seats.forEach((s) => mySeats.add(s));
          }
        }
      });
    } catch (err) {
      console.error("Failed to load taken seats:", err);
    }
  }

  // ── Build seat grid ──
  function buildSeatGrid() {
    if (!seatGrid) return;
    seatGrid.innerHTML = "";

    // Column number headers
    const headerRow = document.createElement("div");
    headerRow.className = "seat-row";
    const emptyLabel = document.createElement("div");
    emptyLabel.className = "row-label";
    headerRow.appendChild(emptyLabel);
    for (let s = 1; s <= SEATS_PER_ROW; s++) {
      if (s === 5) headerRow.appendChild(createGap());
      const lbl = document.createElement("div");
      lbl.style.cssText =
        "width:34px;text-align:center;font-size:10px;font-weight:700;color:var(--text-muted);flex-shrink:0;";
      lbl.textContent = s;
      headerRow.appendChild(lbl);
    }
    seatGrid.appendChild(headerRow);

    ROWS.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "seat-row";

      const rowLbl = document.createElement("div");
      rowLbl.className = "row-label";
      rowLbl.textContent = row;
      rowEl.appendChild(rowLbl);

      const isVip = VIP_ROWS.includes(row);

      for (let s = 1; s <= SEATS_PER_ROW; s++) {
        if (s === 5) rowEl.appendChild(createGap());

        const seatId = `${row}${s}`;
        const isTaken = takenSeats.has(seatId);
        const isMysSeat = mySeats.has(seatId);

        const seat = document.createElement("div");
        seat.className = [
          "seat",
          isVip ? "vip" : "",
          isTaken ? "taken" : "",
          isMysSeat ? "booked-by-you" : "",
        ]
          .filter(Boolean)
          .join(" ");
        seat.textContent = s;
        seat.dataset.id = seatId;
        seat.setAttribute(
          "aria-label",
          `Seat ${seatId}${isTaken ? " (taken)" : ""}`,
        );
        if (isMysSeat) {
          const tooltip = document.createElement("div");
          tooltip.className = "seat-tooltip";
          tooltip.textContent = "Booked by you";
          seat.appendChild(tooltip);
        }

        if (!isTaken) {
          seat.addEventListener("click", () => toggleSeat(seat, seatId, isVip));
        }

        rowEl.appendChild(seat);
      }

      seatGrid.appendChild(rowEl);
    });
  }

  function createGap() {
    const gap = document.createElement("div");
    gap.className = "seat-gap";
    return gap;
  }

  // ── Toggle seat ──
  function toggleSeat(el, id, isVip) {
    if (selectedSeats.has(id)) {
      selectedSeats.delete(id);
      el.classList.remove("selected");
    } else {
      selectedSeats.add(id);
      el.classList.add("selected");
    }
    updateSummary();
  }

  // ── Update summary panel ──
  function updateSummary() {
    if (selectedSeats.size === 0) {
      selectedDisplay.innerHTML =
        '<span style="color:var(--text-muted);font-size:12px;font-weight:400;">None selected</span>';
      totalPriceEl.textContent = "$0.00";
      confirmBtn.disabled = true;
      return;
    }

    selectedDisplay.innerHTML = "";
    let total = 0;

    [...selectedSeats].sort().forEach((id) => {
      const chip = document.createElement("span");
      chip.className = "seat-chip";
      chip.textContent = id;
      selectedDisplay.appendChild(chip);
      total += VIP_ROWS.includes(id[0]) ? VIP_PRICE : TICKET_PRICE;
    });

    totalPriceEl.textContent = `$${total.toFixed(2)}`;
    confirmBtn.disabled = false;
  }

  // ── Confirm booking ──
  async function handleConfirm() {
    if (!currentUser) {
      alert("Please sign in to confirm your booking.");
      return;
    }

    const seats = [...selectedSeats].sort();
    const total = seats.reduce(
      (t, id) => t + (VIP_ROWS.includes(id[0]) ? VIP_PRICE : TICKET_PRICE),
      0,
    );

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Saving...";

    try {
      await addDoc(collection(db, "bookings"), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        movie: title,
        room: String(roomNum),
        date: date,
        time: time,
        seats: seats,
        total: total,
        bookedAt: serverTimestamp(),
      });

      alert(
        `Booking confirmed! ✅\n\nMovie: ${title}\nRoom: ${roomNum} · ${roomType}\nDate: ${date}\nShowtime: ${time}\nSeats: ${seats.join(", ")}\nTotal: $${total.toFixed(2)}\n\nThank you!`,
      );

      window.location.href = "main.html";
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to save booking. Please try again.");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm Seats";
    }
  }
})();
