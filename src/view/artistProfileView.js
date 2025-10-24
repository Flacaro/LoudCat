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
        <div class="card p-4 shadow-lg">
          <h2>${artist.name}</h2>
          
          <div class="artist-info-badges mb-4">
            ${artist.country ? `<span class="artist-info-badge"><span class="emoji">🌍</span> ${artist.country}</span>` : ''}
            ${artist.type ? `<span class="artist-info-badge"><span class="emoji">🎭</span> ${artist.type}</span>` : ''}
          </div>
          
          ${artist.disambiguation ? `<p class="mb-3"><em>${artist.disambiguation}</em></p>` : ""}
          
          ${artist.links?.length ? `
            <h5>🔗 Link ufficiali</h5>
            <ul class="links-list">
              ${artist.links.map(url => {
                const domain = new URL(url).hostname.replace('www.', '');
                return `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${domain} ↗</a></li>`;
              }).join("")}
            </ul>` : ""}
          
          ${artist.albums?.length ? `
            <h5>💿 Pubblicazioni</h5>
            <ul class="albums-list">
              ${artist.albums.map(r => `
                <li class="album-release">
                  <span>${r.title}</span>
                  <span class="release-type">${r.type}</span>
                </li>
              `).join("")}
            </ul>` : '<p class="empty-state">Nessuna pubblicazione trovata.</p>'}
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
