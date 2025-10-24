//musicController.js
import SearchController from "./searchController.js";
import FavoriteController from "./favoriteController.js";
import PlaylistController from "./playlistController.js";
import ShareController from "./shareController.js";
import AlbumController from "./albumController.js";
import ArtistProfileController from "./artistProfileController.js";
import UserController from "./userController.js";
import HomeView from "../view/homeView.js";
import WelcomeView from "../view/welcomeView.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";
import { hideProfileModal } from "../view/header.js";

//controller principale dell’applicazione
export default class MusicController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.homeView = new HomeView();
    this.welcomeView = new WelcomeView();

    this.isHomeLoaded = false;
    this.isUserLoggedIn = false;

    this.userController = new UserController();
    this.searchController = new SearchController(model, view);
    this.searchController.controller = this;

    this.favoriteController = new FavoriteController(view);
    this.playlistController = new PlaylistController(view);
    this.shareController = new ShareController(view);
    this.albumController = new AlbumController(view, model);
    this.artistProfileController = new ArtistProfileController();

    //riferimenti per le sottoscrizioni in tempo reale
    this._unsubFav = null;
    this._unsubPlaylists = null;
  }

    //imposta i listener di autenticazione
    //collega i vari eventi della view (ricerca, click, preferiti, ecc.)
  async init() {
    const auth = getAuth();
    const resultsSection = document.getElementById("results-section");
    const homeContainer = document.getElementById("home-container");

    //monitoraggio dello stato autenticazione Firebase
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        //utente loggato → carica dati personalizzati
        this.isUserLoggedIn = true;
        await this.loadUserCollections();
        //ascolta modifiche in tempo reale
        this._subscribeRealtime(user.uid); 
      } else {
        //nessun utente → reset interfaccia e listener
        this.isUserLoggedIn = false;
        this.homeView.clearWelcomeMessage();
        this._unsubscribeRealtime();
      }
    });

    //Collega gli eventi della View ai rispettivi controller
    //click su album → mostra dettagli
    this.view.bindAlbumClick(albumId => {
      const prevResults = this.searchController?.lastResults || this.view.getRenderedResults() || null;
      this.albumController.handleAlbumClick(albumId, prevResults, this.isUserLoggedIn);
    });

    //toggle preferiti (aggiungi/rimuovi)
    this.view.bindFavoriteToggle(song => this.favoriteController.handleFavoriteToggle(song));

    //aggiungi a playlist
    this.view.bindAddToPlaylist(song => this.playlistController.handlePlaylist(song));

    //condivisione
    this.view.bindShare(song => this.shareController.handleShare(song));

    //creazione nuova playlist
    this.view.bindCreatePlaylist(name => this.playlistController.createPlaylist(name));

    //click su artista → mostra profilo artista
    this.view.bindArtistClick(({ artistId, artistName }) => {
      const prev = this.searchController?.lastResults || this.view.getRenderedResults() || null;

      //gestione del pulsante "indietro"
      const backHandler = () => {
        if (prev) {
          this.view.renderResults(prev, this.isUserLoggedIn);
        } else {
          this.view.renderResults({ songs: [], albums: [], artists: [] }, this.isUserLoggedIn);
        }
      };

      this.artistProfileController.showArtistProfile(backHandler, artistName);
    });

    //ricerca musicale
    this.view.bindSearch(query => {
      homeContainer.style.display = "none";
      resultsSection.style.display = "block";
      this.searchController.handleSearch(query);
    });

    //se c’è una ricerca recente, la ricarica
    const latest = this.model.getLastSearch?.();
    if (latest) {
      this.searchController.loadLatestSearch();
    }
  }

  //carica collezioni utente (preferiti e playlist) e le mostra nella home in stile Spotify
  async loadUserCollections() {
    const favorites = await this.favoriteController.getFavorites();
    const playlists = await this.playlistController.getPlaylists();
    this.homeView.renderSpotifyHome(favorites, playlists);
  }

  //Sottoscrizione in tempo reale alle modifiche di Firestore
   //ogni volta che cambia un preferito o una playlist, la home e i pulsanti vengono aggiornati automaticamente
  _subscribeRealtime(uid) {
    try {
      //disiscrive eventuali listener esistenti
      this._unsubscribeRealtime();

      const favCol = collection(db, 'users', uid, 'favorites');
      const playCol = collection(db, 'users', uid, 'playlists');

      //listener per i preferiti
      this._unsubFav = onSnapshot(favCol, async () => {
        await this.loadUserCollections();
        try { await this._syncResultButtonStates(); } catch (e) { console.warn('Errore sync fav button states', e); }
      });

      //listener per le playlist
      this._unsubPlaylists = onSnapshot(playCol, async () => {
        await this.loadUserCollections();
        try { await this._syncResultButtonStates(); } catch (e) { console.warn('Errore sync playlist button states', e); }
      });
    } catch (err) {
      console.error('Errore sottoscrizione realtime:', err);
    }
  }

  //sincronizza lo stato dei pulsanti nella view (cuore, playlist, ecc.) in base ai dati attuali su Firestore
  async _syncResultButtonStates() {
    try {
      const favorites = await this.favoriteController.getFavorites();
      const playlists = await this.playlistController.getPlaylists();
      const rendered = this.view.getRenderedResults() || {};
      const songs = rendered.songs || [];

      songs.forEach(s => {
        const id = s.id || (s.title ? String(s.title).replace(/\s+/g, '-').toLowerCase() : null);
        if (!id) return;

        const isFav = favorites.some(f => f.id === id);
        const isInPlaylist = playlists.some(pl => (pl.songs || []).some(t => t.id === id));

        this.view.updateFavoriteState(id, isFav);
        this.view.updatePlaylistButton(id, null, isInPlaylist);
      });
    } catch (err) {
      console.warn('Errore durante la sincronizzazione degli stati dei pulsanti:', err);
    }
  }

  //disiscrive i listener in tempo reale da Firestore, al logout
  _unsubscribeRealtime() {
    try {
      if (typeof this._unsubFav === 'function') this._unsubFav();
      if (typeof this._unsubPlaylists === 'function') this._unsubPlaylists();
    } catch (err) {
      console.warn('Errore durante unsubscribe realtime:', err);
    }
    this._unsubFav = null;
    this._unsubPlaylists = null;

    //nasconde il profilo utente se aperto
    try { hideProfileModal(); } catch (e) { /* ignora */ }
  }

  //Carica la Home page personalizzata
  //mostra preferiti, playlist e canzoni consigliate
  async loadHome() {
    const auth = getAuth();
    const user = auth.currentUser;

    const resultsSection = document.getElementById("results-section");
    const homeContainer = document.getElementById("home-container");
    const resultsContainers = document.querySelectorAll('#results-container');

    //mostra la home, nasconde la sezione risultati
    if (homeContainer) homeContainer.style.display = 'block';
    if (resultsSection) resultsSection.style.display = 'none';

    try { hideProfileModal(); } catch (e) { console.log("errore hideProfileModal"); }

    //pulisce eventuali vecchi risultati
    resultsContainers.forEach(c => { if (c) c.innerHTML = ''; });

    console.log("=== LOAD HOME START ===");

    let favorites = [];
    let playlists = [];
    let recommended = [];

    if (user) {
      //se loggato → mostra messaggio di benvenuto
      this.welcomeView.clear();
      this.homeView.showWelcomeMessage(user.displayName || 'Utente');

      //carica preferiti e playlist in parallelo
      [favorites, playlists] = await Promise.all([
        this.favoriteController.getFavorites(),
        this.playlistController.getPlaylists()
      ]);

      //mostra canzoni consigliate: ultime cercate o casuali
      if (this.searchController.lastResults?.songs?.length > 0) {
        recommended = this.searchController.lastResults.songs.slice(0, 10);
      } else {
        recommended = await this.getRandomSongs(10);
      }

    } else {
      //utente non loggato → mostra schermata di benvenuto
      this.welcomeView.render();
      console.log("=== LOAD HOME END (guest) ===");
      return;
    }

    //normalizza i dati consigliati per evitare errori
    recommended = recommended.map(s => ({
      id: s.id || null,
      title: s.title || "Titolo sconosciuto",
      artist: s.artist || "Artista sconosciuto",
      artwork: s.artwork || "assets/img/avatar-placeholder.svg"
    }));

    console.log("🎵 Recommended:", recommended);
    console.log("❤️ Favorites:", favorites);
    console.log("📀 Playlists:", playlists);

    //mostra la home in stile Spotify
    this.homeView.renderSpotifyHome(favorites, playlists, recommended);

    //aggiorna layout e posizione scroll
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }

    console.log("=== LOAD HOME END ===");
  }
  
  //Restituisce le canzoni raccomandate (in base ai risultati recenti)
  async getRecommendedSongs() {
    const lastResults = this.searchController?.lastResults;
    if (!lastResults?.songs?.length) return [];
    return lastResults.songs.slice(0, 10);
  }

  //recupera casualmente un certo numero di canzoni da Firestore
  //limit - Numero massimo di canzoni da restituire
  async getRandomSongs(limit = 10) {
    try {
      const allSongsSnap = await getDocs(collection(db, "songs"));
      const allSongs = allSongsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (allSongs.length === 0) {
        console.warn("⚠️ Nessuna canzone trovata in Firestore");
        return [];
      }

      //mischia casualmente le canzoni e restituisce solo le prime `limit`
      const shuffled = allSongs.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, limit);
    } catch (err) {
      console.error("Errore nel caricamento delle canzoni casuali:", err);
      return [];
    }
  }
}
