// albumView.js
export default class AlbumView {
  constructor(containerId = "results-container") {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`#${containerId} not found`);
  }

  renderLoading() {
    this.container.innerHTML = `<p>⏳ Caricamento album...</p>`;
  }

  renderAlbum(album) {
    // album = { id, title, artist, releaseDate, coverImage, tracks: [{title,duration,preview}] }
    const html = `
      <button id="back-btn">← Torna ai risultati</button>
      <div class="album-detail">
  <img src="${album.coverImage || 'assets/img/avatar-placeholder.svg'}" alt="${album.title}" />
        <h2>${album.title}</h2>
        <p>Artista: ${album.artist}</p>
        <p>Uscita: ${album.releaseDate || "N/A"}</p>
        <ol>
          ${album.tracks.map(t => `<li>${t.title}${t.duration ? " — "+t.duration : ""} ${t.preview ? `<audio src="${t.preview}" controls></audio>` : ""}</li>`).join("")}
        </ol>
      </div>
    `;
    this.container.innerHTML = html;
  }

  bindBack(handler) {
    const btn = document.getElementById("back-btn");
    if (btn) btn.addEventListener("click", handler);
  }
}
