// main.js
// Punto di ingresso dell'app LoudCat

import MusicModel from "./model/musicModel.js";
import MusicView from "./view/musicView.js";
import MusicController from "./controller/musicController.js";
import fireBase from "./firebase.js"

initFirebaseAuth();

document.addEventListener("DOMContentLoaded", () => {
  const model = new MusicModel();
  const view = new MusicView();
  const controller = new MusicController(model, view);
  controller.init();
});
