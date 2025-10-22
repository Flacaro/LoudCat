export default class AlbumView {
  constructor(containerId = "results-container") {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`#${containerId} not found`);
  }

  renderLoading() {
    this.container.innerHTML = `<p>⏳ Caricamento album...</p>`;
  }

  renderAlbum(album) {
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

        <hr />

        <div class="album-review">
          <h3>Valuta questo album ⭐</h3>
          <p id="average-rating">⭐ 0 (nessuna recensione)</p>
          <div class="star-rating">
            ${[1,2,3,4,5].map(n => `<span class="star" data-value="${n}">☆</span>`).join("")}
          </div>
          <textarea id="review-text" placeholder="Scrivi una recensione (opzionale)"></textarea>
          <button id="submit-review">Invia recensione</button>
          <div id="user-review-list"></div>
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

  // Load previous review for this user if exists
  const reviews = JSON.parse(localStorage.getItem("albumReviews") || "[]");
  const lastUserReview = reviews.filter(r => r.albumId === albumId && r.user === "Utente").pop();
  if (lastUserReview) selectedRating = lastUserReview.rating;

  const updateStars = (value) => {
    stars.forEach(s => s.textContent = s.dataset.value <= value ? "★" : "☆");
  };

  // Initialize stars with previous rating
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

      const review = { albumId, rating, text, user: "Utente" };
      const reviews = JSON.parse(localStorage.getItem("albumReviews") || "[]");
      reviews.push(review);
      localStorage.setItem("albumReviews", JSON.stringify(reviews));

      textArea.value = "";
      stars.forEach(s => s.textContent = "☆");

      // Reload all reviews dynamically
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
      avgDiv.textContent = "⭐ 0 (nessuna recensione)";
      displayDiv.innerHTML = "";
      return;
    }

    // Compute average rating
    const avgRating = (albumReviews.reduce((sum,r) => sum + r.rating, 0) / albumReviews.length).toFixed(1);
    avgDiv.textContent = `⭐ ${avgRating} (${albumReviews.length} recension${albumReviews.length > 1 ? "i" : "e"})`;

    // List all reviews
    displayDiv.innerHTML = albumReviews.map(r => 
      `<p>⭐ ${r.rating} ${r.text ? `: ${r.text}` : ""}</p>`).join("<hr>");
  }
}
