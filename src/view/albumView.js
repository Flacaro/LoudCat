export default class AlbumView {
  constructor(containerId = "results-container") {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`#${containerId} not found`);
  }

  renderLoading() {
    this.container.innerHTML = `
      <div class="album-view-loading">
        <div class="loading-logo">
          <img src="assets/logo/LoudCatLogo.PNG" alt="LoudCat" class="logo-spin" />
        </div>
        <div class="loading-content">
          <h3>Caricamento album</h3>
          <p>Un momento, stiamo recuperando i dettagli...</p>
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
  }

  renderAlbum(album) {
    const html = `
      <div class="album-view-container">
        <button id="back-btn" class="btn btn-secondary mb-4">
          <span class="back-arrow">←</span> Torna ai risultati
        </button>
        
        <div class="album-detail">
          <div class="album-header-section">
            <img src="${album.coverImage || 'assets/img/avatar-placeholder.svg'}" 
                 alt="${album.title}" 
                 class="album-cover-image" />
            <div class="album-header-info">
              <h2 class="album-detail-title">${album.title}</h2>
              <p class="album-detail-artist">
                <span class="detail-icon">🎤</span> ${album.artist}
              </p>
              <p class="album-detail-release">
                <span class="detail-icon">📅</span> ${album.releaseDate || "Data sconosciuta"}
              </p>
              <div class="album-detail-stats">
                <span class="detail-stat-badge">
                  <span class="detail-icon">🎵</span>
                  ${album.tracks.length} ${album.tracks.length === 1 ? 'traccia' : 'tracce'}
                </span>
              </div>
            </div>
          </div>

          <div class="album-tracklist-section">
            <h3 class="album-section-title">
              <span class="detail-icon">🎶</span>
              Tracklist
            </h3>
            <ol class="album-tracklist">
              ${album.tracks.map((t, idx) => `
                <li class="album-track-item" style="animation-delay: ${idx * 0.05}s">
                  <span class="track-num">${idx + 1}</span>
                  <div class="track-details">
                    <span class="track-name">${t.title}</span>
                    ${t.duration ? `<span class="track-time">${t.duration}</span>` : ''}
                  </div>
                  ${t.preview ? `
                    <audio class="track-audio" controls preload="none" src="${t.preview}"></audio>
                  ` : `<span class="track-no-preview">Anteprima non disponibile</span>`}
                </li>
              `).join("")}
            </ol>
          </div>

          <div class="album-review-section">
            <h3 class="album-section-title">
              <span class="detail-icon">⭐</span>
              Valutazioni e recensioni
            </h3>
            
            <div class="review-rating-summary">
              <p id="average-rating" class="avg-rating-display">
                <span class="rating-stars-display">⭐⭐⭐⭐⭐</span>
                <span class="rating-stats-text">0 (nessuna recensione)</span>
              </p>
            </div>

            <div class="review-input-form">
              <h4>Lascia la tua recensione</h4>
              <div class="star-rating">
                ${[1,2,3,4,5].map(n => `<span class="star" data-value="${n}">☆</span>`).join("")}
              </div>
              <textarea id="review-text" 
                        placeholder="Scrivi la tua recensione (opzionale)..."
                        rows="4"></textarea>
              <button id="submit-review" class="btn btn-primary">
                <span>✍️</span> Invia recensione
              </button>
            </div>

            <div id="user-review-list" class="review-cards-list"></div>
          </div>
        </div>
      </div>
    `;
    this.container.innerHTML = html;

    this._bindStars(album.id);
    this._bindSubmitReview(album.id);
    this._loadExistingReviews(album.id);
  }

  bindBack(handler) {
    const btn = document.getElementById("back-btn");
    if (btn) btn.addEventListener("click", handler);
  }

  _bindStars(albumId) {
    const stars = this.container.querySelectorAll(".star");
    let selectedRating = 0;

    const reviews = JSON.parse(localStorage.getItem("albumReviews") || "[]");
    const lastUserReview = reviews.filter(r => r.albumId === albumId && r.user === "Utente").pop();
    if (lastUserReview) selectedRating = lastUserReview.rating;

    const updateStars = (value) => {
      stars.forEach(s => {
        s.textContent = s.dataset.value <= value ? "★" : "☆";
        s.classList.toggle('active', s.dataset.value <= value);
      });
    };

    updateStars(selectedRating);

    stars.forEach(star => {
      const value = parseInt(star.dataset.value);
      star.addEventListener("mouseover", () => updateStars(value));
      star.addEventListener("mouseout", () => updateStars(selectedRating));
      star.addEventListener("click", () => {
        selectedRating = value;
        updateStars(selectedRating);
      });
    });
  }

  _bindSubmitReview(albumId) {
    const btn = this.container.querySelector("#submit-review");
    const textArea = this.container.querySelector("#review-text");

    btn.addEventListener("click", () => {
      const stars = this.container.querySelectorAll(".star");
      const rating = Array.from(stars).filter(s => s.textContent === "★").length;
      const text = textArea.value.trim();

      if (rating === 0) {
        alert("Seleziona almeno una stella!");
        return;
      }

      const review = { 
        albumId, 
        rating, 
        text, 
        user: "Utente", 
        date: new Date().toLocaleDateString('it-IT') 
      };
      const reviews = JSON.parse(localStorage.getItem("albumReviews") || "[]");
      reviews.push(review);
      localStorage.setItem("albumReviews", JSON.stringify(reviews));

      textArea.value = "";
      stars.forEach(s => {
        s.textContent = "☆";
        s.classList.remove('active');
      });

      this._loadExistingReviews(albumId);
    });
  }

  _loadExistingReviews(albumId) {
    const reviews = JSON.parse(localStorage.getItem("albumReviews") || "[]");
    const albumReviews = reviews.filter(r => r.albumId === albumId);
    const displayDiv = this.container.querySelector("#user-review-list");
    const avgDiv = this.container.querySelector("#average-rating");

    if (!displayDiv || !avgDiv) return;

    if (albumReviews.length === 0) {
      avgDiv.innerHTML = `
        <span class="rating-stars-display empty-rating">☆☆☆☆☆</span>
        <span class="rating-stats-text">Nessuna recensione</span>
      `;
      displayDiv.innerHTML = `
        <div class="empty-reviews-state">
          <span class="empty-reviews-icon">📝</span>
          <p>Nessuna recensione ancora. Sii il primo a recensire!</p>
        </div>
      `;
      return;
    }

    const avgRating = (albumReviews.reduce((sum,r) => sum + r.rating, 0) / albumReviews.length).toFixed(1);
    const fullStars = Math.floor(avgRating);
    const starsHtml = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
    
    avgDiv.innerHTML = `
      <span class="rating-stars-display">${starsHtml}</span>
      <span class="rating-stats-text">${avgRating} / 5 (${albumReviews.length} ${albumReviews.length > 1 ? 'recensioni' : 'recensione'})</span>
    `;

    displayDiv.innerHTML = albumReviews.map((r, idx) => `
      <div class="review-display-card" style="animation-delay: ${idx * 0.1}s">
        <div class="review-card-header">
          <span class="review-card-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
          <span class="review-card-date">${r.date || 'Data sconosciuta'}</span>
        </div>
        ${r.text ? `<p class="review-card-text">${r.text}</p>` : '<p class="review-card-text no-comment">Nessun commento</p>'}
      </div>
    `).join("");
  }
}
