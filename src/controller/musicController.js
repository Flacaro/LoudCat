// musicController.js
// Collega la View e il Model e salva/legge ricerche su Firestore

import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";

export default class MusicController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  init() {
    this.view.bindSearch(this.handleSearch.bind(this));
    // Carica l'ultimo risultato salvato in Firestore (se presente)
    this.loadLatestSearch();
  }

  async handleSearch(query, type = "artist") {
    try {
      this.view.renderLoading();
      const songs = await this.model.getSongs(query, type);
      this.view.renderResults(songs);

      // Salva l'ultima ricerca su Firestore
      try {
        const ref = doc(db, "searches", "latest");
        await setDoc(ref, { query, type, songs, updatedAt: new Date().toISOString() });
        console.log("Ricerca salvata su Firestore");
      } catch (saveErr) {
        console.warn("Impossibile salvare la ricerca su Firestore:", saveErr);
      }
    } catch (err) {
      console.error(err);
      this.view.renderError();
    }
  }

  async loadLatestSearch() {
    try {
      const ref = doc(db, "searches", "latest");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.songs) {
          this.view.renderResults(data.songs);
        }
      }
    } catch (err) {
      console.warn("Errore nel leggere l'ultima ricerca da Firestore:", err);
    }
  }
}
