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
    const name =
      user && user.displayName
        ? user.displayName
        : user && user.email
          ? user.email
          : "Utente";
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

  showSongsModal(title, songs) {
    const modal = document.createElement("div");
    modal.className = "playlist-modal";

    const content = document.createElement("div");
    content.className = "playlist-modal-content card p-3";
    Object.assign(content.style, {
      maxWidth: "980px",
      width: "100%",
      maxHeight: "calc(100vh - 80px)",
      overflowY: "auto",
      borderRadius: "8px",
    });

    content.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">${title}</h5>
        <button class="btn-close" aria-label="Close"></button>
      </div>
      <div class="container-fluid">
        <div class="row g-3">
          ${songs
        .map(
          (s, i) => `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
              <div class="card song-card h-100" data-index="${i}" data-song-id="${s.id || ""
            }">
                <div class="artwork-container">
                  <img src="${s.artwork || "assets/img/avatar-placeholder.svg"}"
                       alt="${s.title || ""}" 
                       style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div class="card-body p-2">
                  <h6 class="card-title mb-1" 
                      style="font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                      ${s.title || "-"}
                  </h6>
                  <p class="card-text text-muted mb-1"
                     style="font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                     ${s.artist || ""}
                  </p>
                  ${s.preview
              ? `<audio class="song-preview" controls preload="none" src="${s.preview}">
                           Il tuo browser non supporta l'audio
                         </audio>`
              : `<div class="text-muted small">Preview non disponibile</div>`
            }
                </div>
                <div class="overlay-link" aria-hidden="true"></div>
              </div>
            </div>`
        )
        .join("")}
        </div>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Chiudi modale
    content.querySelector(".btn-close")?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    // Gestione audio
    const originalOverflow = content.style.overflowY;
    const audios = content.querySelectorAll(".song-preview");

    audios.forEach((audio) => {
      audio.addEventListener("play", () => {
        content.style.overflowY = "visible";
        audios.forEach((other) => {
          if (other !== audio) other.pause();
        });
      });
      const restoreOverflow = () =>
        (content.style.overflowY = originalOverflow || "auto");
      audio.addEventListener("pause", restoreOverflow);
      audio.addEventListener("ended", restoreOverflow);

      ["click", "pointerdown", "mousedown"].forEach((ev) =>
        audio.addEventListener(ev, (e) => e.stopPropagation())
      );
    });

    // Gestione click sulle card
    content.querySelectorAll(".song-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("audio") || e.target.closest("button")) return;
        const index = Number(card.dataset.index);
        const song = songs[index];
        if (!song) return;

        if (typeof this._songClickHandler === "function") {
          try {
            this._songClickHandler(song);
          } catch (err) {
            console.error("songClick handler error", err);
          }
          modal.remove();
        } else if (song.id) {
          window.location.href = `#/song?id=${encodeURIComponent(song.id)}`;
        }
      });
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

    // Render playlists, favorites e consigliati
    container.appendChild(createRow(playlists, "playlists"));
    container.appendChild(createRow(favorites, "favorites"));
    container.appendChild(createRow(recommended, "recommended")); // sempre renderizzata

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

  renderOnlySection(type, items = []) {
  if (!this.results) return;
  this.results.innerHTML = "";

  const container = document.createElement("div");
  container.className = "spotify-home";

  const section = document.createElement("div");
  section.className = "home-section";

  const titleMap = {
    playlists: "Le tue playlist",
    favorites: "I tuoi preferiti",
  };

  section.innerHTML = `<h5>${titleMap[type] || "Sezione"}</h5>`;

  const row = document.createElement("div");

  if (type === "favorites" || type === "playlists") {
  row.className = "cards-row grid-layout"; // ✅ stessa logica anche per playlist
} else {
  row.className = "cards-row";
}


  // 🔹 Se è la sezione playlist → aggiungi la card "Crea playlist"
  if (type === "playlists") {
    const addCard = document.createElement("div");
    addCard.className = "playlist-card create-card";
    addCard.innerHTML = `
      <div class="fw-semibold mt-2">Crea playlist</div>
    `;
    addCard.addEventListener("click", () => {
      if (this.playlistController)
        this.playlistController.handleCreatePlaylist();
    });
    row.appendChild(addCard);
  }

  // 🔹 Se non ci sono elementi
  if (!items || items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "text-muted placeholder-card";
    empty.textContent = "Nessun elemento da mostrare";
    row.appendChild(empty);
  } else {
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = type === "playlists" ? "playlist-card" : "song-card";

      if (type === "playlists") {
        card.innerHTML = `
          <div class="song-artwork-wrapper">
            <div class="song-artwork"
              style="background-image:url('${
                item.songs?.[0]?.artwork || "assets/img/avatar-placeholder.svg"
              }');"></div>
          </div>
          <div class="text-truncate fw-semibold mt-1">${item.name}</div>
          <small>${(item.songs || []).length} brani</small>
        `;
        card.addEventListener("click", () => {
          this.showSongsModal(item.name, item.songs || [], item.id, false);
        });
      } else if (type === "favorites") {
        card.innerHTML = `
          <div class="song-artwork-wrapper">
            <div class="song-artwork"
              style="background-image:url('${
                item.artwork || "assets/img/avatar-placeholder.svg"
              }'); border-radius:50%;"></div>
          </div>
          <div class="text-truncate fw-semibold mt-1">${item.title}</div>
          <small>${item.artist || ""}</small>
          ${
            item.preview
              ? `<audio class="song-preview" controls preload="none" src="${item.preview}"></audio>`
              : `<div class="text-muted small">Preview non disponibile</div>`
          }
        `;
      }

      row.appendChild(card);
    });
  }

  section.appendChild(row);
  container.appendChild(section);
  this.results.appendChild(container);

  // Forza reflow e stile coerente (come in home)
  requestAnimationFrame(() => {
    const home = document.querySelector(".spotify-home");
    if (home && !home.classList.contains("loaded")) home.classList.add("loaded");
    this.results.offsetHeight;
    window.dispatchEvent(new Event("resize"));
  });
}





}
