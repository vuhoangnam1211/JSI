// ─────────────────────────────────────────
//   CineVerse — mybookings.js
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
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// ── Auth guard + Nav bar ──
onAuthStateChanged(auth, async (user) => {
  const nav = document.getElementById("mainNav");

  if (!user) {
    // Not logged in — redirect to sign in
    window.location.href = "../SPCK/HTML/signin.html";
    return;
  }

  // Logged in — set up log out button
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "../SPCK/HTML/signin.html";
  });

  // Load their bookings
  await loadBookings(user.uid);
});

// ── Load bookings from Firestore ──
async function loadBookings(uid) {
  const list = document.getElementById("bookingsList");

  try {
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", uid),
      orderBy("bookedAt", "desc"),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      list.innerHTML = `
        <div class="no-bookings">
          <p>You haven't made any bookings yet.</p>
          <a href="main.html">Browse Movies</a>
        </div>
      `;
      return;
    }

    list.innerHTML = "";

    snapshot.forEach((doc) => {
      const b = doc.data();

      // Format bookedAt timestamp
      let bookedAtStr = "—";
      if (b.bookedAt) {
        const d = b.bookedAt.toDate();
        bookedAtStr = d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Seats chips
      const seatsHtml = Array.isArray(b.seats)
        ? b.seats.map((s) => `<span class="seat-chip">${s}</span>`).join("")
        : `<span class="seat-chip">${b.seats}</span>`;

      list.innerHTML += `
        <div class="booking-card">
          <div class="booking-movie">${b.movie}</div>

          <div class="booking-row">
            <span class="booking-label">Room</span>
            <span class="booking-value">${b.room}</span>
          </div>

          <div class="booking-row">
            <span class="booking-label">Date</span>
            <span class="booking-value">${b.date}</span>
          </div>

          <div class="booking-row">
            <span class="booking-label">Showtime</span>
            <span class="booking-value">${b.time}</span>
          </div>

          <div class="booking-row">
            <span class="booking-label">Booked On</span>
            <span class="booking-value">${bookedAtStr}</span>
          </div>

          <div class="booking-seats">
            <div class="booking-label" style="width:100%;margin-bottom:6px;">Seats</div>
            ${seatsHtml}
          </div>

          <div class="booking-total">Total: $${Number(b.total).toFixed(2)}</div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading bookings:", error);
    list.innerHTML = `<p style="color:red;padding:20px;">Failed to load bookings. Please try again.</p>`;
  }
}
