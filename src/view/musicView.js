// musicView.js
// Gestisce la parte visiva e l'interazione utente

export default class MusicView {
  constructor() {
    this.input = document.getElementById("search-input");
    this.button = document.getElementById("search-btn");
    this.results = document.getElementById("results-container");
  }
  // inside MusicView class

renderAlbums(albums) {
  const html = albums
    .map(a => `
      <div class="card album-card" data-album-id="${a.collectionId}">
        <img src="${a.artwork || './assets/default-artwork.png'}" alt="${a.title}" />
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
        <img src="${artist.artwork || './assets/default-artwork.png'}" alt="${artist.name}" />
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
        <img src="${s.artwork || './assets/default-artwork.png'}" alt="${s.title}" />
        <h4>${s.title}</h4>
        <p>${s.artist}</p>
        ${s.album ? `<p>${s.album}</p>` : ""}
        ${s.preview ? `<audio controls src="${s.preview}"></audio>` : "<p>Preview non disponibile</p>"}
      </div>
    `)
    .join("");
  this.results.insertAdjacentHTML("beforeend", html);
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

}
