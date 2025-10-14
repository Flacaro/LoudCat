// musicView.js
// Gestisce la parte visiva e l'interazione utente

export default class MusicView {
  constructor() {
    this.input = document.getElementById("search-input");
    this.button = document.getElementById("search-btn");
    this.results = document.getElementById("results-container");
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

  renderResults(songs) {
    if (!songs.length) {
      this.results.innerHTML = "<p>Nessun risultato trovato 😢</p>";
      return;
    }

    this.results.innerHTML = songs
      .map(
        (s) => `
        <div class="card">
          <img src="${s.artwork}" alt="${s.title}" />
          <h4>${s.title}</h4>
          <p>${s.artist}</p>
          ${
            s.preview
              ? `<audio controls src="${s.preview}"></audio>`
              : "<p>Preview non disponibile</p>"
          }
        </div>`
      )
      .join("");
  }

  renderError() {
    this.results.innerHTML = "<p>❌ Errore durante la ricerca.</p>";
  }
}
