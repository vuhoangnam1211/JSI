/* ─────────────────────────────────────────
   CineVerse — seats.js  (Select Seats)
───────────────────────────────────────── */

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

(function () {
  "use strict";

  /* ── Configuration ── */
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

  const TAKEN_SEATS = new Set([
    "A3",
    "A4",
    "B1",
    "B6",
    "B7",
    "C2",
    "C3",
    "C5",
    "D4",
    "D5",
    "E1",
    "E7",
    "E8",
    "F2",
    "F3",
    "G6",
    "H2",
    "H3",
    "H4",
  ]);

  /* ── State ── */
  let selectedSeats = new Set();

  /* ── DOM references ── */
  const seatGrid = document.getElementById("seatGrid");
  const roomBadge = document.getElementById("roomBadge");
  const summaryRoom = document.getElementById("summaryRoom");
  const roomTag = document.getElementById("room-tag");
  const selectedDisplay = document.getElementById("selectedDisplay");
  const totalPriceEl = document.getElementById("totalPrice");
  const confirmBtn = document.getElementById("confirmBtn");

  /* ── Read room from URL ── */
  const params = new URLSearchParams(window.location.search);
  const roomNum = params.get("room") || "1";
  const roomType = ROOM_TYPES[roomNum] || "Standard";

  /* ── Auth guard + Nav bar ── */
  onAuthStateChanged(auth, (user) => {
    const nav = document.querySelector("nav");

    if (user) {
      // Logged in — show Log Out
      nav.innerHTML = `
        <a href="index.html">Home</a>
        <a href="#" class="btn-logout" id="logoutBtn">Log Out</a>
      `;
      document
        .getElementById("logoutBtn")
        .addEventListener("click", async () => {
          await signOut(auth);
          window.location.href = "/SPCK/HTML/signin.html";
        });

      // Allow seat selection
      initRoomLabels();
      buildSeatGrid();
      if (confirmBtn) confirmBtn.addEventListener("click", handleConfirm);
    } else {
      // Not logged in — show Sign In / Sign Up
      nav.innerHTML = `
        <a href="index.html">Home</a>
        <a href="/SPCK/HTML/signin.html" class="btn-logout">Sign In</a>
        <a href="/SPCK/HTML/signup.html" class="btn-logout">Sign Up</a>
      `;

      // Block seat grid
      if (seatGrid) {
        seatGrid.innerHTML = `
          <div style="text-align:center; padding: 40px 20px;">
            <p style="font-size:18px; font-weight:600; color:var(--text); margin-bottom:12px;">🔒 Please sign in to select seats</p>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px;">You need an account to book tickets.</p>
            <a href="/SPCK/HTML/signin.html" style="background:var(--accent);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Sign In</a>
          </div>
        `;
      }

      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Sign in to confirm";
      }
    }
  });

  /* ── Initialise room labels ── */
  function initRoomLabels() {
    const screenIcon = `
      <svg width="14" height="14" fill="none" stroke="currentColor"
           stroke-width="2" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>`;

    if (roomBadge)
      roomBadge.innerHTML = `${screenIcon} Room ${roomNum} · ${roomType}`;
    if (summaryRoom) summaryRoom.textContent = `Room ${roomNum}`;
    if (roomTag) roomTag.textContent = `Room ${roomNum}`;
  }

  /* ── Build seat grid ── */
  function buildSeatGrid() {
    if (!seatGrid) return;

    // Column number header
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

    // Seat rows
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
        const isTaken = TAKEN_SEATS.has(seatId);

        const seat = document.createElement("div");
        seat.className = ["seat", isVip ? "vip" : "", isTaken ? "taken" : ""]
          .filter(Boolean)
          .join(" ");

        seat.textContent = s;
        seat.dataset.id = seatId;
        seat.setAttribute(
          "aria-label",
          `Seat ${seatId}${isTaken ? " (taken)" : ""}`,
        );

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

  /* ── Toggle seat selection ── */
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

  /* ── Update summary panel ── */
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

  /* ── Confirm booking ── */
  function handleConfirm() {
    const seats = [...selectedSeats].sort().join(", ");
    alert(
      `Booking confirmed!\n\nMovie: Interstellar\nRoom: ${roomNum}\nSeats: ${seats}\n\nThank you!`,
    );
  }
})();
