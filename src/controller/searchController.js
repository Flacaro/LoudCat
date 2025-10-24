//searchController.js
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";

//controller che gestisce la ricerca musicale.
//si occupa di inviare le query al model, visualizzare i risultati 
//e aggiornare la UI in base allo stato dell’utente (login, preferiti, playlist)
export default class SearchController {
  constructor(model, view) {
    this.model = model;
    this.view = view; 
    this.lastResults = null;
  }

  //esegue la ricerca musicale e aggiorna la vista con i risultati e salva l’ultima ricerca su Firestore se l’utente è loggato
  async handleSearch(query) {
    try {
      //mostra lo stato di caricamento
      this.view.renderLoading();

      //esegue la ricerca tramite il model
      const results = await this.model.search(query);

      //memorizza gli ultimi risultati per riutilizzarli
      this.lastResults = results;

      //mostra i risultati nella UI, passando se l’utente è loggato o meno
      this.view.renderResults(results, this.controller?.isUserLoggedIn);

      //prova a fare lo scroll automatico ai risultati
      try {
        const rc = this.view.results;
        if (rc) rc.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
        console.warn('Impossibile scrollare ai risultati', e);
      }

      //se collegato al MusicController, sincronizza lo stato playlist dei brani
      if (this.controller?.playlistController) {
        const songs = Array.isArray(results.songs) ? results.songs : [];
        await this._markPlaylistState(songs);
      }

      //segna i brani già presenti tra i preferiti
      if (this.controller?.favoriteController) {
        const songs = Array.isArray(results.songs) ? results.songs : [];
        await this._markFavoriteState(songs);
      }

      //prepara un riferimento Firestore dove salvare l’ultima ricerca
      const ref = doc(db, "searches", "latest");

      //converte i risultati in oggetti semplici per compatibilità Firestore
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
            artistId: ar.artistId || (ar.name ? ar.name.toLowerCase().replace(/\s+/g, '-') : null),
            name: ar.name || null,
            canonicalName: ar.name || null,
            artwork: ar.artwork || null,
            genre: ar.genre || null
          }));
        }
      }

      //salva su Firestore solo se l’utente è autenticato
      if (this.controller?.isUserLoggedIn) {
        await setDoc(ref, { query, results: safeResults, updatedAt: new Date().toISOString() });
        console.log("Ricerca salvata su Firestore");
      }

      console.log("Ricerca completata con successo");

    } catch (err) {
      console.error("Errore durante la ricerca:", err);
      this.view.renderError();
    }
  }

  //carica e mostra l’ultima ricerca salvata su Firestore solo per utenti non loggati
  async loadLatestSearch() {
    //non mostrare nulla se l’utente è loggato
    if (this.controller?.isUserLoggedIn) return;

    const ref = doc(db, "searches", "latest");
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    if (!data?.results) return;

    //salva internamente i risultati caricati
    this.lastResults = data.results;

    //mostra i risultati caricati nella vista
    this.view.renderResults(data.results, this.controller?.isUserLoggedIn);

    //scroll automatico alla sezione dei risultati
    try {
      const rc = this.view.results;
      if (rc) rc.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      console.warn('Impossibile scrollare ai risultati caricati', e);
    }

    //aggiorna lo stato dei pulsanti (playlist e preferiti)
    if (this.controller?.playlistController) {
      const songs = Array.isArray(data.results.songs) ? data.results.songs : [];
      await this._markPlaylistState(songs);
    }
    if (this.controller?.favoriteController) {
      const songs = Array.isArray(data.results.songs) ? data.results.songs : [];
      await this._markFavoriteState(songs);
    }
  }

  //segna nella UI i brani che appartengono già ad almeno una playlist dell’utente
  async _markPlaylistState(songs) {
    if (!Array.isArray(songs) || songs.length === 0) return;

    try {
      const playlists = await this.controller.playlistController.getPlaylists();

      //crea una mappa canzone → id della prima playlist in cui si trova
      const map = new Map();
      for (const pl of playlists) {
        (pl.songs || []).forEach(s => {
          const sid = s.id || (s.title ? s.title.replace(/\s+/g, '-').toLowerCase() : null);
          if (sid && !map.has(sid)) map.set(sid, pl.id);
        });
      }

      //aggiorna lo stato dei pulsanti nella vista
      songs.forEach(s => {
        const sid = s.id || (s.title ? s.title.replace(/\s+/g, '-').toLowerCase() : null);
        const plId = sid ? map.get(sid) : null;
        const isAdded = !!plId;
        this.view.updatePlaylistButton(sid, plId || null, isAdded);
      });
    } catch (err) {
      console.error('Errore durante il controllo stato playlist:', err);
    }
  }

  //segna nella UI i brani che sono già nei preferiti dell’utente
  async _markFavoriteState(songs) {
    if (!Array.isArray(songs) || songs.length === 0) return;

    try {
      const favs = await this.controller.favoriteController.getFavorites();
      const favSet = new Set(favs.map(f => f.id));

      songs.forEach(s => {
        const sid = s.id || (s.title ? s.title.replace(/\s+/g, '-').toLowerCase() : null);
        const isFav = sid ? favSet.has(sid) : false;
        this.view.updateFavoriteState(sid, isFav);
      });
    } catch (err) {
      console.error('Errore durante il controllo stato preferiti:', err);
    }
  }
}
