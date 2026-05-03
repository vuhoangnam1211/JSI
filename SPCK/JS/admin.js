// ─────────────────────────────────────────
//   CineVerse — admin.js
// ─────────────────────────────────────────

import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// ─── State ───────────────────────────────
let currentUser = null;
let isManager = false;
let confirmCallback = null;

// ─── Auth Guard ──────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "sign.html";
    return;
  }

  // Check if user is in admins collection
  const adminRef = doc(db, "admins", user.uid);
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists()) {
    // Not an admin — redirect
    alert("Access denied. You are not an admin.");
    window.location.href = "main.html";
    return;
  }

  currentUser = user;
  isManager = adminSnap.data().isManager === true;

  // Update UI based on role
  const badge = document.getElementById("roleBadge");
  badge.textContent = isManager ? "Manager" : "Admin";
  if (isManager) badge.classList.add("manager");

  // Show Add Admin button only for managers
  if (isManager) {
    document.getElementById("addAdminBtn").style.display = "flex";
  }

  // Show main content
  document.getElementById("adminLoading").style.display = "none";
  document.getElementById("adminMain").style.display = "block";

  // Load initial data
  loadMovies();
});

// ─── Logout ──────────────────────────────
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "signin.html";
});

// ─── Tab Switching ────────────────────────
window.switchTab = function (tab) {
  document.getElementById("moviesTab").style.display =
    tab === "movies" ? "block" : "none";
  document.getElementById("usersTab").style.display =
    tab === "users" ? "block" : "none";
  document
    .getElementById("tabMovies")
    .classList.toggle("active", tab === "movies");
  document
    .getElementById("tabUsers")
    .classList.toggle("active", tab === "users");

  if (tab === "users") loadUsers();
};

// ═══════════════════════════════════════
//   MOVIES
// ═══════════════════════════════════════

