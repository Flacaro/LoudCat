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
import { saveUserData, loadUserData } from "../model/modelAuth.js";

export function initProfileModal() {
  const profileBtn = document.getElementById("profileBtn");
  const modal = document.getElementById("profileModal");
  const closeBtn = document.getElementById("closeProfileBtn");
  const navButtons = modal ? modal.querySelectorAll("[data-tab]") : [];

  async function openModal() {
    // populate email from currentUser and prefer Firestore fields if available
    const user = auth.currentUser;
    const emailEl = document.getElementById("profileEmail");
    const nameEl = document.getElementById("profileName");
    const avatarEl = document.getElementById("profileAvatar");

    let emailText = user ? user.email : "-";
    let usernameText = user && user.displayName ? user.displayName : null;
    let photoURL = user && user.photoURL ? user.photoURL : null;

    // try to load Firestore doc (may contain username/photoURL saved during registration)
    try {
      if (user) {
        const data = await loadUserData(user.uid);
        if (data) {
          if (data.username) usernameText = data.username;
          if (data.photoURL) photoURL = data.photoURL;
        }
      }
    } catch (err) {
      console.warn("Impossibile leggere i dati utente da Firestore:", err);
    }

    if (emailEl) emailEl.textContent = `Email: ${emailText}`;
    if (nameEl) nameEl.textContent = `Username: ${usernameText ? usernameText : "-"}`;
    if (avatarEl) avatarEl.src = photoURL ? photoURL : "assets/img/avatar-placeholder.png";
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

  // Save settings (password and/or username)
  const saveBtn = document.getElementById("saveSettingsBtn");
  const feedback = document.getElementById("settingsFeedback");
  saveBtn?.addEventListener("click", async () => {
    if (!auth.currentUser) {
      feedback.textContent = "Devi essere loggato per modificare le impostazioni.";
      return;
    }

    const current = document.getElementById("currentPassword").value;
    const nw = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const newUsername = document.getElementById("newUsername").value.trim();

    feedback.textContent = "";

    const wantsPasswordChange = current || nw || confirm;
    const wantsUsernameChange = !!newUsername;

    if (!wantsPasswordChange && !wantsUsernameChange) {
      feedback.textContent = "Inserisci uno username o compila i campi per cambiare la password.";
      return;
    }

    // If user wants to change password, validate fields
    if (wantsPasswordChange) {
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
    }

    try {
      const mod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } = mod;

      const user = auth.currentUser;

      // If password change requested, require reauthentication
      if (wantsPasswordChange) {
        const credential = EmailAuthProvider.credential(user.email, current);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, nw);
      }

      // If username change requested, update displayName and Firestore (no reauth required for updateProfile in most cases)
      if (wantsUsernameChange) {
        await updateProfile(user, { displayName: newUsername });
        try {
          await saveUserData(user.uid, { username: newUsername });
        } catch (dbErr) {
          console.warn("Non è stato possibile salvare lo username su Firestore:", dbErr);
        }
      }

      feedback.textContent = "Impostazioni aggiornate con successo.";
      // clear inputs
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
      document.getElementById("newUsername").value = "";
    } catch (err) {
      console.error("Errore aggiornamento impostazioni:", err);
      let msg = "Errore durante l'aggiornamento delle impostazioni.";
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

  // If switching to friends panel and list is empty, show themed placeholder
  if (name === "friends") {
    const list = document.getElementById("friendsList");
    if (list) {
      // remove any existing placeholder
      const existing = document.getElementById("friends-empty-placeholder");
      if (existing) existing.remove();

      if (!list.children || list.children.length === 0) {
        const li = document.createElement("li");
        li.id = "friends-empty-placeholder";
        li.className = "friends-empty list-group-item border-0";
        li.textContent = "Non hai ancora condiviso nulla";
        list.appendChild(li);
      }
    }
  }
}