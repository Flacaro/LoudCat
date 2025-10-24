// main.js
import MusicService from "./services/musicService.js";
import MusicView from "./view/musicView.js";
import MusicController from "./controller/musicController.js";
import { initFirebaseAuth } from "./controller/authController.js";
import { initProfileModal } from "./view/header.js";
import { playCustomAudio } from "./utils/audioEffects.js";

document.addEventListener("DOMContentLoaded", () => {
  const service = new MusicService();
  const view = new MusicView();
  const controller = new MusicController(service, view);
  controller.init();

  // helper sicuri per i binding (controllano che l'elemento esista)
  const q = id => document.getElementById(id);
  const on = (id, evt, handler) => {
    const el = q(id);
    if (!el) {
      console.warn(`Elemento con id="${id}" non trovato in DOM — binding ${evt} saltato.`);
      return;
    }
    el.addEventListener(evt, handler);
  };

  // Listener pulsante "🏠 Home" (uso del helper)
  on("homeBtn", "click", async () => {
    // Riproduci effetto sonoro
    playCustomAudio();
    
    await controller.loadHome();

    try {
      const user = controller.userController?.getCurrentUser?.();
      if (user && typeof controller.homeView?.showWelcomeMessage === "function") {
        controller.homeView.showWelcomeMessage(user);
      }
    } catch (e) {
      console.warn("Impossibile ripristinare il messaggio di benvenuto:", e);
    }
  });

  on("sidebar-playlist-btn", "click", async () => {
    const playlists = await controller.playlistController.getPlaylists() || [];
    const homeContainer = document.getElementById("home-container");
    const resultsSection = document.getElementById("results-section");
    if (homeContainer) homeContainer.style.display = "block";
    if (resultsSection) resultsSection.style.display = "none";
    controller.homeView.renderOnlySection("playlists", playlists);
  });

  on("sidebar-favorites-btn", "click", async () => {
    const favorites = await controller.favoriteController.getFavorites() || [];
    const homeContainer = document.getElementById("home-container");
    const resultsSection = document.getElementById("results-section");
    if (homeContainer) homeContainer.style.display = "block";
    if (resultsSection) resultsSection.style.display = "none";

    controller.homeView.renderOnlySection("favorites", favorites);
  });


  initFirebaseAuth(controller);

  initProfileModal();

  const mobileBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("d-none");
  });

  // Mostra welcome view al caricamento iniziale se l'utente non è autenticato
  // Usa un piccolo delay per permettere a Firebase Auth di inizializzarsi
  setTimeout(async () => {
    try {
      const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      const auth = getAuth();
      
      if (!auth.currentUser && controller.welcomeView) {
        const homeContainer = document.getElementById("home-container");
        if (homeContainer) homeContainer.style.display = "block";
        controller.welcomeView.render();
      }
    } catch (err) {
      console.warn("Impossibile verificare lo stato di autenticazione iniziale:", err);
    }
  }, 500);

});
