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

  // Listener pulsante "🏠 Home"
  document.getElementById("home-btn").addEventListener("click", async () => {
    await controller.loadHome();
  });
 
  initFirebaseAuth(controller); 

  initProfileModal();

  
});
