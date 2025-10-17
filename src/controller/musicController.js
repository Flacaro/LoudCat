// musicController.js
// Collega la View e il Model e salva/legge ricerche su Firestore

import { doc, setDoc, getDoc, deleteDoc, updateDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {arrayUnion, arrayRemove} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
export default class MusicController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  init() {
    this.view.bindSearch(this.handleSearch.bind(this));
    this.view.bindAlbumClick(this.handleAlbumClick.bind(this)); // ADD THIS
    this.view.bindFavoriteToggle(this.handleFavoriteToggle.bind(this));
    this.view.bindAddToPlaylist(this.handlePlaylist.bind(this));
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

  async handleFavoriteToggle(song) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      this.view.showToast("Devi effettuare il login per gestire i preferiti.");
      return;
    }

    const favRef = doc(db, "users", user.uid, "favorites", song.id);

    try {
      const snap = await getDoc(favRef);
      if (snap.exists()) {
        // Se esiste già, lo rimuoviamo
        await deleteDoc(favRef);
        this.view.updateFavoriteState(song.id, false);
      } else {
        // Altrimenti lo salviamo
        await setDoc(favRef, {
          title: song.title,
          artist: song.artist,
          album: song.album,
          artwork: song.artwork,
          preview: song.preview,
          addedAt: new Date().toISOString(),
        });
        this.view.updateFavoriteState(song.id, true);
      }
    } catch (err) {
      console.error("Errore nella gestione dei preferiti:", err);
      this.view.showToast("Errore nella gestione dei preferiti.");
    }
  }

async handlePlaylist(song) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    this.view.showToast("Devi effettuare il login per gestire la playlist.");
    return;
  }

  const playlistId = song.id || song.title.replace(/\s+/g,'-').toLowerCase();
  const plRef = doc(db, "users", user.uid, "playlists", playlistId);

  try {
    const snap = await getDoc(plRef);
    if (snap.exists()) {
      const data = snap.data();
      const songExists = data.songs?.some(s => s.id === song.id);

      if (songExists) {
        // Rimuovi la canzone
        await updateDoc(plRef, {
          songs: arrayRemove(song.id)
        });
        this.view.showToast("Canzone rimossa dalla playlist!");
      } else {
        // Aggiungi la canzone
        await updateDoc(plRef, {
          songs: arrayUnion(song.id)
        });
        this.view.showToast("Canzone aggiunta alla playlist!");
      }
    } else {
      // crea la playlist se non esiste
      await setDoc(plRef, {
        name: "My Playlist",
        songs: [{
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          artwork: song.artwork,
          preview: song.preview,
          addedAt: new Date().toISOString()
        }]
      });
      this.view.showToast("Playlist creata e canzone aggiunta!");
    }
  } catch (err) {
    console.error("Errore nella gestione della playlist:", err);
  }
}


  showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}


  async handleAlbumClick(albumId) {
  const tracks = await this.model.getAlbumTracks(albumId);
  this.view.renderTracks(tracks, albumId); // render in the same page, below the album card
}

}
