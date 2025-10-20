// musicView.js
// Gestisce la parte visiva e l'interazione utente

export default class MusicView {
  constructor() {
    this.input = document.getElementById("search-input");
    this.button = document.getElementById("search-btn");
    this.results = document.getElementById("results-container");
  }
  // inside MusicView class

   showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

renderAlbums(albums) {
  const html = albums
    .map(a => `
      <div class="card album-card" data-album-id="${a.id}">
  <img src="${a.coverImage || 'assets/img/avatar-placeholder.svg'}" alt="${a.title}" />
        <h3>${a.title}</h3>
        <p class="artist">${a.artist}</p>
        ${a.releaseDate ? `<p>📅 ${a.releaseDate}</p>` : ""}
        ${a.genre ? `<p>🎶 ${a.genre}</p>` : ""}
        ${a.tracks?.length ? `<p>Tracks: ${a.tracks.length}</p>` : ""}
      </div>
    `)
    .join("");
  this.results.insertAdjacentHTML("beforeend", html);
}

// src/view/musicView.js
renderArtists(artists) {
  const resultsContainer = document.getElementById("results-container");
  if (!resultsContainer) return;

  resultsContainer.innerHTML = "";

  const html = artists.map(artist => {
    const picture =
      artist.image ||
      artist.artworkUrl100 || // iTunes field
      artist.picture ||
      "assets/img/avatar-placeholder.svg";

    return `
      <div class="card artist-card" data-artist-id="${artist.id}" data-artist-name="${artist.name}">
        <img src="${picture}" alt="${artist.name}" />
        <h3>${artist.name}</h3>
        <p>🎵 ${artist.genre || "Unknown genre"}</p>
      </div>
    `;
  }).join("");

  resultsContainer.insertAdjacentHTML("beforeend", html);

  // Bind click events for artist cards
  document.querySelectorAll(".artist-card").forEach(card => {
    card.addEventListener("click", () => {
      const artistId = card.dataset.artistId;
      const artistName = card.dataset.artistName;
      window.dispatchEvent(new CustomEvent("artist:click", { detail: { artistId, artistName } }));
    });
  });
}




bindArtistClick(handler) {
  this.results.addEventListener("click", (e) => {
    const card = e.target.closest(".artist-card");
    if (!card) return;

    const artistId = card.dataset.artistId;
    const artistName = card.querySelector("h3")?.textContent.trim();

    if (artistId || artistName) {
      handler({ artistId, artistName });
    }
  });
}



renderSongs(songs) {
  const html = songs
    .map(s => `
      <div class="card song-card">
  <img src="${s.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${s.title}" />
        <h4>${s.title}</h4>
        <p>${s.artist}</p>
        ${s.album ? `<p>${s.album}</p>` : ""}
        ${s.preview ? `<audio controls src="${s.preview}"></audio>` : "<p>Preview non disponibile</p>"}
        <button class="btn btn-outline-warning fav-btn" 
                data-song='${encodeURIComponent(JSON.stringify({
                  id: s.id || s.title.replace(/\s+/g,'-').toLowerCase(),
                  title: s.title,
                  artist: s.artist,
                  album: s.album,
                  artwork: s.artwork,
                  preview: s.preview
                }))}'>
          ⭐ Aggiungi ai preferiti
        </button>
        <button class="btn btn-outline-primary playlist-btn" 
                data-song='${encodeURIComponent(JSON.stringify({
                  id: s.id || s.title.replace(/\s+/g,'-').toLowerCase(),
                  title: s.title,
                  artist: s.artist,
                  album: s.album,
                  artwork: s.artwork,
                  preview: s.preview
                }))}'>
          + Playlist
        </button>
        <button class="btn btn-outline-success share-btn" 
                data-song='${encodeURIComponent(JSON.stringify({
                  id: s.id || s.title.replace(/\s+/g,'-').toLowerCase(),
                  title: s.title,
                  artist: s.artist,
                  album: s.album,
                  artwork: s.artwork,
                  preview: s.preview
                }))}'>
          ↗ Condividi
        </button>
      
        </div>
    `)
    .join("");

  this.results.insertAdjacentHTML("beforeend", html);

  this.results.querySelectorAll(".fav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const song = JSON.parse(decodeURIComponent(btn.dataset.song));
      this.favHandler(song) && this.favHandler(song);
    });

  });

  this.results.querySelectorAll(".playlist-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const song = JSON.parse(decodeURIComponent(btn.dataset.song));
      this.playlistHandler(song) && this.playlistHandler(song);
    });
  });

  this.results.querySelectorAll(".share-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const song = JSON.parse(decodeURIComponent(btn.dataset.song));
      this.shareHandler && this.shareHandler(song);
    });
  });
}

  bindFavoriteToggle(handler) {
    this.favHandler = handler;
  }

  updateFavoriteState(songId, isFav) {
  const btn = this.results.querySelector(`.fav-btn[data-song*="${songId}"]`);
  if (btn) {
    btn.textContent = isFav ? "💛 Rimuovi dai preferiti" : "⭐ Aggiungi ai preferiti";
    btn.classList.toggle("btn-warning", isFav);
    btn.classList.toggle("btn-outline-warning", !isFav);
  }
}

  bindAddToPlaylist(handler) {
    this.playlistHandler = handler;
  }

  bindShare(handler) {
    this.shareHandler = handler;
  }


  bindSearch(handler) {
    this.button.addEventListener("click", () => {
      const query = this.input.value.trim();
      if (query) handler(query);
    });
  }

  renderLoading() {
    this.results.innerHTML = "<p>⏳ Ricerca in corso...</p>";
  }

  renderResults({songs, albums, artists}) {
    if(artists.length){ this.renderArtists(artists);}
    if(songs.length){ this.renderSongs(songs);}
    if(albums.length){ this.renderAlbums(albums);}

  }

  

  renderError() {
    this.results.innerHTML = "<p>❌ Errore durante la ricerca.</p>";
  }

  bindAlbumClick(handler) {
  this.results.addEventListener("click", (e) => {
    const albumCard = e.target.closest(".album-card");
    if (!albumCard) return;
    const albumId = albumCard.dataset.albumId;
    handler(albumId);
  });
}

