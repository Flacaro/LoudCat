import { doc, getDoc, collection, getDocs, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showToast } from "../view/toastView.js";

export default class UserController {

  getCurrentUser() {
    const auth = getAuth();
    return auth.currentUser;
  }

  async loadUserCollections(userId) {
    if (!userId) return { favorites: [], playlists: [] };

    const favCol = collection(db, "users", userId, "favorites");
    const favSnap = await getDocs(favCol);
    const favorites = favSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const playlistsSnap = await getDocs(collection(db, "users", userId, "playlists"));
    const playlists = playlistsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return { favorites, playlists };
  }

  renderUserCollections({ favorites, playlists }) {
  const container = document.getElementById("home-container");
  container.innerHTML = "";

  // --- Preferiti ---
  const favBox = document.createElement("div");
  favBox.className = "card user-box mb-3 favorites-section";
  favBox.style.cursor = "pointer";

  // Prendiamo le prime 3 copertine dei preferiti
  const favPreview = favorites.slice(0, 3).map(song => `
    <img src="${song.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${song.title}" class="preview-artwork">
  `).join("");

  favBox.innerHTML = `
    <h4>I tuoi preferiti</h4>
    <div class="preview-container">${favPreview}</div>
    <p>${favorites.length} brani</p>
  `;
  container.appendChild(favBox);
  favBox.addEventListener("click", () => this.showSongsModal("I tuoi preferiti", favorites, null, true));

  // --- Playlist ---
  playlists.forEach(pl => {
    const plBox = document.createElement("div");
    plBox.className = "card user-box mb-3 playlist-box";
    plBox.style.cursor = "pointer";

    // Anteprima delle prime 3 canzoni della playlist
    const plPreview = pl.songs.slice(0, 3).map(song => `
      <img src="${song.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${song.title}" class="preview-artwork">
    `).join("");

    plBox.innerHTML = `
      <h4>${pl.name}</h4>
      <div class="preview-container">${plPreview}</div>
      <p>${pl.songs.length} brani</p>
    `;
    container.appendChild(plBox);

  plBox.addEventListener("click", () => this.showSongsModal(pl.name, pl.songs, pl.id, false));
  });

  // Messaggi se non ci sono dati
  if (!favorites.length) {
    const msg = document.createElement("p");
    msg.textContent = "Nessun preferito";
    container.appendChild(msg);
  }
  if (!playlists.length) {
    const msg = document.createElement("p");
    msg.textContent = "Nessuna playlist creata";
    container.appendChild(msg);
  }
}

  showSongsModal(title, songs, playlistId = null, isFavorites = false) {
  const modal = document.createElement("div");
  modal.className = "playlist-modal"; 
  modal.innerHTML = `
    <div class="playlist-modal-content">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5>${title}</h5>
        <button class="btn-close" aria-label="Close"></button>
      </div>
      <div class="modal-songs-container row gy-3">
        ${songs.map(song => `
          <div class="col-md-4">
            <div class="card song-card hover-card">
              <img src="${song.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${song.title}" />
              <h4>${song.title}</h4>
              <p>${song.artist}</p>
              <div class="d-flex justify-content-center mt-2">
                <button class="btn btn-sm btn-danger trash-btn" data-song-id="${song.id}" title="Rimuovi">🗑</button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Chiudi modale
  modal.querySelector(".btn-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
  if (e.target === modal || e.target.classList.contains("btn-close")) {
    modal.remove();
  }
});
  // Delegate trash button clicks
  modal.addEventListener('click', async (e) => {
    const btn = e.target.closest('.trash-btn');
    if (!btn) return;
    const songId = btn.dataset.songId;
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      showToast('Devi effettuare il login per rimuovere elementi.');
      return;
    }

    // disable button to avoid double clicks
    btn.disabled = true;

    try {
      if (isFavorites) {
        // favorites are stored as documents under users/{uid}/favorites/{songId}
        const favRef = doc(db, 'users', user.uid, 'favorites', songId);
        await deleteDoc(favRef);
        showToast('Brano rimosso dai preferiti.');
      } else if (playlistId) {
        // remove song from playlist songs array
        const plRef = doc(db, 'users', user.uid, 'playlists', playlistId);
        const snap = await getDoc(plRef);
        const data = snap.exists() ? snap.data() : null;
        if (data && Array.isArray(data.songs)) {
          const updated = data.songs.filter(s => s.id !== songId);
          await updateDoc(plRef, { songs: updated });
          showToast('Brano rimosso dalla playlist.');
        } else {
          showToast('Playlist non trovata o formato inatteso.');
        }
      } else {
        // generic: try to remove from favorites as fallback
        const favRef = doc(db, 'users', user.uid, 'favorites', songId);
        await deleteDoc(favRef);
        showToast('Brano rimosso.');
      }

      // remove card from modal UI
      const cardCol = btn.closest('.col-md-4');
      if (cardCol) cardCol.remove();
    } catch (err) {
      console.error('Errore durante la rimozione:', err);
      showToast('Errore durante la rimozione del brano.');
      btn.disabled = false;
    }
  });

}

}
