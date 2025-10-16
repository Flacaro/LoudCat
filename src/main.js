// main.js
// Punto di ingresso dell'app LoudCat

import MusicService from "./services/musicService.js";
import MusicView from "./view/musicView.js";
import MusicController from "./controller/musicController.js";
import { initFirebaseAuth } from "./controller/authController.js";


document.addEventListener("DOMContentLoaded", () => {
  // inizializza auth bindings (register/login/logout)
  initFirebaseAuth();

  const service = new MusicService();
  const view = new MusicView();
  const controller = new MusicController(service, view);
  controller.init();
});