async function loadMovies() {
  const tbody = document.getElementById("moviesTableBody");
  tbody.innerHTML =
    '<tr><td colspan="8" class="table-loading">Loading movies...</td></tr>';

  try {
    const snapshot = await getDocs(collection(db, "movies"));
    tbody.innerHTML = "";

    if (snapshot.empty) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="table-loading">No movies found.</td></tr>';
      return;
    }

    snapshot.forEach((docSnap) => {
      const m = docSnap.data();
      const id = docSnap.id;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          ${
            m.poster
              ? `<img class="table-poster" src="${m.poster}" alt="${m.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="table-poster-fallback" style="display:none">🎬</div>`
              : `<div class="table-poster-fallback">🎬</div>`
          }
        </td>
        <td><strong>${m.title || "—"}</strong></td>
        <td>${m.genre || "—"}</td>
        <td>${m.year || "—"}</td>
        <td>${m.duration ? m.duration + " min" : "—"}</td>
        <td>⭐ ${m.rating || "—"}</td>
        <td>${m.age || "—"}</td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" onclick="openMovieModal('${id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="btn-delete" onclick="confirmDeleteMovie('${id}', '${(m.title || "").replace(/'/g, "\\'")}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/></svg>
              Delete
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="table-loading" style="color:var(--accent)">Failed to load movies.</td></tr>';
    console.error(err);
  }
}

// ─── Movie Modal ─────────────────────────
window.openMovieModal = async function (docId = null) {
  document.getElementById("movieModal").style.display = "flex";
  document.getElementById("movieDocId").value = "";
  document.getElementById("movieTitle").value = "";
  document.getElementById("movieGenre").value = "";
  document.getElementById("moviePoster").value = "";
  document.getElementById("movieYear").value = "";
  document.getElementById("movieDuration").value = "";
  document.getElementById("movieRating").value = "";
  document.getElementById("movieAge").value = "";
  document.getElementById("movieModalTitle").textContent = docId
    ? "Edit Movie"
    : "Add Movie";
  document.getElementById("saveMovieBtn").textContent = docId
    ? "Save Changes"
    : "Save Movie";

  if (docId) {
    document.getElementById("movieDocId").value = docId;
    const snap = await getDoc(doc(db, "movies", docId));
    if (snap.exists()) {
      const m = snap.data();
      document.getElementById("movieTitle").value = m.title || "";
      document.getElementById("movieGenre").value = m.genre || "";
      document.getElementById("moviePoster").value = m.poster || "";
      document.getElementById("movieYear").value = m.year || "";
      document.getElementById("movieDuration").value = m.duration || "";
      document.getElementById("movieRating").value = m.rating || "";
      document.getElementById("movieAge").value = m.age || "";
    }
  }
};

window.closeMovieModal = function () {
  document.getElementById("movieModal").style.display = "none";
};

window.saveMovie = async function () {
  const docId = document.getElementById("movieDocId").value;
  const btn = document.getElementById("saveMovieBtn");

  const data = {
    title: document.getElementById("movieTitle").value.trim(),
    genre: document.getElementById("movieGenre").value.trim(),
    poster: document.getElementById("moviePoster").value.trim(),
    year: Number(document.getElementById("movieYear").value),
    duration: Number(document.getElementById("movieDuration").value),
    rating: Number(document.getElementById("movieRating").value),
    age: document.getElementById("movieAge").value.trim(),
  };

  if (!data.title) {
    showToast("Title is required.", "error");
    return;
  }

  btn.textContent = "Saving...";
  btn.disabled = true;

  try {
    if (docId) {
      await updateDoc(doc(db, "movies", docId), data);
      showToast("Movie updated!", "success");
    } else {
      await addDoc(collection(db, "movies"), data);
      showToast("Movie added!", "success");
    }
    closeMovieModal();
    loadMovies();
  } catch (err) {
    showToast("Failed to save movie.", "error");
    console.error(err);
  } finally {
    btn.textContent = docId ? "Save Changes" : "Save Movie";
    btn.disabled = false;
  }
};

window.confirmDeleteMovie = function (docId, title) {
  showConfirm(
    "Delete Movie",
    `Are you sure you want to delete "${title}"? This cannot be undone.`,
    async () => {
      try {
        await deleteDoc(doc(db, "movies", docId));
        showToast("Movie deleted.", "success");
        loadMovies();
      } catch (err) {
        showToast("Failed to delete movie.", "error");
        console.error(err);
      }
    },
  );
};

// ═══════════════════════════════════════
//   USERS
// ═══════════════════════════════════════

async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML =
    '<tr><td colspan="4" class="table-loading">Loading users...</td></tr>';

  try {
    const snapshot = await getDocs(collection(db, "admins"));
    tbody.innerHTML = "";

    if (snapshot.empty) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="table-loading">No admins found.</td></tr>';
      return;
    }

    snapshot.forEach((docSnap) => {
      const u = docSnap.data();
      const id = docSnap.id;
      const isSelf = currentUser && u.uid === currentUser.uid;
      const userIsManager = u.isManager === true;

      const tr = document.createElement("tr");

      // Action buttons — only managers can promote/demote, and can't demote themselves
      let actionBtns = "";
      if (isManager && !isSelf) {
        if (userIsManager) {
          actionBtns += `
            <button class="btn-demote" onclick="confirmDemote('${id}', '${(u.email || "").replace(/'/g, "\\'")}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17,11 12,6 7,11"/><polyline points="17,18 12,13 7,18"/></svg>
              Demote to Admin
            </button>`;
        } else {
          actionBtns += `
            <button class="btn-promote" onclick="confirmPromote('${id}', '${(u.email || "").replace(/'/g, "\\'")}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17,13 12,8 7,13"/><polyline points="17,19 12,14 7,19"/></svg>
              Promote to Manager
            </button>`;
        }
        actionBtns += `
          <button class="btn-delete" onclick="confirmDeleteAdmin('${id}', '${(u.email || "").replace(/'/g, "\\'")}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/></svg>
            Remove
          </button>`;
      } else if (isSelf) {
        actionBtns = `<span style="font-size:12px;color:var(--text-muted)">You</span>`;
      } else {
        actionBtns = `<span style="font-size:12px;color:var(--text-muted)">—</span>`;
      }

      tr.innerHTML = `
        <td>${u.email || "—"}</td>
        <td><span class="role-badge ${userIsManager ? "manager" : "admin"}">${userIsManager ? "Manager" : "Admin"}</span></td>
        <td>${u.promotedBy || "—"}</td>
        <td><div class="action-btns">${actionBtns}</div></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="table-loading" style="color:var(--accent)">Failed to load users.</td></tr>';
    console.error(err);
  }
}

// ─── Add Admin Modal (Manager only) ──────
window.openUserModal = function () {
  document.getElementById("userModal").style.display = "flex";
  document.getElementById("newAdminUid").value = "";
  document.getElementById("newAdminEmail").value = "";
  document.getElementById("newAdminRole").value = "false";
};

window.closeUserModal = function () {
  document.getElementById("userModal").style.display = "none";
};

window.saveNewAdmin = async function () {
  const uid = document.getElementById("newAdminUid").value.trim();
  const email = document.getElementById("newAdminEmail").value.trim();
  const roleVal = document.getElementById("newAdminRole").value;

  if (!uid || !email) {
    showToast("UID and email are required.", "error");
    return;
  }

  try {
    // Use uid as the document ID so auth guard works
    await updateDoc(doc(db, "admins", uid), {
      uid,
      email,
      isManager: roleVal === "true",
      promotedBy: currentUser.email,
    }).catch(async () => {
      // If doc doesn't exist, create it
      const { setDoc } =
        await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "admins", uid), {
        uid,
        email,
        isManager: roleVal === "true",
        promotedBy: currentUser.email,
      });
    });

    showToast("Admin added!", "success");
    closeUserModal();
    loadUsers();
  } catch (err) {
    showToast("Failed to add admin.", "error");
    console.error(err);
  }
};

// ─── Promote / Demote ────────────────────
window.confirmPromote = function (docId, email) {
  showConfirm(
    "Promote to Manager",
    `Promote "${email}" to Manager?`,
    async () => {
      try {
        await updateDoc(doc(db, "admins", docId), { isManager: true });
        showToast(`${email} promoted to Manager.`, "success");
        loadUsers();
      } catch (err) {
        showToast("Failed to promote user.", "error");
      }
    },
  );
};

window.confirmDemote = function (docId, email) {
  showConfirm("Demote to Admin", `Demote "${email}" to Admin?`, async () => {
    try {
      await updateDoc(doc(db, "admins", docId), { isManager: false });
      showToast(`${email} demoted to Admin.`, "success");
      loadUsers();
    } catch (err) {
      showToast("Failed to demote user.", "error");
    }
  });
};

window.confirmDeleteAdmin = function (docId, email) {
  showConfirm(
    "Remove Admin",
    `Remove "${email}" from admins? They will lose all access.`,
    async () => {
      try {
        await deleteDoc(doc(db, "admins", docId));
        showToast("Admin removed.", "success");
        loadUsers();
      } catch (err) {
        showToast("Failed to remove admin.", "error");
      }
    },
  );
};

// ═══════════════════════════════════════
//   CONFIRM MODAL
// ═══════════════════════════════════════

function showConfirm(title, message, onConfirm) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  confirmCallback = onConfirm;
  document.getElementById("confirmModal").style.display = "flex";
}

window.closeConfirm = function () {
  document.getElementById("confirmModal").style.display = "none";
  confirmCallback = null;
};

document.getElementById("confirmOkBtn").addEventListener("click", async () => {
  if (confirmCallback) await confirmCallback();
  closeConfirm();
});

// Close modals on overlay click
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.style.display = "none";
  });
});

// ═══════════════════════════════════════
//   TOAST
// ═══════════════════════════════════════

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}
