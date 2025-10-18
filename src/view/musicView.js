// musicView.js
// Gestisce la parte visiva e l'interazione utente

import PlaylistView from "./paylistView.js";

export default class MusicView {
  constructor() {
    this.input = document.getElementById("search-input");
    this.button = document.getElementById("search-btn");
    this.results = document.getElementById("results-container");
    this.playlistView = new PlaylistView();
  }

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

renderArtists(artists) {
  const html = artists
    .map(artist => `
      <div class="card artist-card">
  <img src="${artist.image || 'assets/img/avatar-placeholder.svg'}" alt="${artist.name}" />
        <h3>${artist.name}</h3>
        ${artist.genre ? `<p>🎵 ${artist.genre}</p>` : ""}
        ${artist.albums?.length ? `
          <h4>Top Albums:</h4>
          <ul>
            ${artist.albums.map(a => `<li>${a}</li>`).join("")}
          </ul>` : ""}
      </div>
    `)
    .join("");
  this.results.insertAdjacentHTML("beforeend", html);
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
          + Aggiungi alla playlist
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


bindCreatePlaylist(handler) {
  const btn = document.getElementById("createPlaylistBtn");
  btn?.addEventListener("click", () => {
    const name = prompt("Inserisci il nome della nuova playlist:");
    if (name) handler(name);
  });
}

bindAddToPlaylist(handler) {
    this.playlistHandler = handler;
  }

  bindRenderCollection(handler) {
    this.renderCollectionHandler = handler;
  }

  showPlaylistModal(song, playlists, onSelect) {
    this.playlistView.showModal(song, playlists, onSelect);
  }

  updatePlaylistButton(songId, playlistId, isAdded) {
  const btns = this.results.querySelectorAll(`.playlist-btn[data-song*="${songId}"]`);
  btns.forEach(btn => {
    btn.textContent = isAdded ? "- Rimuovi dalla playlist" : "+ Aggiungi alla playlist";
    btn.classList.toggle("btn-outline-primary", !isAdded);
    btn.classList.toggle("btn-danger", isAdded);
  });
}


}
