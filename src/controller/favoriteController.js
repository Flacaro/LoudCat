//favoriteController.js

import { doc, setDoc, collection, getDocs, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db } from "../firebase.js";

//controller responsabile della gestione dei brani preferiti (“favorites”)
export default class FavoriteController {
  constructor(view) {
    this.view = view;
  }

  //recupera tutti i brani preferiti dell’utente loggato da Firestore
  //Promise<Array> - array di oggetti rappresentanti i brani salvati nei preferiti
  async getFavorites() {
    const auth = getAuth();
    const user = auth.currentUser;
    //se non c’è un utente loggato, restituisce una lista vuota
    if (!user) return []; 

    try {
      //recupera la collezione "favorites" per l’utente attuale
      const favsSnap = await getDocs(collection(db, "users", user.uid, "favorites"));

      //trasforma i documenti Firestore in oggetti JS con id e dati
      return favsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Errore nel recupero dei preferiti:", err);
      //in caso di errore, restituisce un array vuoto
      return []; 
    }
  }

  //aggiunge o rimuove un brano dai preferiti.
  //Object|string|HTMLElement song - brano da aggiungere/rimuovere.
  async handleFavoriteToggle(song) {

    const auth = getAuth();
    const user = auth.currentUser;

    //se l’utente non è loggato, mostra un messaggio e interrompe l’operazione
    if (!user) {
      this.view.showToast("Devi effettuare il login per gestire i preferiti.");
      return;
    }

    //normalizzazione del parametro “song” perchè può arrivare in diversi formati
    let songObj = null;

    try {
      if (song instanceof HTMLElement) {
        //se viene passato un elemento HTML, prova a leggere i dati dal dataset
        const raw = song.dataset.song;
        try {
          //prova a decodificare l’intero oggetto JSON da data-song
          songObj = raw ? JSON.parse(decodeURIComponent(raw)) : null;
        } catch (e) {
          //se non riesce, ricostruisce manualmente l’oggetto dai singoli campi
          songObj = {
            id: song.dataset.songId,
            title: decodeURIComponent(song.dataset.songTitle || "") || undefined,
            artist: decodeURIComponent(song.dataset.songArtist || "") || undefined,
            album: decodeURIComponent(song.dataset.songAlbum || "") || undefined,
            artwork: decodeURIComponent(song.dataset.songArtwork || "") || undefined,
            preview: decodeURIComponent(song.dataset.songPreview || "") || undefined,
          };
        }
      } else if (typeof song === 'string') {
        //se è una stringa, prova a decodificarla e fare il parse JSON
        try {
          songObj = JSON.parse(decodeURIComponent(song));
        } catch (e) {
          songObj = null;
        }
      } else if (song && typeof song === 'object') {
        //se è già un oggetto, lo usa direttamente
        songObj = song;
      }
    } catch (err) {
      console.warn('handleFavoriteToggle: errore nel normalizzare il brano', err, song);
    }

    //genera un ID per salvare il brano su Firestore
    const safeId = songObj && songObj.id
      ? songObj.id
      : (songObj && songObj.title ? String(songObj.title).replace(/\s+/g, '-').toLowerCase() : null);

    //recupera il titolo
    const title = songObj && songObj.title
      ? songObj.title
      : (song && song.dataset ? decodeURIComponent(song.dataset.songTitle || '') : undefined);

    //se non è possibile determinare un ID, mostra un messaggio di errore
    if (!safeId) {
      console.warn('handleFavoriteToggle: impossibile determinare ID del brano', songObj || song);
      this.view.showToast("Impossibile determinare l'ID del brano.");
      return;
    }

    //riferimento al documento Firestore del brano preferito
    const favRef = doc(db, "users", user.uid, "favorites", safeId);

    try {
      //controlla se il brano è già nei preferiti
      const snap = await getDoc(favRef);

      if (snap.exists()) {
        //se esiste → lo rimuove
        await deleteDoc(favRef);
        this.view.updateFavoriteState(safeId, false); 
      } else {
        //se non esiste → lo aggiunge ai preferiti
        await setDoc(favRef, {
          title: title || (songObj && songObj.title) || null,
          artist: (songObj && songObj.artist) || null,
          album: (songObj && songObj.album) || null,
          artwork: (songObj && songObj.artwork) || null,
          preview: (songObj && songObj.preview) || null,
          addedAt: new Date().toISOString(),
        });
        this.view.updateFavoriteState(safeId, true); 
      }
    } catch (err) {
      console.error("Errore nella gestione dei preferiti:", err);
      this.view.showToast("Errore nella gestione dei preferiti.");
    }
  }
}
