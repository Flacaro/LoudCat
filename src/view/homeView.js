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

    renderUserCollections(favorites = [], playlists = []) {
    this.results.innerHTML = "";

    const container = document.createElement("div");
    container.className = "user-collections";

    // Box Preferiti (with artwork previews)
    const favBox = document.createElement("div");
    favBox.className = "card user-box mb-3 favorites-section";
    favBox.style.cursor = "pointer";
    const favPreviewHtml = (favorites.slice(0,3).map(song => `
      <img src="${song.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${song.title || ''}" class="preview-artwork"/>
    `).join('')) || '';

    favBox.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <h4 class="mb-0">I tuoi preferiti</h4>
        <small class="text-muted">${favorites.length} brani</small>
      </div>
      <div class="preview-container mt-2">${favPreviewHtml}</div>
    `;
    container.appendChild(favBox);

    favBox.addEventListener("click", () => this.showSongsModal("I tuoi preferiti", favorites));

    // Box Playlist (each with artwork previews)
    playlists.forEach(pl => {
        const plBox = document.createElement("div");
        plBox.className = "card user-box mb-3 playlist-box";
        plBox.style.cursor = "pointer";
        const plPreviewHtml = (pl.songs || []).slice(0,3).map(song => `
          <img src="${song.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${song.title || ''}" class="preview-artwork"/>
        `).join('');

        plBox.innerHTML = `
          <div class="d-flex justify-content-between align-items-center">
            <h4 class="mb-0">${pl.name}</h4>
            <small class="text-muted">${(pl.songs||[]).length} brani</small>
          </div>
          <div class="preview-container mt-2">${plPreviewHtml}</div>
        `;
        container.appendChild(plBox);

        plBox.addEventListener("click", () => this.showSongsModal(pl.name, pl.songs || []));
    });

    this.results.appendChild(container);
}



  showSongsModal(title, songs) {
    const modal = document.createElement("div");
    modal.className = "playlist-modal"; 
    modal.innerHTML = `
      <div class="playlist-modal-content">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5>${title}</h5>
          <button class="btn-close" aria-label="Close"></button>
        </div>
        <ul class="list-group mb-3">
          ${songs.map(s => `<li class="list-group-item">${s.title} - ${s.artist}</li>`).join("")}
        </ul>
      </div>
    `;

    document.body.appendChild(modal);


  // Event listener per aprire il modale dei preferiti
  const favBox = document.getElementById("favBox");
  favBox.addEventListener("click", () => {
    this.showSongsModal("I tuoi preferiti", favorites);
  });

  // Event listener per aprire il modale delle playlist
  container.querySelectorAll(".playlist-box").forEach(box => {
    box.addEventListener("click", () => {
      const playlist = this._parseDataAttribute(box.dataset.playlist);
      this.showSongsModal(playlist.name || 'Playlist', playlist.songs || []);
    });
  });
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
  modal.innerHTML = `
    <div class="playlist-modal-content">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5>${title}</h5>
        <button class="btn-close" aria-label="Close"></button>
      </div>
      <ul class="list-group mb-3">
        ${songs.map(s => `<li class="list-group-item">${s.title} - ${s.artist}</li>`).join("")}
      </ul>
    </div>
  `;

  document.body.appendChild(modal);

  // Chiudi modale
  modal.querySelector(".btn-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}




}