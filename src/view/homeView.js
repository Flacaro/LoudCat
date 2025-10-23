import PlaylistController from "../controller/playlistController.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";

export default class HomeView {
  constructor() {
    this.results = document.getElementById("home-container");
    this.welcomeMessage = document.getElementById("welcome-message");
    this._songClickHandler = null;
    this.playlistController = new PlaylistController(this);
  }

  showWelcomeMessage(user) {
    if (!this.welcomeMessage) return;
    const name = user && user.displayName ? user.displayName : user && user.email ? user.email : "Utente";
    this.welcomeMessage.textContent = `Ciao, ${name}`;
    this.welcomeMessage.classList.remove("d-none");
  }

  clearWelcomeMessage() {
    if (this.welcomeMessage) {
      this.welcomeMessage.textContent = "";
      this.welcomeMessage.classList.add("d-none");
    }
  }

  bindSongClick(handler) {
    this._songClickHandler = typeof handler === "function" ? handler : null;
  }

  showSongsModal(title, songs, playlistId = null, isFavorites = false) {
    const modal = document.createElement('div');
    modal.className = 'playlist-modal';

    const content = document.createElement('div');
    content.className = 'playlist-modal-content card p-3';
    Object.assign(content.style, {
      maxWidth: '980px',
      width: '100%',
      maxHeight: 'calc(100vh - 80px)',
      overflowY: 'auto',
      borderRadius: '8px'
    });

    const cardsHtml = songs.map((s, i) => `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <div class="card song-card h-100" data-index="${i}" data-song-id="${s.id || ''}">
          <div class="artwork-container">
            <img src="${s.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${s.title || ''}" style="width:100%; height:100%; object-fit:cover;" />
          </div>
          <div class="card-body p-2">
            <h6 class="card-title mb-1" style="font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.title || '-'}</h6>
            <p class="card-text text-muted mb-1" style="font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.artist || ''}</p>
            ${s.preview ? `<audio class="song-preview" controls preload="none" src="${s.preview}">Il tuo browser non supporta l'audio</audio>` : `<div class="text-muted small">Preview non disponibile</div>`}
          </div>
          <div class="d-flex justify-content-center mt-2">
            <button class="btn btn-sm btn-danger trash-btn" data-song-id="${s.id || ''}" title="Rimuovi">🗑</button>
          </div>
          <div class="overlay-link" aria-hidden="true"></div>
        </div>
      </div>`).join('');

    content.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">${title}</h5>
        <button class="btn-close" aria-label="Close"></button>
      </div>
      <div class="container-fluid">
        <div class="row g-3">
          ${cardsHtml}
        </div>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    content.querySelector('.btn-close')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    const originalOverflow = content.style.overflowY;
    const audios = content.querySelectorAll('.song-preview');
    audios.forEach((audio) => {
      audio.addEventListener('play', () => {
        content.style.overflowY = 'visible';
        audios.forEach((other) => { if (other !== audio) other.pause(); });
      });
      const restoreOverflow = () => (content.style.overflowY = originalOverflow || 'auto');
      audio.addEventListener('pause', restoreOverflow);
      audio.addEventListener('ended', restoreOverflow);
      ['click','pointerdown','mousedown'].forEach(ev => audio.addEventListener(ev, (e) => e.stopPropagation()));
    });

    content.querySelectorAll('.song-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('audio') || e.target.closest('button')) return;
        const index = Number(card.dataset.index);
        const song = songs[index];
        if (!song) return;
        if (typeof this._songClickHandler === 'function') {
          try { this._songClickHandler(song); } catch (err) { console.error('songClick handler error', err); }
          modal.remove();
        } else if (song.id) {
          window.location.href = `#/song?id=${encodeURIComponent(song.id)}`;
        }
      });
    });

    modal.addEventListener('click', async (e) => {
      const btn = e.target.closest('.trash-btn');
      if (!btn) return;
      const songId = btn.dataset.songId;
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) { this.showToast('Devi effettuare il login per rimuovere elementi.', 'warning'); return; }

      btn.disabled = true;
      try {
        if (isFavorites) {
          const favRef = doc(db, 'users', user.uid, 'favorites', songId);
          await deleteDoc(favRef);
          this.showToast('Brano rimosso dai preferiti.', 'info');
        } else if (playlistId) {
          const plRef = doc(db, 'users', user.uid, 'playlists', playlistId);
          const snap = await getDoc(plRef);
          const data = snap.exists() ? snap.data() : null;
          if (data && Array.isArray(data.songs)) {
            const updated = data.songs.filter(s => s.id !== songId);
            await updateDoc(plRef, { songs: updated });
            this.showToast('Brano rimosso dalla playlist.', 'info');
          } else {
            this.showToast('Playlist non trovata o formato inatteso.', 'warning');
          }
        } else {
          const favRef = doc(db, 'users', user.uid, 'favorites', songId);
          await deleteDoc(favRef);
          this.showToast('Brano rimosso.', 'info');
        }

        const col = btn.closest('.col-12, .col-12');
        if (col) col.remove();
      } catch (err) {
        console.error('Errore durante la rimozione:', err);
        this.showToast('Errore durante la rimozione del brano.', 'error');
        btn.disabled = false;
      }
    });
  }

  showCreatePlaylistModal(onConfirm) {
    const modal = document.createElement("div");
    modal.className = "playlist-modal";

    const content = document.createElement("div");
    content.className = "playlist-modal-content card p-3";
    Object.assign(content.style, {
      maxWidth: "400px",
      width: "100%",
      borderRadius: "12px",
      textAlign: "center",
    });

    content.innerHTML = `
    <h5 class="mb-3">Crea nuova playlist</h5>
    <input id="playlistNameInput" class="form-control mb-3" type="text" placeholder="Nome playlist" />
    <div class="d-flex justify-content-end gap-2">
      <button id="cancelBtn" class="btn btn-secondary">Annulla</button>
      <button id="createBtn" class="btn btn-primary">Crea</button>
    </div>
  `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const input = content.querySelector("#playlistNameInput");
    const btnCreate = content.querySelector("#createBtn");
    const btnCancel = content.querySelector("#cancelBtn");

    const closeModal = () => modal.remove();

    btnCancel.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    btnCreate.addEventListener("click", () => {
      const name = input.value.trim();
      closeModal();
      if (typeof onConfirm === "function") onConfirm(name);
    });

    input.focus();
  }

  renderSpotifyHome(favorites = [], playlists = [], recommended = []) {
    if (!this.results) return;
    this.results.innerHTML = "";

    const container = document.createElement("div");
    container.className = "spotify-home";

    const createRow = (items, type) => {
        const section = document.createElement("div");
        section.className = "home-section";

        const titleMap = {
            playlists: "Le tue playlist",
            favorites: "I tuoi preferiti",
            recommended: "Consigliati per te",
        };
        section.innerHTML = `<h5>${titleMap[type]}</h5>`;

        const row = document.createElement("div");
        row.className = "cards-row";

        // Card “Crea playlist”
        if (type === "playlists") {
            const addCard = document.createElement("div");
            addCard.className = "playlist-card create-card";
            addCard.textContent = "Crea playlist";
            addCard.addEventListener("click", () => {
                this.playlistController.handleCreatePlaylist();
            });
            row.appendChild(addCard);
        }

        if (items.length === 0) {
            // Placeholder se non ci sono canzoni/playlist
            const placeholder = document.createElement("div");
            placeholder.className = "placeholder-card text-muted";
            placeholder.textContent = type === "recommended" 
                ? "Nessun consiglio disponibile al momento" 
                : "Nessun elemento da mostrare";
            row.appendChild(placeholder);
        } else {
            items.forEach((item) => {
                const card = document.createElement("div");
                card.className = type === "playlists" ? "playlist-card" : "song-card";

        if (type === "playlists") {
          card.innerHTML = `
            <div class="song-artwork-wrapper">
              <div class="song-artwork" style="background-image:url('${item.songs?.[0]?.artwork || "assets/img/avatar-placeholder.svg"}');"></div>
            </div>
            <div class="text-truncate fw-semibold mt-1">${item.name}</div>
            <small>${(item.songs || []).length} brani</small>
            <button class="btn btn-sm btn-danger playlist-trash-btn" data-playlist-id="${item.id || ''}" title="Elimina playlist">🗑</button>
          `;
          card.addEventListener("click", (e) => {
            // if click is on trash button, don't open modal
            if (e.target.closest('.playlist-trash-btn')) return;
            this.showSongsModal(item.name, item.songs || [], item.id, false);
          });
        } else {
                    card.innerHTML = `
                        <div class="song-artwork-wrapper">
                            <div class="song-artwork" 
                                style="background-image:url('${item.artwork || "assets/img/avatar-placeholder.svg"}'); border-radius: 50%;"></div>
                        </div>
                        <div class="text-truncate fw-semibold mt-1">${item.title}</div>
                        <small>${item.artist || ""}</small>
                        ${item.preview 
                            ? `<audio class="song-preview" controls preload="none" src="${item.preview}"></audio>` 
                            : `<div class="text-muted small">Preview non disponibile</div>`}
                    `;
                }
                row.appendChild(card);
            });
        }

        section.appendChild(row);
        return section;
    };

    container.appendChild(createRow(playlists, "playlists"));
    const favSection = createRow(favorites, "favorites");
    favSection.addEventListener('click', (e) => { if (e.target.closest('button, a')) return; this.showSongsModal('I tuoi preferiti', favorites, null, true); });
    container.appendChild(favSection);
    container.appendChild(createRow(recommended, "recommended"));

    this.results.appendChild(container);

    // delegated handler for playlist deletion (trash on playlist cards)
    container.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('.playlist-trash-btn');
      if (!btn) return;
      ev.stopPropagation();
      const playlistId = btn.dataset.playlistId;
      if (!playlistId) return;

      const confirmed = window.confirm('Sei sicuro di voler eliminare questa playlist? Questa operazione non è reversibile.');
      if (!confirmed) return;

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) { this.showToast('Devi effettuare il login per eliminare playlist.', 'warning'); return; }

      btn.disabled = true;
      try {
        const plRef = doc(db, 'users', user.uid, 'playlists', playlistId);
        await deleteDoc(plRef);
        this.showToast('Playlist eliminata.', 'info');
        const card = btn.closest('.playlist-card');
        if (card) card.remove();
      } catch (err) {
        console.error('Errore eliminazione playlist:', err);
        this.showToast('Errore durante l\'eliminazione della playlist.', 'error');
        btn.disabled = false;
      }
    });
  }


  showToast(message, type = "info") {
    document.querySelectorAll(".custom-toast").forEach(t => t.remove());
    const toast = document.createElement("div");
    toast.className = `custom-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 3000);
  }

}
