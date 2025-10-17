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
      await setDoc(ref, { query, results, updatedAt: new Date().toISOString() });
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