renderTracks(tracks, albumId) {
  const albumCard = this.results.querySelector(`.album-card[data-album-id="${albumId}"]`);
  if (!albumCard) return;
  const tracklistHtml = `
    <ol class="tracklist">
      ${tracks.map(t => `<li>${t.title} ${t.duration ? "- "+t.duration : ""}</li>`).join("")}
    </ol>`;
  albumCard.insertAdjacentHTML("beforeend", tracklistHtml);
}



renderUserCollections(favorites = [], playlists = []) {
  this.results.innerHTML = "";

  const favHtml = favorites.length ? favorites.map(s => `
    <div class="card song-card user-card">
  <img src="${s.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${s.title}" />
        <h4>${s.title}</h4>
        <p>${s.artist}</p>
        <div class="hover-actions">
          <button class="btn btn-sm btn-outline-primary playlist-btn" data-song='${encodeURIComponent(JSON.stringify(s))}'>+ Playlist</button>
          <button class="btn btn-sm btn-outline-success share-btn" data-song='${encodeURIComponent(JSON.stringify(s))}'>↗ Condividi</button>
        </div>
      </div>
    `).join("")
    : `<p>⭐ Nessun preferito salvato.</p>`;

    const playlistHtml = playlists.length ? playlists.map(pl => `
      <div class="card playlist-card user-card">
        <h4>${pl.name}</h4>
        <p>${pl.songs.length} brani</p>
        <div class="hover-actions">
          <button class="btn btn-sm btn-outline-success play-btn">▶ Riproduci</button>
        </div>
      </div>
    `).join("")
    : `<p>🎵 Nessuna playlist creata.</p>`;

    const container = document.createElement("div");
    container.className = "user-collections";
    container.innerHTML = `
    <h3>I tuoi preferiti</h3>
    <div class="favorites">${favHtml}</div>
    <h3>Le tue playlist</h3>
    <div class="playlists">${playlistHtml}</div>
  `;

  this.results.appendChild(container);

  // bind dei pulsanti hover
  container.querySelectorAll(".playlist-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const song = JSON.parse(decodeURIComponent(btn.dataset.song));
      this.playlistHandler && this.playlistHandler(song);
    });
  });

  container.querySelectorAll(".share-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const song = JSON.parse(decodeURIComponent(btn.dataset.song));
      this.shareHandler && this.shareHandler(song);
    });
  });


  container.querySelectorAll(".play-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // implementa la logica di riproduzione della playlist
      this.showToast("Funzionalità di riproduzione non ancora implementata.");
    });
  });
}

bindCreatePlaylist(handler) {
  const btn = document.getElementById("createPlaylistBtn");
  btn?.addEventListener("click", () => {
    const name = prompt("Inserisci il nome della nuova playlist:");
    if (name) handler(name);
  });
}

}
