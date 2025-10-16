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
    this.view.bindAlbumClick(this.handleAlbumClick.bind(this)); // ADD THIS
    this.loadLatestSearch();
  }



  async handleSearch(query) {
    try {
      this.view.renderLoading();
      const results = await this.model.search(query);

      this.view.renderResults(results);

      // Salva l'ultima ricerca su Firestore
      try {
        const ref = doc(db, "searches", "latest");
        await setDoc(ref, { query, results, updatedAt: new Date().toISOString() });
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
      if (!snap.exists()) return;
      const data = snap.data();
      if (!data || !data.results) return;
      this.view.renderResults(data.results);
      console.log("Ultima ricerca caricata da Firestore");
    }
    catch (err) {
      console.warn("Errore nel leggere l'ultima ricerca da Firestore:", err);
    }
  }

  async handleAlbumClick(albumId) {
  const tracks = await this.model.getAlbumTracks(albumId);
  this.view.renderTracks(tracks, albumId); // render in the same page, below the album card
}

}
