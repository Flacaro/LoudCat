export default class HomeView {
  constructor() {
    this.results = document.getElementById("home-container");
    this.welcomeMessage = document.getElementById("welcome-message");
    this._songClickHandler = null;
    this.playlistController = null;
  }

  setPlaylistController(controller) {
    this.playlistController = controller;
  }

  showWelcomeMessage(user) {
    if (!this.welcomeMessage) return;
    const name = user && user.displayName ? user.displayName : (user && user.email) ? user.email : "Utente";
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
            </div>
          `
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

      // Evita click propagation
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
          // fallback: navigazione standard
          window.location.href = `#/song?id=${encodeURIComponent(song.id)}`;
        }
      });
    });
  }

  renderSpotifyHome(favorites = [], playlists = [], recommended = []) {
    if (!this.results) return;
    this.results.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'spotify-home';

    const createRow = (items, type) => {
      const section = document.createElement('div');
      section.className = 'home-section';

      const titleMap = { playlists: 'Le tue playlist', favorites: 'I tuoi preferiti', recommended: 'Consigliati per te' };
      section.innerHTML = `<h5>${titleMap[type]}</h5>`;

      const row = document.createElement('div');
      row.className = 'cards-row';

      // --- Card speciale “Crea playlist” SOLO per le playlist ---
      if (type === 'playlists') {
        const addCard = document.createElement('div');
        addCard.className = 'playlist-card create-card';
        addCard.textContent = 'Crea playlist';

        // Collega la card al handler della playlist
        addCard.addEventListener('click', () => {
          if (this.playlistController && typeof this.playlistController.createPlaylist === 'function') {
            this.playlistController.createPlaylist();
          } else {
            console.error("PlaylistController o createPlaylist non è accessibile o definito in HomeView.");
          }

        });

        row.appendChild(addCard);
      }

      // --- Card normali ---
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = type === 'playlists' ? 'playlist-card' : 'song-card';

        if (type === 'playlists') {
          card.innerHTML = `
          <div class="song-artwork-wrapper">
            <div class="song-artwork" style="background-image:url('${item.songs?.[0]?.artwork || 'assets/img/avatar-placeholder.svg'}');"></div>
          </div>
          <div class="text-truncate fw-semibold mt-1">${item.name}</div>
            <small>${(item.songs || []).length} brani</small>
          `;
          card.addEventListener('click', () => {
            this.showSongsModal(item.name, item.songs || []);
          });
        } else {
          card.innerHTML = `
        <div class="song-artwork-wrapper">
          <div class="song-artwork" style="background-image:url('${item.artwork || 'assets/img/avatar-placeholder.svg'}'); border-radius: 50%; /* Aggiungi questo per l'immagine tonda del brano */"></div>
        </div>
        <div class="text-truncate fw-semibold mt-1">${item.title}</div>
        <small>${item.artist || ''}</small>
        ${item.preview
              ? `<audio class="song-preview" controls preload="none" src="${item.preview}"></audio>`
              : `<div class="text-muted small">Preview non disponibile</div>`
            }
      `;
        }

        row.appendChild(card);
      });

      section.appendChild(row);
      return section;
    };



    if (playlists.length) container.appendChild(createRow(playlists, 'playlists'));
    if (favorites.length) container.appendChild(createRow(favorites, 'favorites'));
    if (recommended.length) container.appendChild(createRow(recommended, 'recommended'));

    this.results.appendChild(container);
  }

}
