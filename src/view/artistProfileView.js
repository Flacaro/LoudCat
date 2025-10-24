// src/view/artistProfileView.js
export default class ArtistProfileView {
  constructor() {
    this.results = document.getElementById("results-container");
    if (!this.results) throw new Error("ArtistProfileView: #results-container not found");
  }

  renderLoading() {
    this.results.innerHTML = `
      <div class="artist-profile-loading">
        <div class="loading-spinner">⏳</div>
        <p>Caricamento profilo artista...</p>
      </div>
    `;
  }

  // Render partial profile while albums are being enriched
  renderPartialProfile(artist, albumsLoading = false) {
    const html = this._buildProfileHtml(artist, albumsLoading);
    this.results.innerHTML = html;
  }

  renderArtistProfile(artist) {
    const html = this._buildProfileHtml(artist, false);
    this.results.innerHTML = html;

    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("artist:back"));
      });
    }

    // Bind click events for clickable album cards
    this.results.querySelectorAll('.album-card-clickable').forEach(card => {
      card.addEventListener('click', () => {
        const albumId = card.dataset.albumId;
        if (albumId) {
          window.dispatchEvent(new CustomEvent("album:click", { detail: { albumId } }));
        }
      });
    });
  }

  _buildProfileHtml(artist, albumsLoading = false) {
    return `
      <div class="artist-profile">
        <button id="backBtn" class="btn btn-secondary mb-4">
          <span class="back-arrow">←</span> Torna ai risultati
        </button>
        
        <div class="card artist-profile-card">
          <!-- Header Section -->
          <div class="artist-header">
            <div class="artist-avatar">
              <span class="avatar-icon">🎤</span>
            </div>
            <div class="artist-title-group">
              <h2 class="artist-name">${artist.name}</h2>
              ${artist.disambiguation ? `<p class="artist-subtitle">${artist.disambiguation}</p>` : ""}
            </div>
          </div>

          <!-- Info Badges Section -->
          ${artist.country || artist.type ? `
            <div class="artist-info-section">
              <div class="artist-info-badges">
                ${artist.country ? `
                  <span class="artist-info-badge">
                    <span class="badge-icon">🌍</span>
                    <span class="badge-label">Provenienza</span>
                    <span class="badge-value">${artist.country}</span>
                  </span>
                ` : ''}
                ${artist.type ? `
                  <span class="artist-info-badge">
                    <span class="badge-icon">🎭</span>
                    <span class="badge-label">Tipo</span>
                    <span class="badge-value">${artist.type}</span>
                  </span>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Official Links Section -->
          ${artist.links?.length ? `
            <div class="artist-section">
              <h5 class="section-title">
                <span class="section-icon">🔗</span>
                Link ufficiali
              </h5>
              <div class="links-grid">
                ${artist.links.map(url => {
                  let domain = '';
                  let icon = '🌐';
                  try {
                    domain = new URL(url).hostname.replace('www.', '');
                    // Add specific icons for known platforms
                    if (domain.includes('spotify')) icon = '🎵';
                    else if (domain.includes('youtube')) icon = '📺';
                    else if (domain.includes('instagram')) icon = '📷';
                    else if (domain.includes('facebook')) icon = '👥';
                    else if (domain.includes('twitter') || domain.includes('x.com')) icon = '🐦';
                    else if (domain.includes('wikipedia')) icon = '📖';
                    else if (domain.includes('bandcamp')) icon = '🎸';
                    else if (domain.includes('soundcloud')) icon = '🔊';
                  } catch (e) {
                    domain = 'Link esterno';
                  }
                  return `
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-card">
                      <span class="link-icon">${icon}</span>
                      <span class="link-domain">${domain}</span>
                      <span class="link-arrow">↗</span>
                    </a>
                  `;
                }).join("")}
              </div>
            </div>
          ` : ''}

          <!-- Albums/Publications Section -->
          <div class="artist-section">
            <h5 class="section-title">
              <span class="section-icon">💿</span>
              Discografia
              ${artist.albums?.length ? `<span class="section-count">${artist.albums.length}</span>` : ''}
            </h5>
            ${albumsLoading ? `
              <div class="albums-loading">
                <div class="loading-spinner">⏳</div>
                <p>Collegamento con iTunes in corso...</p>
              </div>
            ` : artist.albums?.length ? `
              <div class="albums-grid">
                ${artist.albums.map((r, idx) => {
                  const isClickable = r.isClickable && r.collectionId;
                  const clickableClass = isClickable ? 'album-card-clickable' : 'album-card-disabled';
                  const dataAttr = isClickable ? `data-album-id="${r.collectionId}"` : '';
                  
                  return `
                    <div class="album-card ${clickableClass}" ${dataAttr} style="animation-delay: ${idx * 0.05}s">
                      <div class="album-number">#${idx + 1}</div>
                      <div class="album-info">
                        <span class="album-title">${r.title}</span>
                        <div class="album-badges">
                          <span class="album-type-badge">${r.type || 'Album'}</span>
                          ${isClickable ? '<span class="album-available-badge">✓ Disponibile</span>' : '<span class="album-unavailable-badge">iTunes N/D</span>'}
                        </div>
                      </div>
                      ${r.date ? `<span class="album-date">${r.date}</span>` : ''}
                      ${isClickable ? '<span class="album-view-icon">👁️</span>' : ''}
                    </div>
                  `;
                }).join("")}
              </div>
              <p class="artist-profile-note">
                <small>💡 Clicca sugli album disponibili per visualizzare i dettagli e le tracce da iTunes.</small>
              </p>
            ` : `
              <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p>Nessuna pubblicazione trovata</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
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
