// ─────────────────────────────────────────
//   CineVerse — movies.js
//   Place this file in your /SPCK/JS/ folder
// ─────────────────────────────────────────

import { db } from "./firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

async function loadMovies() {
  const grid = document.getElementById("movieGrid");

  // Show loading message
  grid.innerHTML =
    '<p style="color:var(--text-muted);padding:20px;">Loading movies...</p>';

  try {
    const snapshot = await getDocs(collection(db, "movies"));

    // Clear loading message
    grid.innerHTML = "";

    snapshot.forEach((doc) => {
      const m = doc.data();

      grid.innerHTML += `
        <div class="movie-card">
          <div class="movie-poster">
            <img src="${m.poster}" alt="${m.title}" />
            <div class="movie-rating">
              <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ${m.rating}
            </div>
            <div class="movie-age">${m.age}</div>
            <div class="movie-hover-overlay">
              <div class="btn-play">
                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
              </div>
            </div>
          </div>
          <div class="movie-info">
            <div class="movie-genre">${m.genre}</div>
            <div class="movie-title">${m.title}</div>
            <div class="movie-meta">
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                ${m.duration} min
              </span>
              <span>${m.year}</span>
            </div>
            <button class="btn-booking" onclick="window.location.href='roomchoosing.html'">Book Now</button>
          </div>
        </div>
      `;
    });

    // Run carousel AFTER cards are loaded
    initCarousel();
  } catch (error) {
    grid.innerHTML =
      '<p style="color:red;padding:20px;">Failed to load movies. Check your Firebase config.</p>';
    console.error("Firestore error:", error);
  }
}

function initCarousel() {
  const CARDS_PER_PAGE = 3;
  const cards = Array.from(document.querySelectorAll(".movie-card"));
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");
  const dotsWrap = document.getElementById("carouselDots");

  dotsWrap.innerHTML = "";
  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
  let currentPage = 0;

  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement("button");
    dot.className = "carousel-dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => goToPage(i));
    dotsWrap.appendChild(dot);
  }

  function goToPage(page) {
    currentPage = page;

    cards.forEach((card, index) => {
      const start = page * CARDS_PER_PAGE;
      const end = start + CARDS_PER_PAGE;
      if (index >= start && index < end) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });

    document.querySelectorAll(".carousel-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === page);
    });

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === totalPages - 1;
  }

  prevBtn.addEventListener("click", () => {
    if (currentPage > 0) goToPage(currentPage - 1);
  });
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages - 1) goToPage(currentPage + 1);
  });

  goToPage(0);
}

loadMovies();
