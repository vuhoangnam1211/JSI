// ─────────────────────────────────────────
//   CineVerse — carousel.js
//   Place this file in your /js/ folder
// ─────────────────────────────────────────

const CARDS_PER_PAGE = 3;

const cards = Array.from(document.querySelectorAll(".movie-card"));
const prevBtn = document.getElementById("carouselPrev");
const nextBtn = document.getElementById("carouselNext");
const dotsWrap = document.getElementById("carouselDots");

const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
let currentPage = 0;

// ── Build page dots ──
for (let i = 0; i < totalPages; i++) {
  const dot = document.createElement("button");
  dot.className = "carousel-dot" + (i === 0 ? " active" : "");
  dot.addEventListener("click", () => goToPage(i));
  dotsWrap.appendChild(dot);
}

function goToPage(page) {
  currentPage = page;

  // Show/hide cards
  cards.forEach((card, index) => {
    const startIndex = page * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    if (index >= startIndex && index < endIndex) {
      card.classList.remove("hidden");
    } else {
      card.classList.add("hidden");
    }
  });

  // Update dots
  document.querySelectorAll(".carousel-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === page);
  });

  // Update arrow states
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage === totalPages - 1;
}

// ── Arrow buttons ──
prevBtn.addEventListener("click", () => {
  if (currentPage > 0) goToPage(currentPage - 1);
});
nextBtn.addEventListener("click", () => {
  if (currentPage < totalPages - 1) goToPage(currentPage + 1);
});

// ── Init: show first page ──
goToPage(0);
