import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";

export default class SearchController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  async handleSearch(query) {
    try {
      this.view.renderLoading();
      const results = await this.model.search(query);
      this.view.renderResults(results);

      const ref = doc(db, "searches", "latest");
      // Serialize results to plain objects because Firestore rejects custom class instances
      const safeResults = {};
      if (results) {
        if (Array.isArray(results.songs)) {
          safeResults.songs = results.songs.map(s => ({
            id: s.id || null,
            title: s.title || null,
            artist: s.artist || null,
            album: s.album || null,
            artwork: s.artwork || null,
            preview: s.preview || null
          }));
        }
        if (Array.isArray(results.albums)) {
          safeResults.albums = results.albums.map(a => ({
            collectionId: a.collectionId || null,
            title: a.title || null,
            artist: a.artist || null,
            artwork: a.artwork || null,
            trackCount: a.trackCount || null,
            releaseDate: a.releaseDate || null
          }));
        }
        if (Array.isArray(results.artists)) {
          safeResults.artists = results.artists.map(ar => ({
            name: ar.name || null,
            artwork: ar.artwork || null,
            genre: ar.genre || null
          }));
        }
      }
      await setDoc(ref, { query, results: safeResults, updatedAt: new Date().toISOString() });
      console.log("Ricerca salvata su Firestore");
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
    } catch (err) {
      console.warn("Errore nel leggere l'ultima ricerca da Firestore:", err);
    }
  }
}
