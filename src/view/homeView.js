export default class HomeView {
  constructor() {
    this.results = document.getElementById("home-container");
    this.welcomeMessage = document.getElementById("welcome-message");
    this._songClickHandler = null; // callback opzionale
  }

   clearWelcomeMessage() {
      if (this.welcomeMessage) {
        this.welcomeMessage.textContent = "";
        this.welcomeMessage.classList.add("d-none");
      }
    }
    showWelcomeMessage(user) {
      if (!this.welcomeMessage) return;
      const name = user && user.displayName ? user.displayName : (user && user.email) ? user.email : "Utente";
      this.welcomeMessage.textContent = `Ciao, ${name}`;
      this.welcomeMessage.classList.remove("d-none");
    }

  // --- Render preferiti e playlist ---
  renderUserCollections(favorites = [], playlists = []) {
    this.results.innerHTML = "";

    const container = document.createElement("div");
    container.className = "user-collections";

    // Sezione Preferiti
    container.appendChild(
      this._createCollectionBox(
        "I tuoi preferiti",
        favorites,
        favorites.length,
        () => this.showSongsModal("I tuoi preferiti", favorites)
      )
    );

    // Sezioni Playlist
    playlists.forEach((pl) => {
      container.appendChild(
        this._createCollectionBox(
          pl.name,
          pl.songs || [],
          (pl.songs || []).length,
          () => this.showSongsModal(pl.name, pl.songs || [])
        )
      );
    });

    this.results.appendChild(container);
  }

  // --- Helper per costruire box di raccolte ---
  _createCollectionBox(title, songs, count, onClick) {
    const box = document.createElement("div");
    box.className = "user-box playlist-box";
    box.style.cursor = "pointer";

    const previewHtml = songs
      .slice(0, 3)
      .map((song, i, arr) => {
        if (i === 2 && arr.length > 3) {
          return `<div class="more-count">+${arr.length - 2}</div>`;
        }
        return `<img src="${song.artwork || "assets/img/avatar-placeholder.svg"}" alt="${song.title}" class="preview-artwork"/>`;
      })
      .join("");

    box.innerHTML = `
      <h4>${title}</h4>
      <small class="text-muted">${count} brani</small>
      <div class="preview-container">${previewHtml}</div>
    `;

    box.addEventListener("click", onClick);
    return box;
  }

  // --- Modale con le canzoni ---
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
              <div class="card song-card h-100" data-index="${i}" data-song-id="${
                s.id || ""
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
                  ${
                    s.preview
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

  // --- Binding handler esterno ---
  bindSongClick(handler) {
    this._songClickHandler =
      typeof handler === "function" ? handler : null;
  }
}
