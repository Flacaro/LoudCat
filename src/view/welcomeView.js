export default class WelcomeView {
  constructor() {
    this.container = document.getElementById("home-container");
  }

  render() {
    if (!this.container) return;

    const html = `
      <div class="welcome-container">
        <div class="welcome-hero">
          <div class="hero-content">
            <div class="loading-logo">
              <img src="assets/logo/LoudCatLogo.PNG" alt="LoudCat" class="logo-spin" />
            </div>
            <h1 class="hero-title">Benvenuto su LoudCat</h1>
            <p class="hero-subtitle">Esplora milioni di brani, crea playlist e condividi la tua musica preferita</p>
            <div class="hero-cta">
              <button id="welcome-register-btn" class="btn btn-primary btn-lg me-2">
                Registrati
              </button>
              <button id="welcome-login-btn" class="btn btn-outline-light btn-lg">
                Accedi
              </button>
            </div>
          </div>
        </div>

        <div class="features-section">
          <h2 class="features-title">Cosa puoi fare con LoudCat</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🔍</div>
              <h3>Cerca musica</h3>
              <p>Trova brani, album e artisti da tutto il mondo grazie all'integrazione con iTunes</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">⭐</div>
              <h3>Salva i preferiti</h3>
              <p>Crea la tua collezione personale salvando i brani che ami di più</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">📀</div>
              <h3>Crea playlist</h3>
              <p>Organizza la tua musica in playlist personalizzate per ogni occasione</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🎵</div>
              <h3>Ascolta anteprime</h3>
              <p>Ascolta snippet di 30 secondi direttamente nel browser</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">👥</div>
              <h3>Condividi</h3>
              <p>Condividi i tuoi brani preferiti con amici e scopri cosa ascoltano loro</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🎤</div>
              <h3>Esplora artisti</h3>
              <p>Scopri informazioni dettagliate su artisti e le loro discografie</p>
            </div>
          </div>
        </div>

        <div class="demo-section">
          <h2 class="demo-title">Prova subito la ricerca</h2>
          <p class="demo-subtitle">Cerca un artista, un brano o un album per iniziare</p>
          <div class="demo-search">
            <input 
              id="demo-search-input" 
              type="text" 
              class="form-control form-control-lg" 
              placeholder="Es: The Beatles, Bohemian Rhapsody..."
            />
            <button id="demo-search-btn" class="btn btn-primary btn-lg">
              Cerca
            </button>
          </div>
          <div class="demo-note">
            <small class="text-muted">
              💡 Accedi o registrati per salvare i risultati e creare playlist
            </small>
          </div>
        </div>

        <div class="cta-section">
          <h2>Pronto per iniziare?</h2>
          <p>Unisciti a LoudCat e scopri la tua prossima canzone preferita</p>
          <button id="cta-register-btn" class="btn btn-primary btn-lg">
            Registrati ora
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this._attachEventListeners();
  }

  _attachEventListeners() {
    // Register buttons
    const welcomeRegBtn = document.getElementById("welcome-register-btn");
    const ctaRegBtn = document.getElementById("cta-register-btn");
    
    [welcomeRegBtn, ctaRegBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener("click", () => {
          const registerBtn = document.getElementById("registerBtn");
          if (registerBtn) registerBtn.click();
        });
      }
    });

    // Login button
    const welcomeLoginBtn = document.getElementById("welcome-login-btn");
    if (welcomeLoginBtn) {
      welcomeLoginBtn.addEventListener("click", () => {
        const loginBtn = document.getElementById("loginBtn");
        if (loginBtn) loginBtn.click();
      });
    }

    // Demo search
    const demoInput = document.getElementById("demo-search-input");
    const demoBtn = document.getElementById("demo-search-btn");
    
    if (demoInput && demoBtn) {
      const triggerSearch = () => {
        const query = demoInput.value.trim();
        if (query) {
          const searchInput = document.getElementById("search-input");
          const searchBtn = document.getElementById("search-btn");
          
          if (searchInput && searchBtn) {
            searchInput.value = query;
            searchBtn.click();
          }
        }
      };

      demoBtn.addEventListener("click", triggerSearch);
      demoInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") triggerSearch();
      });
    }
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}