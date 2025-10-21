// src/view/artistProfileView.js
export default class ArtistProfileView {
  constructor() {
    this.results = document.getElementById("results-container");
    if (!this.results) throw new Error("ArtistProfileView: #results-container not found");
  }

  // Loading indicator
  renderLoading() {
    this.results.innerHTML = `<p>⏳ Caricamento profilo artista...</p>`;
  }

  // Render detailed MusicBrainz artist profile
  renderArtistProfile(artist) {
    const html = `
      <div class="artist-profile">
        <button id="backBtn" class="btn btn-secondary mb-3">← Torna ai risultati</button>
        <div class="card p-3 shadow-sm">
          <h2>${artist.name}</h2>
          <p>🌍 Paese: ${artist.country}</p>
          <p>🎭 Tipo: ${artist.type}</p>
          ${artist.disambiguation ? `<p><em>${artist.disambiguation}</em></p>` : ""}
          ${artist.links?.length ? `
            <h5>🔗 Link ufficiali:</h5>
            <ul>
              ${artist.links.map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join("")}
            </ul>` : ""}
          ${artist.albums?.length ? `
            <h5 class="mt-3">💿 Pubblicazioni:</h5>
            <ul>
              ${artist.albums.map(r => `<li>${r.title} (${r.type})</li>`).join("")}
            </ul>` : "<p>Nessuna pubblicazione trovata.</p>"}
        </div>
      </div>
    `;
    this.results.innerHTML = html;

    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("artist:back"));
      });
    }
  }

  renderError(msg = "❌ Errore nel caricamento del profilo artista.") {
    this.results.innerHTML = `<p>${msg}</p>`;
  }

  bindBack(handler) {
    // Ensure we don't accumulate multiple listeners over time.
    if (this._boundBackHandler) {
      try { window.removeEventListener('artist:back', this._boundBackHandler); } catch(e) {}
    }
    this._boundBackHandler = handler;
    window.addEventListener("artist:back", handler);
  }
}
