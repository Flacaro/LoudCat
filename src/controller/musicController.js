// musicController.js
// Collega la View e il Model e salva/legge ricerche su Firestore

import { doc, setDoc, getDoc, deleteDoc, getDocs, updateDoc, collection} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {arrayUnion, arrayRemove} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import AlbumViewController from "./albumController.js";




export default class MusicController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.albumController = new AlbumViewController();
  }

  init() {
    this.view.bindSearch(this.handleSearch.bind(this));
    this.view.bindAlbumClick(this.handleAlbumClick.bind(this)); // ADD THIS
    this.view.bindFavoriteToggle(this.handleFavoriteToggle.bind(this));
    this.view.bindAddToPlaylist(this.handlePlaylist.bind(this));
    this.view.bindShare(this.handleShare.bind(this));
    this.view.bindCreatePlaylist(this.createPlaylist.bind(this));
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
 async createPlaylist(playlistName) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      this.view.showToast("Devi effettuare il login per creare una playlist.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const data = snap.exists() ? snap.data() : {};

      const playlists = data.playlists || [];

      if (playlists.some(pl => pl.name === playlistName)) {
        this.view.showToast("Esiste già una playlist con questo nome!");
        return;
      }

      playlists.push({ name: playlistName, songs: [] });

      await setDoc(userRef, { playlists }, { merge: true });

      this.view.showToast(`Playlist "${playlistName}" creata con successo!`);
    } catch (err) {
      console.error("Errore nella creazione della playlist:", err);
      this.view.showToast("Errore durante la creazione della playlist.");
    }
  }



  showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

  async handleShare(song) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) { alert('Devi effettuare il login per condividere una canzone.'); return; }

    const recipientEmail = prompt('Inserisci l\'email del destinatario con cui condividere:');
    if (!recipientEmail) return;
    const emailTrim = recipientEmail.trim().toLowerCase();
    // basic email validation
    if (!/\S+@\S+\.\S+/.test(emailTrim)) { alert('Email non valida.'); return; }

    try {
      // Save share entry in a top-level collection
      const shareRef = doc(db, 'shares', `${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
      await setDoc(shareRef, {
        fromUid: user.uid,
        fromEmail: user.email,
        toEmail: emailTrim,
        song,
        createdAt: new Date().toISOString()
      });

      // If recipient exists as a user document, add a reference in their subcollection
      // Try to find recipient by scanning users collection for matching email (not ideal at scale)
      // For demo purposes we'll do a simple approach
      const usersRef = doc(db, 'users', emailTrim.replace(/[^a-zA-Z0-9]/g, '_'));
      // NOTE: this assumes you store user docs keyed by a normalized email — adjust if you store by uid
      const userSnap = await getDoc(usersRef);
      if (userSnap.exists()) {
        // save under users/{recipient}/shared
        const recipientSharedRef = doc(db, 'users', usersRef.id, 'shared', `${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
        await setDoc(recipientSharedRef, { from: user.email, song, createdAt: new Date().toISOString() });
      }

      alert('Canzone condivisa con ' + emailTrim + '!');
    } catch (err) {
      console.error('Errore durante la condivisione:', err);
      alert('Errore durante la condivisione.');
    }
  }
  async handleAlbumClick(albumId) {
  const tracks = await this.model.getAlbumTracks(albumId);
  this.view.renderTracks(tracks, albumId); // render in the same page, below the album card
}

async loadUserCollections(userId) {
  if (!userId) return { favorites: [], playlists: [] };

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return { favorites: [], playlists: [] };

  // Carica playlists
  const data = userSnap.data();
  const playlists = data.playlists || [];

  // Carica favorites dalla sottocollezione
  const favCol = collection(db, "users", userId, "favorites");
  const favSnap = await getDocs(favCol);
  const favorites = favSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return { favorites, playlists };
}

renderUserCollections({ favorites, playlists }) {
  const container = document.getElementById("results-container");
  container.innerHTML = ""; // pulisci prima di renderizzare

  // Render Favorites
  if(favorites.length) {
    const favHtml = favorites.map(song => `
      <div class="card song-card hover-card">
        <img src="${song.artwork || './assets/default-artwork.png'}" alt="${song.title}" />
        <h4>${song.title}</h4>
        <p>${song.artist}</p>
      </div>
    `).join("");
    container.insertAdjacentHTML("beforeend", `<h3>I tuoi preferiti</h3>${favHtml}`);
  } else {
    container.insertAdjacentHTML("beforeend", "<h3>I tuoi preferiti</h3><p>Nessun preferito</p>");
  }

  // Render Playlists
  if(playlists.length) {
    const plHtml = playlists.map(pl => `
      <div class="card playlist-card hover-card">
        <h4>${pl.name}</h4>
        <p>${pl.songs.length} brani</p>
      </div>
    `).join("");
    container.insertAdjacentHTML("beforeend", `<h3>Le tue playlist</h3>${plHtml}`);
  } else {
    container.insertAdjacentHTML("beforeend", "<h3>Le tue playlist</h3><p>Nessuna playlist creata</p>");
  }
}



handleAlbumClick(albumId) {
  const backHandler = () => this.view.renderResults(this.model.lastResults); 
  this.albumController.showAlbum(albumId, backHandler);
}
}
