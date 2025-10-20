export default class HomeView {
    constructor() {
        this.results = document.getElementById("home-container");
        this.welcomeMessage = document.getElementById("welcome-message");
    }

    clearWelcomeMessage() {
        this.welcomeMessage.textContent = "";
    }   

    renderUserCollections(favorites = [], playlists = []) {
    this.results.innerHTML = "";

    const container = document.createElement("div");
    container.className = "user-collections";

    // Box Preferiti
    const favBox = document.createElement("div");
    favBox.className = "card user-box mb-3 favorites-section";
    favBox.style.cursor = "pointer";
    favBox.innerHTML = `<h4>I tuoi preferiti</h4><p>${favorites.length} brani</p>`;
    container.appendChild(favBox);

    favBox.addEventListener("click", () => this.showSongsModal("I tuoi preferiti", favorites));

    // Box Playlist
    playlists.forEach(pl => {
        const plBox = document.createElement("div");
        plBox.className = "card user-box mb-3 playlist-box";
        plBox.style.cursor = "pointer";
        plBox.innerHTML = `<h4>${pl.name}</h4><p>${pl.songs.length} brani</p>`;
        container.appendChild(plBox);

        plBox.addEventListener("click", () => this.showSongsModal(pl.name, pl.songs));
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