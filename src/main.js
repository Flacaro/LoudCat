// main.js
import MusicService from "./services/musicService.js";
import MusicView from "./view/musicView.js";
import MusicController from "./controller/musicController.js";
import { initFirebaseAuth } from "./controller/authController.js";
import { initProfileModal } from "./view/header.js";

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

});
