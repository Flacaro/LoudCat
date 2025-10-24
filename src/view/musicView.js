// musicView.js
// Gestisce la parte visiva e l'interazione utente

import PlaylistView from "./playlistView.js";
import FavoriteView from "./favoriteView.js";

export default class MusicView {
  constructor() {
    this.input = document.getElementById("search-input");
    this.button = document.getElementById("search-btn");
    this.results = document.getElementById("results-container");
    this.playlistView = new PlaylistView();
    this.favoriteView = new FavoriteView();
    this.playlistBtn = document.getElementById('sidebar-playlist-btn');
        this.artistBtn = document.getElementById('sidebar-artist-btn');
        this.albumBtn = document.getElementById('sidebar-album-btn');
    // store the last results object passed to renderResults
    this._lastRenderedResults = null;
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
    const song = this._parseSongData(fav);
    if (this.favHandler) this.favHandler(song);
    e.stopPropagation();
    return;
  }

  if (pbtn) {
    const song = this._parseSongData(pbtn);
    if (this.playlistHandler) this.playlistHandler(song);
    e.stopPropagation();
    return;
  }

  if (sbtn) {
    const song = this._parseSongData(sbtn);
    if (this.shareHandler) this.shareHandler(song);
    e.stopPropagation();
    return;
  }
});

    this.results.addEventListener('click', (e) => {
      const card = e.target.closest('.song-card');
      if (!card) return;
      if (e.target.closest('button, .fav-btn, .playlist-btn, .share-btn')) return;
      const song = this._parseSongData(card);
      if (this.songClickHandler) this.songClickHandler(song);
    });
  }

  _parseSongData(input) {
    const tryParse = (s) => {
      if (!s) return null;
      try {
        return JSON.parse(s);
      } catch (err) {
        return null;
      }
    };

    // If caller passed an element, read the dataset.song first then fall
    // back to individual attributes.
    if (input instanceof HTMLElement) {
      const raw = input.dataset.song;
      let parsed = tryParse(raw) || tryParse(decodeURIComponent(raw || "")) || tryParse(decodeURIComponent(decodeURIComponent(raw || "")));
      if (parsed) return parsed;

      // Fallback: build object from individual data attributes (they are encoded when set)
      const build = (k) => {
        const v = input.dataset[k];
        try { return v ? decodeURIComponent(v) : undefined; } catch (e) { return v; }
      };
      const fallback = {
        id: input.dataset.songId || build('songId'),
        title: build('songTitle') || input.dataset.songTitle,
        artist: build('songArtist') || input.dataset.songArtist,
        album: build('songAlbum') || input.dataset.songAlbum,
        artwork: build('songArtwork') || input.dataset.songArtwork,
        preview: build('songPreview') || input.dataset.songPreview,
      };
      return fallback;
    }

    // Otherwise input is a raw string: try parsing several decode strategies
    const raw = input;
    let parsed = tryParse(raw);
    if (parsed) return parsed;
    try {
      parsed = tryParse(decodeURIComponent(raw));
      if (parsed) return parsed;
    } catch (e) {}
    try {
      parsed = tryParse(decodeURIComponent(decodeURIComponent(raw)));
      if (parsed) return parsed;
    } catch (e) {}

    console.error('Failed to parse song data from dataset:', raw);
    return {};
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
// Render artist results with deduplication
renderArtists(artists) {
  const resultsContainer = document.getElementById("results-container");
  if (!resultsContainer) return;

  // Deduplicate by artistId
  const uniqueArtistsMap = new Map();
  artists.forEach(artist => {
    if (!uniqueArtistsMap.has(artist.artistId)) {
      uniqueArtistsMap.set(artist.artistId, artist);
    }
  });
  const uniqueArtists = Array.from(uniqueArtistsMap.values());

  const html = uniqueArtists
    .map(artist => {
      // Use the canonical name for display, or fallback to API name
      const displayName = artist.canonicalName || artist.name || "Unknown";

      return `
        <div class="card artist-card" 
          data-artist-id="${artist.artistId}" 
          data-artist-name="${displayName}">
          <div class="artist-tag">🎸 Artista</div>
          <div class="artist-icon">🎤</div>
          <h3>${displayName}</h3>
          <p class="artist-subtitle">Clicca per esplorare</p>
        </div>
      `;
    })
    .join("");

  resultsContainer.insertAdjacentHTML("beforeend", html);

  // Bind click events
  document.querySelectorAll(".artist-card").forEach(card => {
    card.addEventListener("click", () => {
      const artistId = card.dataset.artistId;
      const artistName = card.dataset.artistName;
      window.dispatchEvent(new CustomEvent("artist:click", { detail: { artistId, artistName } }));
    });
  });
}


showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
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
  const html = songs.map(s => {
    const songObj = {
      id: s.id || s.title.replace(/\s+/g,'-').toLowerCase(),
      title: s.title,
      artist: s.artist,
      album: s.album,
      artwork: s.artwork,
      preview: s.preview
    };
    const encoded = encodeURIComponent(JSON.stringify(songObj));
    return `
      <div class="card song-card" data-song='${encoded}' data-song-id='${songObj.id}'>
        <img src="${s.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${s.title}" />
        <h4>${s.title}</h4>
        <p>${s.artist}</p>
        ${s.album ? `<p>${s.album}</p>` : ""}
        ${s.preview 
          ? `<audio class="song-preview" controls preload="none" src="${s.preview}"></audio>` 
          : `<div class="text-muted small">Preview non disponibile</div>`}
        <button class="btn btn-outline-warning fav-btn" 
          data-song='${encoded}' data-song-id='${songObj.id}' data-song-title='${encodeURIComponent(songObj.title || '')}' data-song-artist='${encodeURIComponent(songObj.artist || '')}' data-song-album='${encodeURIComponent(songObj.album || '')}' data-song-artwork='${encodeURIComponent(songObj.artwork || '')}' data-song-preview='${encodeURIComponent(songObj.preview || '')}'>⭐ Aggiungi ai preferiti</button>
        <button class="btn btn-outline-primary playlist-btn" 
          data-song='${encoded}' data-song-id='${songObj.id}' data-song-title='${encodeURIComponent(songObj.title || '')}' data-song-artist='${encodeURIComponent(songObj.artist || '')}' data-song-album='${encodeURIComponent(songObj.album || '')}' data-song-artwork='${encodeURIComponent(songObj.artwork || '')}' data-song-preview='${encodeURIComponent(songObj.preview || '')}'>+ Aggiungi alla playlist</button>
        <button class="btn btn-outline-success share-btn" 
          data-song='${encoded}' data-song-id='${songObj.id}' data-song-title='${encodeURIComponent(songObj.title || '')}' data-song-artist='${encodeURIComponent(songObj.artist || '')}' data-song-album='${encodeURIComponent(songObj.album || '')}' data-song-artwork='${encodeURIComponent(songObj.artwork || '')}' data-song-preview='${encodeURIComponent(songObj.preview || '')}'>↗ Condividi</button>
      </div>
    `;
  }).join("");

  this.results.insertAdjacentHTML("beforeend", html);
  
  // Add audio control behavior to prevent card click when interacting with audio
  this.results.querySelectorAll('.song-preview').forEach(audio => {
    ['click', 'pointerdown', 'mousedown'].forEach(ev => 
      audio.addEventListener(ev, (e) => e.stopPropagation())
    );
  });
}

  renderSongsnoAuth(songs){
    const html = songs.map(s => {
    const songObj = {
      id: s.id || s.title.replace(/\s+/g,'-').toLowerCase(),
      title: s.title,
      artist: s.artist,
      album: s.album,
      artwork: s.artwork,
      preview: s.preview
    };
    const encoded = encodeURIComponent(JSON.stringify(songObj));
    return `
      <div class="card song-card" data-song='${encoded}' data-song-id='${songObj.id}'>
        <img src="${s.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${s.title}" />
        <h4>${s.title}</h4>
        <p>${s.artist}</p>
        ${s.album ? `<p>${s.album}</p>` : ""}
        ${s.preview 
          ? `<audio class="song-preview" controls preload="none" src="${s.preview}"></audio>` 
          : `<div class="text-muted small">Preview non disponibile</div>`}
        <p class="login-warning">
          Devi accedere per poter usare queste funzioni!
        </p>
      </div>
    `;
  }).join("");

  this.results.insertAdjacentHTML("beforeend", html);
  
  // Add audio control behavior
  this.results.querySelectorAll('.song-preview').forEach(audio => {
    ['click', 'pointerdown', 'mousedown'].forEach(ev => 
      audio.addEventListener(ev, (e) => e.stopPropagation())
    );
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
    this.button.addEventListener("click", (e) => {
      e.preventDefault();
      const query = this.input.value.trim();
      if(query) handler(query);
    });
    this.input.addEventListener("keydown", (e) => {
      if(e.key === "Enter") {
        e.preventDefault();
        const query = this.input.value.trim();
        if(query) handler(query);
      }
    });
  }

  renderLoading() {
    this.results.innerHTML = "<p>⏳ Ricerca in corso...</p>";
  }

  renderResults({songs = [], albums = [], artists = []} = {}, userLogged) {
    this.results.innerHTML = "";
    // cache last rendered results for controllers that may request it
    this._lastRenderedResults = { songs, albums, artists };

    if(Array.isArray(artists) && artists.length) this.renderArtists(artists);
    if(Array.isArray(songs) && songs.length) {
      if(userLogged) {
        this.renderSongs(songs);
      } else {
        this.renderSongsnoAuth(songs);
      }
    }
    if(Array.isArray(albums) && albums.length) this.renderAlbums(albums);

    try {
      this.results.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start'});
    } catch(e) {
      console.warn('Impossibile scrollare i risultati', e)
    }
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

  // helper used by controllers to obtain the last-rendered results (if any)
  getRenderedResults() {
    return this._lastRenderedResults;
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
  const btns = this.results.querySelectorAll(`.playlist-btn[data-song-id="${songId}"]`);
  btns.forEach(btn => {
    btn.textContent = isAdded ? "- Rimuovi dalla playlist" : "+ Aggiungi alla playlist";
    btn.classList.toggle("btn-outline-primary", !isAdded);
    btn.classList.toggle("btn-danger", isAdded);
  });
}



}
