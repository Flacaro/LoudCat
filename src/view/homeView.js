export default class HomeView {
    constructor() {
        this.results = document.getElementById("home-container");
        this.welcomeMessage = document.getElementById("welcome-message");
    }

  showWelcomeMessage(name) {
    if (this.welcomeMessage) this.welcomeMessage.textContent = `Benvenuto, ${name}!`;
  }

    clearWelcomeMessage() {
        this.welcomeMessage.textContent = "";
    }   
// homeView.js - modifica renderUserCollections
renderUserCollections(favorites = [], playlists = []) {
  this.results.innerHTML = "";

  const container = document.createElement("div");
  container.className = "user-collections";

  // Box Preferiti
  const favBox = document.createElement("div");
  favBox.className = "user-box favorites-section";
  favBox.style.cursor = "pointer";

  const favPreviewHtml = favorites.slice(0,3).map((song,i,arr) => {
    if (i === 2 && arr.length > 3) {
      return `<div class="more-count">+${arr.length-2}</div>`;
    }
    return `<img src="${song.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${song.title}" class="preview-artwork"/>`;
  }).join('');

  favBox.innerHTML = `
    <h4>I tuoi preferiti</h4>
    <small class="text-muted">${favorites.length} brani</small>
    <div class="preview-container">${favPreviewHtml}</div>
  `;
  container.appendChild(favBox);

  favBox.addEventListener("click", () => this.showSongsModal("I tuoi preferiti", favorites));

  // Box Playlist
  playlists.forEach(pl => {
    const plBox = document.createElement("div");
    plBox.className = "user-box playlist-box";
    plBox.style.cursor = "pointer";

    const plPreviewHtml = (pl.songs || []).slice(0,3).map((song,i,arr) => {
      if (i === 2 && arr.length > 3) {
        return `<div class="more-count">+${arr.length-2}</div>`;
      }
      return `<img src="${song.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${song.title}" class="preview-artwork"/>`;
    }).join('');

    plBox.innerHTML = `
      <h4>${pl.name}</h4>
      <small class="text-muted">${(pl.songs||[]).length} brani</small>
      <div class="preview-container">${plPreviewHtml}</div>
    `;

    plBox.addEventListener("click", () => this.showSongsModal(pl.name, pl.songs || []));
    container.appendChild(plBox);
  });

  this.results.appendChild(container);
}


  _parseDataAttribute(raw) {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      try {
        return JSON.parse(decodeURIComponent(raw));
      } catch (e2) {
        try {
          return JSON.parse(decodeURIComponent(decodeURIComponent(raw)));
        } catch (e3) {
          console.error('Failed to parse data attribute', raw);
          return {};
        }
      }
    }
  }

showSongsModal(title, songs) {
  const modal = document.createElement("div");
  modal.className = "playlist-modal";
  // overlay centrale: allineiamo in alto e aggiungiamo padding per mobile
  Object.assign(modal.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    zIndex: "1200",
    padding: "24px",
    overflowY: "auto"
  });

  const content = document.createElement("div");
  content.className = "playlist-modal-content card p-3";
  // limita l'altezza e abilita lo scroll interno invece di far uscire le card
  content.style.maxWidth = "980px";
  content.style.width = "100%";
  content.style.maxHeight = "calc(100vh - 80px)";
  content.style.overflowY = "auto";
  content.style.borderRadius = "8px";

  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">${title}</h5>
      <button class="btn-close" aria-label="Close"></button>
    </div>
    <div class="container-fluid">
      <div class="row g-3">
        ${ (songs || []).map((s, index) => `
          <div class="col-12 col-sm-6 col-md-4 col-lg-3">
            <div class="card song-card h-100" data-index="${index}" style="cursor:pointer;">
              <div style="height:140px; overflow:hidden;">
                <img src="${s.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${s.title || ''}" style="width:100%; height:100%; object-fit:cover;">
              </div>
              <div class="card-body p-2">
                <h6 class="card-title mb-1" style="font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.title || '-'}</h6>
                <p class="card-text text-muted mb-0" style="font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.artist || ''}</p>
              </div>
            </div>
          </div>
        `).join("") }
      </div>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // chiudi modale
  const closeBtn = content.querySelector(".btn-close");
  if (closeBtn) closeBtn.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

  // click su card (delegazione)
  content.querySelectorAll(".song-card").forEach(card => {
    card.addEventListener("click", () => {
      const idx = Number(card.dataset.index);
      const song = (songs || [])[idx];
      console.log("Hai cliccato sulla canzone:", song);
      // TODO: avviare riproduzione o invocare handler del controller
    });
  });
}

}