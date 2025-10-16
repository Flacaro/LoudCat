// view.js
export function getEmail() {
 return document.getElementById("email").value;
}
export function getPassword() {
 return document.getElementById("password").value;
}
export function getUsername() {
 return document.getElementById("username").value;
}
export function getPhotoFile() {
 return document.getElementById("photoFile");
}
export function showUserUI(email) {
  const authSection = document.getElementById("auth");
  const dataSection = document.getElementById("data");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileBtn = document.getElementById("profileBtn");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  if (authSection) authSection.style.display = "none";
  if (dataSection) dataSection.style.display = "block";
  if (logoutBtn) logoutBtn.style.display = "inline-block";
  if (profileBtn) profileBtn.style.display = "inline-block";
  if (loginBtn) loginBtn.style.display = "none";
  if (registerBtn) registerBtn.style.display = "none";
  document.querySelector("h1").textContent = `Benvenuto, ${email}!`;
}
export function showLoginUI() {
  const authSection = document.getElementById("auth");
  const dataSection = document.getElementById("data");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileBtn = document.getElementById("profileBtn");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  if (authSection) authSection.style.display = "block";
  if (dataSection) dataSection.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "none";
  if (profileBtn) profileBtn.style.display = "none";
  if (loginBtn) loginBtn.style.display = "inline-block";
  if (registerBtn) registerBtn.style.display = "inline-block";
  document.querySelector("h1").textContent = "Firebase + MVC";
}
export function renderData(data) {
 const ul = document.getElementById("output");
 ul.innerHTML = Object.entries(data)
   .map(([key, val]) => `<li>${key}: ${val}</li>`)
   .join("");
}

// Modal / profile UI bindings
import { auth } from "../firebase.js";

export function initProfileModal() {
  const profileBtn = document.getElementById("profileBtn");
  const modal = document.getElementById("profileModal");
  const closeBtn = document.getElementById("closeProfileBtn");
  const navButtons = modal ? modal.querySelectorAll("[data-tab]") : [];

  function openModal() {
    // populate email from currentUser
    const user = auth.currentUser;
    const emailEl = document.getElementById("profileEmail");
    const nameEl = document.getElementById("profileName");
    const avatarEl = document.getElementById("profileAvatar");
    if (emailEl) emailEl.textContent = `Email: ${user ? user.email : "-"}`;
    if (nameEl) nameEl.textContent = `Username: ${user && user.displayName ? user.displayName : "-"}`;
    if (avatarEl) avatarEl.src = user && user.photoURL ? user.photoURL : "assets/img/avatar-placeholder.png";
    if (modal) modal.style.display = "flex";
    // focus first nav button if available
    const firstNav = modal.querySelector("[data-tab]");
    firstNav?.focus();
  }
  function closeModal() {
    if (modal) modal.style.display = "none";
  }

  profileBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);

  // close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Switch tab panels
  navButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tab = btn.getAttribute("data-tab");
      switchPanel(tab);
    });
  });

  // Save settings (change password)
  const saveBtn = document.getElementById("saveSettingsBtn");
  const feedback = document.getElementById("settingsFeedback");
  saveBtn?.addEventListener("click", async () => {
    if (!auth.currentUser) {
      feedback.textContent = "Devi essere loggato per cambiare la password.";
      return;
    }

    const current = document.getElementById("currentPassword").value;
    const nw = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;

    feedback.textContent = "";

    if (!current || !nw || !confirm) {
      feedback.textContent = "Compila tutti i campi della password.";
      return;
    }
    if (nw.length < 6) {
      feedback.textContent = "La nuova password deve essere lunga almeno 6 caratteri.";
      return;
    }
    if (nw !== confirm) {
      feedback.textContent = "La conferma non corrisponde alla nuova password.";
      return;
    }

    try {
      // import auth helpers from CDN modules dynamically (already using CDN pattern elsewhere)
      const mod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = mod;

      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, nw);
      feedback.textContent = "Password aggiornata con successo.";
      // clear fields
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
    } catch (err) {
      console.error("Errore cambio password:", err);
      // map common errors
      let msg = "Errore durante l'aggiornamento della password.";
      if (err && err.code) {
        switch (err.code) {
          case "auth/wrong-password":
            msg = "Password attuale errata.";
            break;
          case "auth/requires-recent-login":
            msg = "Devi effettuare nuovamente il login prima di cambiare la password.";
            break;
          default:
            msg = err.message || msg;
        }
      }
      feedback.textContent = msg;
    }
  });
}

export function switchPanel(name) {
  const container = document.getElementById("profileContent");
  if (!container) return;
  container.querySelectorAll("[data-panel]").forEach((p) => {
    p.style.display = p.getAttribute("data-panel") === name ? "block" : "none";
  });
}