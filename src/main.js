// main.js
// Punto di ingresso dell'app LoudCat

import MusicModel from "./model/musicModel.js";
import MusicView from "./view/musicView.js";
import MusicController from "./controller/musicController.js";
import { initFirebaseAuth } from "./controller/authController.js";
import { initProfileModal } from "./view/header.js";


document.addEventListener("DOMContentLoaded", () => {
  // inizializza auth bindings (register/login/logout)
  initFirebaseAuth();
  // inizializza il modal del profilo (bottone in header)
  initProfileModal();

  const model = new MusicModel();
  const view = new MusicView();
  const controller = new MusicController(model, view);
  controller.init();
});
