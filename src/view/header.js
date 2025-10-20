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
import { db } from "../firebase.js";
import { collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

    // If photoURL is present but doesn't look like an http(s) URL, try resolving via Storage
    try {
      if (photoURL && typeof photoURL === 'string' && !/^https?:\/\//i.test(photoURL)) {
        const storageMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js");
        const { ref: storageRef, getDownloadURL } = storageMod;
        // assume stored path like 'avatars/{uid}/{filename}'
        const sRef = storageRef(storage, photoURL);
        const resolved = await getDownloadURL(sRef);
        photoURL = resolved;
      }
    } catch (resolveErr) {
      console.debug("Impossibile risolvere photoURL via Storage, user may have full URL already:", resolveErr);
    }

    if (emailEl) emailEl.textContent = `Email: ${emailText}`;
    if (nameEl) nameEl.textContent = `Username: ${usernameText ? usernameText : "-"}`;
    if (avatarEl) avatarEl.src = photoURL ? photoURL : "assets/img/avatar-placeholder.svg";
    if (modal) modal.style.display = "flex";
    // focus first nav button if available
    const firstNav = modal.querySelector("[data-tab]");
    firstNav?.focus();

    // load shared songs lists
    try {
      await loadSharedLists(user);
    } catch (sharesErr) {
      console.warn("Errore caricamento condivisioni:", sharesErr);
    }
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

  // Reset buttons (favorites, playlists, friends/shares)
  const resetFavBtn = document.getElementById('resetFavBtn');
  const resetPlaylistsBtn = document.getElementById('resetPlaylistsBtn');
  const resetFriendsBtn = document.getElementById('resetFriendsBtn');

  resetFavBtn?.addEventListener('click', async () => {
    if (!auth.currentUser) { feedback.textContent = 'Devi essere loggato per resettare i preferiti.'; return; }
    if (!confirm('Sei sicuro di voler eliminare tutti i preferiti? Questa operazione è irreversibile.')) return;
    feedback.textContent = 'Eliminazione preferiti in corso...';
    try {
      const uid = auth.currentUser.uid;
      const favCol = collection(db, 'users', uid, 'favorites');
      const snap = await getDocs(favCol);
      const deletes = snap.docs.map(d => deleteDoc(doc(db, 'users', uid, 'favorites', d.id)));
      await Promise.all(deletes);
      feedback.textContent = 'Preferiti eliminati.';
    } catch (err) {
      console.error('Errore eliminazione preferiti:', err);
      feedback.textContent = 'Errore durante l\'eliminazione dei preferiti.';
    }
  });

  resetPlaylistsBtn?.addEventListener('click', async () => {
    if (!auth.currentUser) { feedback.textContent = 'Devi essere loggato per resettare le playlist.'; return; }
    if (!confirm('Sei sicuro di voler eliminare tutte le playlist? Questa operazione è irreversibile.')) return;
    feedback.textContent = 'Eliminazione playlist in corso...';
    try {
      const uid = auth.currentUser.uid;
      const plCol = collection(db, 'users', uid, 'playlists');
      const snap = await getDocs(plCol);
      const deletes = snap.docs.map(d => deleteDoc(doc(db, 'users', uid, 'playlists', d.id)));
      await Promise.all(deletes);
      feedback.textContent = 'Playlist eliminate.';
    } catch (err) {
      console.error('Errore eliminazione playlist:', err);
      feedback.textContent = 'Errore durante l\'eliminazione delle playlist.';
    }
  });

  resetFriendsBtn?.addEventListener('click', async () => {
    if (!auth.currentUser) { feedback.textContent = 'Devi essere loggato per resettare gli amici.'; return; }
    if (!confirm('Sei sicuro di voler eliminare tutte le condivisioni (inviate e ricevute)? Questa operazione è irreversibile.')) return;
    feedback.textContent = 'Eliminazione condivisioni in corso...';
    try {
      const uid = auth.currentUser.uid;
      const myEmail = (auth.currentUser.email || '').trim().toLowerCase();
      // Delete shares where I am the sender
      const sharesCol = collection(db, 'shares');
      const qFrom = query(sharesCol, where('fromUid', '==', uid));
      const qTo = query(sharesCol, where('toEmail', '==', myEmail));
      const [snapFrom, snapTo] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);
      const delFrom = snapFrom.docs.map(d => deleteDoc(doc(db, 'shares', d.id)));
      const delTo = snapTo.docs.map(d => deleteDoc(doc(db, 'shares', d.id)));
      await Promise.all([...delFrom, ...delTo]);

      // Also try removing entries in users/{uid}/shared if present
      try {
        const userSharedCol = collection(db, 'users', uid, 'shared');
        const userSharedSnap = await getDocs(userSharedCol);
        const delUserShared = userSharedSnap.docs.map(d => deleteDoc(doc(db, 'users', uid, 'shared', d.id)));
        await Promise.all(delUserShared);
      } catch (innerErr) {
        console.debug('Nessuna subcollection shared da rimuovere o errore misc:', innerErr);
      }

      feedback.textContent = 'Condivisioni eliminate.';
    } catch (err) {
      console.error('Errore eliminazione condivisioni:', err);
      feedback.textContent = 'Errore durante l\'eliminazione delle condivisioni.';
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

// --- Shared songs helpers ---
async function loadSharedLists(user) {
  const byMeList = document.getElementById("sharedByMeList");
  const withMeList = document.getElementById("sharedWithMeList");
  const friendsList = document.getElementById("friendsList");
  if (!user) {
    if (byMeList) byMeList.innerHTML = "<li class='list-group-item text-muted'>Devi essere loggato</li>";
    if (withMeList) withMeList.innerHTML = "<li class='list-group-item text-muted'>Devi essere loggato</li>";
    if (friendsList) friendsList.innerHTML = "<li class='list-group-item text-muted'>Devi essere loggato</li>";
    return;
  }

  // clear existing
  if (byMeList) byMeList.innerHTML = "";
  if (withMeList) withMeList.innerHTML = "";

  try {
    // shares from me
    const sharesCol = collection(db, 'shares');
    // Query shares from this user. We avoid server-side ordering that requires a composite index
    // and instead sort client-side by createdAt (ISO string) to show newest first.
    const qFrom = query(sharesCol, where('fromUid', '==', user.uid));
    const snapFrom = await getDocs(qFrom);
    let sharesFromArr = [];
    if (!snapFrom.empty) {
      sharesFromArr = snapFrom.docs.map(d => ({ id: d.id, ...d.data() }));
      sharesFromArr.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      sharesFromArr.forEach(item => appendSharedListItem(byMeList, item, item.id, true));
    } else {
      if (byMeList) byMeList.innerHTML = "<li class='list-group-item text-muted'>Non hai condiviso canzoni.</li>";
    }

    // shares to me (by email)
    const myEmail = (user.email || "").trim().toLowerCase();
    const qTo = query(sharesCol, where('toEmail', '==', myEmail));
    const snapTo = await getDocs(qTo);
    let sharesToArr = [];
    if (!snapTo.empty) {
      sharesToArr = snapTo.docs.map(d => ({ id: d.id, ...d.data() }));
      sharesToArr.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      sharesToArr.forEach(item => appendSharedListItem(withMeList, item, item.id, false));
    } else {
      if (withMeList) withMeList.innerHTML = "<li class='list-group-item text-muted'>Nessuna canzone condivisa con te.</li>";
    }

    // build friends list from shares (emails of recipients and senders)
    try {
      const map = new Map();
      const myEmail = (user.email || "").trim().toLowerCase();

      sharesFromArr.forEach(s => {
        const to = (s.toEmail || "").trim().toLowerCase();
        if (!to || to === myEmail) return;
        const entry = map.get(to) || { email: to, sharedByMe: 0, sharedWithMe: 0, last: 0 };
        entry.sharedByMe += 1;
        entry.last = Math.max(entry.last, s.createdAt ? new Date(s.createdAt).getTime() : 0);
        map.set(to, entry);
      });

      sharesToArr.forEach(s => {
        const from = (s.fromEmail || "").trim().toLowerCase();
        if (!from || from === myEmail) return;
        const entry = map.get(from) || { email: from, sharedByMe: 0, sharedWithMe: 0, last: 0 };
        entry.sharedWithMe += 1;
        entry.last = Math.max(entry.last, s.createdAt ? new Date(s.createdAt).getTime() : 0);
        map.set(from, entry);
      });

      // render
      if (friendsList) friendsList.innerHTML = "";
      if (map.size === 0) {
        if (friendsList) friendsList.innerHTML = "<li class='list-group-item text-muted'>Non hai ancora amici.</li>";
      } else {
        // sort by last interaction
        const arr = Array.from(map.values()).sort((a,b) => b.last - a.last);
        arr.forEach(entry => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          const when = entry.last ? new Date(entry.last).toLocaleString() : '';
          li.innerHTML = `<div><div class="fw-bold">${escapeHtml(entry.email)}</div><div class="small text-muted">Ultima attività: ${escapeHtml(when)}</div></div><span class='badge bg-primary rounded-pill'>${entry.sharedByMe + entry.sharedWithMe}</span>`;
          friendsList.appendChild(li);
        });
      }
    } catch (frErr) {
      console.warn('Errore costruzione friends list:', frErr);
    }
  } catch (err) {
    console.error('Errore caricamento condivisioni:', err);
    if (byMeList) byMeList.innerHTML = "<li class='list-group-item text-danger'>Errore nel caricare le condivisioni.</li>";
    if (withMeList) withMeList.innerHTML = "<li class='list-group-item text-danger'>Errore nel caricare le condivisioni.</li>";
  }
}

function appendSharedListItem(container, shareData, id, isFromMe) {
  if (!container) return;
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex justify-content-between align-items-start';
  const title = shareData?.song?.title || 'Titolo non disponibile';
  const artist = shareData?.song?.artist ? ` — ${shareData.song.artist}` : '';
  li.innerHTML = `
    <div class="ms-2 me-auto">
      <div class="fw-bold">${escapeHtml(title)}</div>
      <div class="text-muted small">${escapeHtml(artist)}</div>
    </div>
    <div>
      <button class="btn btn-sm btn-outline-primary play-shared" data-id="${id}">▶️</button>
    </div>
  `;
  container.appendChild(li);
  // attach click handler for play
  const btn = li.querySelector('.play-shared');
  btn.addEventListener('click', () => {
    handlePlayShared(container, shareData);
  });
}

function handlePlayShared(container, shareData) {
  // remove any existing preview in container
  const existing = container.querySelector('.shared-preview');
  if (existing) existing.remove();
  const previewUrl = shareData?.song?.preview;
  if (!previewUrl) {
    const p = document.createElement('div');
    p.className = 'shared-preview text-muted small mt-2';
    p.textContent = 'Anteprima non disponibile';
    container.appendChild(p);
    return;
  }
  const div = document.createElement('div');
  div.className = 'shared-preview mt-2';
  div.innerHTML = `<audio controls src="${escapeHtml(previewUrl)}"></audio>`;
  container.appendChild(div);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s];
  });
}