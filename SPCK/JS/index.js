import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

// ─────────────────────────────────────────
//   AUTH — Nav bar switching + Log Out
// ─────────────────────────────────────────
const nav = document.querySelector("nav");

onAuthStateChanged(auth, (user) => {
  if (user) {
    nav.innerHTML = `
      <a href="#" class="active">Home</a>
      <a href="#" class="btn-logout" id="logoutBtn">Log Out</a>
    `;
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "/SPCK/HTML/signin.html";
    });
  } else {
    nav.innerHTML = `
      <a href="#" class="active">Home</a>
      <a href="/SPCK/HTML/signin.html" class="btn-logout">Sign In</a>
      <a href="/SPCK/HTML/signup.html" class="btn-logout">Sign Up</a>
    `;
  }
});

// ─────────────────────────────────────────
//   SLIDESHOW
// ─────────────────────────────────────────
let slideIndex = 0;
const slides = document.querySelectorAll(".mySlides");
const dots = document.querySelectorAll(".dot");

function showSlide(index) {
  if (index >= slides.length) slideIndex = 0;
  if (index < 0) slideIndex = slides.length - 1;

  slides.forEach((s) => s.classList.remove("active"));
  dots.forEach((d) => d.classList.remove("active"));

  slides[slideIndex].classList.add("active");
  dots[slideIndex].classList.add("active");
}

function changeSlide(n) {
  slideIndex += n;
  showSlide(slideIndex);
}

function goToSlide(n) {
  slideIndex = n;
  showSlide(slideIndex);
}

window.changeSlide = changeSlide;
window.goToSlide = goToSlide;

setInterval(() => changeSlide(1), 5000);
showSlide(slideIndex);

// ─────────────────────────────────────────
//   FILTER TABS
// ─────────────────────────────────────────
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", function () {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    this.classList.add("active");
  });
});

// ─────────────────────────────────────────
//   MOVIES — Load from Firestore
// ─────────────────────────────────────────
async function loadMovies() {
  const grid = document.getElementById("movieGrid");

  grid.innerHTML =
    '<p style="color:var(--text-muted);padding:20px;">Loading movies...</p>';

  try {
    const snapshot = await getDocs(collection(db, "movies"));

    grid.innerHTML = "";

    snapshot.forEach((doc) => {
      const m = doc.data();

      grid.innerHTML += `
        <div class="movie-card" data-title="${m.title.toLowerCase()}">
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
            <button class="btn-booking" onclick="handleBooking()">Book Now</button>
          </div>
        </div>
      `;
    });

    initCarousel();
    initSearch();
  } catch (error) {
    grid.innerHTML =
      '<p style="color:red;padding:20px;">Failed to load movies. Check your Firebase config.</p>';
    console.error("Firestore error:", error);
  }
}

// ─────────────────────────────────────────
//   BOOKING GUARD
// ─────────────────────────────────────────
function handleBooking() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to book tickets.");
  } else {
    window.location.href = "roomchoosing.html";
  }
}

window.handleBooking = handleBooking;

// ─────────────────────────────────────────
//   CAROUSEL
// ─────────────────────────────────────────
const CARDS_PER_PAGE = 3;
let carouselGoToPage = null; // exposed so search can use it

function initCarousel() {
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

  // Expose goToPage so search can switch pages
  carouselGoToPage = goToPage;

  prevBtn.addEventListener("click", () => {
    if (currentPage > 0) goToPage(currentPage - 1);
  });
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages - 1) goToPage(currentPage + 1);
  });

  goToPage(0);
}

// ─────────────────────────────────────────
//   SEARCH
// ─────────────────────────────────────────
function initSearch() {
  const searchInput = document.querySelector(".search-box input");
  const searchBtn = document.querySelector(".search-box button");

  function doSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    const cards = Array.from(document.querySelectorAll(".movie-card"));

    // Find the matching card
    const matchedCard = cards.find((card) =>
      card.dataset.title.includes(query),
    );

    if (!matchedCard) {
      alert(`No movie found for "${searchInput.value}".`);
      return;
    }

    // Figure out which page the matched card is on
    const cardIndex = cards.indexOf(matchedCard);
    const targetPage = Math.floor(cardIndex / CARDS_PER_PAGE);

    // Switch to that page first
    if (carouselGoToPage) carouselGoToPage(targetPage);

    // Highlight the card briefly
    matchedCard.classList.add("search-highlight");
    setTimeout(() => matchedCard.classList.remove("search-highlight"), 2000);

    // Smooth scroll to the movies section then to the card
    const moviesSection = document.querySelector(".movies-section");
    moviesSection.scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      matchedCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
  }

  // Search on button click
  searchBtn.addEventListener("click", doSearch);

  // Search on Enter key
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });
}

loadMovies();
