// main.js
// Punto di ingresso dell'app LoudCat

import MusicModel from "./model/musicModel.js";
import MusicView from "./view/musicView.js";
import MusicController from "./controller/musicController.js";
import { initFirebaseAuth } from "./controller/authController.js";


document.addEventListener("DOMContentLoaded", () => {
  // inizializza auth bindings (register/login/logout)
  initFirebaseAuth();

  const model = new MusicModel();
  const view = new MusicView();
  const controller = new MusicController(model, view);
  controller.init();
});
