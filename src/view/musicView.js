// musicView.js
// Gestisce la parte visiva e l'interazione utente

import PlaylistView from "./playlistView.js";
import FavoriteView from "./favoriteView.js";
import { showToast } from "./toastView.js";

export default class MusicView {
  constructor() {
    this.input = document.getElementById("search-input");
    this.button = document.getElementById("search-btn");
    this.results = document.getElementById("results-container");
    this.playlistView = new PlaylistView();
    this.favoriteView = new FavoriteView();
    // wire playlist create button via playlistView
    this.playlistView.bindCreatePlaylist((name) => {
      if (this.createPlaylistHandler) this.createPlaylistHandler(name);
    });
    // delegated click handling for action buttons
    this.results.addEventListener('click', (e) => {
      const fav = e.target.closest('.fav-btn');
      const pbtn = e.target.closest('.playlist-btn');
      const sbtn = e.target.closest('.share-btn');
      if (fav) {
        const song = JSON.parse(decodeURIComponent(fav.dataset.song || '%7B%7D'));
        if (this.favHandler) this.favHandler(song);
        return;
      }
      if (pbtn) {
        const song = JSON.parse(decodeURIComponent(pbtn.dataset.song || '%7B%7D'));
        if (this.playlistHandler) this.playlistHandler(song);
        return;
      }
      if (sbtn) {
        const song = JSON.parse(decodeURIComponent(sbtn.dataset.song || '%7B%7D'));
        if (this.shareHandler) this.shareHandler(song);
        return;
      }
    });
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
                }))}' data-song-id='${s.id || s.title.replace(/\s+/g,'-').toLowerCase()}'>
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
                }))}' data-song-id='${s.id || s.title.replace(/\s+/g,'-').toLowerCase()}'>
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
                }))}' data-song-id='${s.id || s.title.replace(/\s+/g,'-').toLowerCase()}'>
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

  // delegate to FavoriteView
  updateFavoriteState(songId, isFav) {
    this.favoriteView.updateFavoriteState(songId, isFav);
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
    // use PlaylistView binder
    this.createPlaylistHandler = handler;
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
