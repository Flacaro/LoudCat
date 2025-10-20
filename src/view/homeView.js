export default class HomeView {
    constructor() {
        this.results = document.getElementById("results-container");
        this.welcomeMessage = document.getElementById("welcome-message");
    }

    showWelcomeMessage(username) {
        this.welcomeMessage.textContent = `Benvenuto, ${username}!`;
    }

    clearWelcomeMessage() {
        this.welcomeMessage.textContent = "";
    }   

    renderUserCollections(favorites = [], playlists = []) {
  this.results.innerHTML = "";

  const container = document.createElement("div");
  container.className = "user-collections";

  // Box unico preferiti
  container.innerHTML += `
    <div class="card user-box mb-3 favorites-section" id="favBox" style="cursor:pointer;">
      <h4>I tuoi preferiti</h4>
      <p>${favorites.length} brani</p>
    </div>
  `;

  // Box per ogni playlist
  playlists.forEach(pl => {
    container.innerHTML += `
      <div class="card user-box mb-3 playlist-box" data-playlist='${encodeURIComponent(JSON.stringify(pl))}' style="cursor:pointer;">
        <h4>${pl.name}</h4>
        <p>${pl.songs.length} brani</p>
      </div>
    `;
  });

  this.results.appendChild(container);

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