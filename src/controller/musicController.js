import SearchController from "./searchController.js";
import FavoriteController from "./favoriteController.js";
import PlaylistController from "./playlistController.js";
import ShareController from "./shareController.js";
import AlbumController from "./albumController.js";
import UserController from "./userController.js";
import ArtistProfileController from "./artistProfileController.js";
import HomeView from "../view/homeView.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";

export default class MusicController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.homeView = new HomeView();
     this.isHomeLoaded = false;
    this.isUserLoggedIn = false;

    this.userController = new UserController();
    this.searchController = new SearchController(model, view);
    this.searchController.controller = this;
    this.favoriteController = new FavoriteController(view);
    this.playlistController = new PlaylistController(view);
    this.shareController = new ShareController(view);
  // Provide the shared view and model so AlbumController can restore results
  this.albumController = new AlbumController(view, model);
    this.artistProfileController = new ArtistProfileController();
    this._unsubFav = null;
    this._unsubPlaylists = null;
  }


  async init() {

    const auth = getAuth();
    const resultsSection = document.getElementById("results-section");
    const homeContainer = document.getElementById("home-container");
    
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.isUserLoggedIn = true;
        this.view.showToast(`Benvenuto, ${user.displayName || "Utente"}!`);
        await this.loadUserCollections();
        // subscribe to realtime updates for favorites and playlists
        this._subscribeRealtime(user.uid);
      } else {
        this.isUserLoggedIn = false;
        this.homeView.clearWelcomeMessage();
        this._unsubscribeRealtime();
      }
    });

  this.view.bindAlbumClick(albumId => {
    // prefer controller-held lastResults (full results object); fall back to view's rendered results
    const prevResults = this.searchController?.lastResults || this.view.getRenderedResults() || null;
    this.albumController.handleAlbumClick(albumId, prevResults);
  });
  this.view.bindFavoriteToggle(song => this.favoriteController.handleFavoriteToggle(song));
  this.view.bindAddToPlaylist(song => this.playlistController.handlePlaylist(song));
  this.view.bindShare(song => this.shareController.handleShare(song));
  this.view.bindCreatePlaylist(name => this.playlistController.createPlaylist(name));
  
  this.view.bindArtistClick(({ artistId, artistName }) => {
    // create a back handler that restores the last rendered search results if available
    const prev = this.searchController?.lastResults || this.view.getRenderedResults() || null;
    const backHandler = () => {
      if (prev) {
        this.view.renderResults(prev);
      } else {
        // fallback: show an empty results message
        this.view.renderResults({ songs: [], albums: [], artists: [] });
      }
    };

    this.artistProfileController.showArtistProfile(backHandler, artistName);
  });
  this.view.bindSearch(query => {
    homeContainer.style.display = "none";
    resultsSection.style.display = "block";
    this.searchController.handleSearch(query)
  });
  

  const user = this.userController.getCurrentUser();

    // Utente non loggato → carica eventuale ultima ricerca
    const latest = this.model.getLastSearch?.();
    if (latest) {
      this.searchController.loadLatestSearch();
    }
  }

async loadUserCollections() {
  const favorites = await this.favoriteController.getFavorites();
  const playlists = await this.playlistController.getPlaylists();

  // Usa la nuova home in stile Spotify
  this.homeView.renderSpotifyHome(favorites, playlists);
}


  _subscribeRealtime(uid) {
    try {
      // unsubscribe previous if present
      this._unsubscribeRealtime();

      const favCol = collection(db, 'users', uid, 'favorites');
      const playCol = collection(db, 'users', uid, 'playlists');

      this._unsubFav = onSnapshot(favCol, async () => {
        // refresh home data when favorites change
        await this.loadUserCollections();
        // also sync button states in any currently rendered results
        try { await this._syncResultButtonStates(); } catch (e) { console.warn('Errore sync fav button states', e); }
      });

      this._unsubPlaylists = onSnapshot(playCol, async () => {
        // refresh home data when playlists change
        await this.loadUserCollections();
        // also sync button states in any currently rendered results
        try { await this._syncResultButtonStates(); } catch (e) { console.warn('Errore sync playlist button states', e); }
      });
    } catch (err) {
      console.error('Errore sottoscrizione realtime:', err);
    }
  }

  // Synchronize the buttons shown in the current results view with the
  // user's favorites and playlists. This is called on realtime updates so
  // that buttons toggle to "Rimuovi" when items are added from other
  // tabs/devices.
  async _syncResultButtonStates() {
    try {
      const favorites = await this.favoriteController.getFavorites();
      const playlists = await this.playlistController.getPlaylists();
      const rendered = this.view.getRenderedResults() || {};
      const songs = rendered.songs || [];

      songs.forEach(s => {
        const id = s.id || (s.title ? String(s.title).replace(/\s+/g,'-').toLowerCase() : null);
        if (!id) return;
        const isFav = favorites.some(f => f.id === id);
        const isInPlaylist = playlists.some(pl => (pl.songs || []).some(t => t.id === id));
        // update view buttons
        this.view.updateFavoriteState(id, isFav);
        this.view.updatePlaylistButton(id, null, isInPlaylist);
      });
    } catch (err) {
      console.warn('Errore durante la sincronizzazione degli stati dei pulsanti:', err);
    }
  }

  _unsubscribeRealtime() {
    try {
      if (typeof this._unsubFav === 'function') this._unsubFav();
      if (typeof this._unsubPlaylists === 'function') this._unsubPlaylists();
    } catch (err) {
      console.warn('Errore durante unsubscribe realtime:', err);
    }
    this._unsubFav = null;
    this._unsubPlaylists = null;
  }

async loadHome() {
  const auth = getAuth();
  const user = auth.currentUser;

  const resultsSection = document.getElementById("results-section");
  const homeContainer = document.getElementById("home-container");
  const resultsContainers = document.querySelectorAll('#results-container');

  // Mostra home, nascondi risultati
  if (homeContainer) homeContainer.style.display = 'block';
  if (resultsSection) resultsSection.style.display = 'none';

  // Pulisci eventuali vecchi risultati
  resultsContainers.forEach(c => { if (c) c.innerHTML = ''; });

  if (!user) {
    this.homeView.showWelcomeMessage('Visitatore');
    return;
  }

  this.homeView.showWelcomeMessage(user.displayName || 'Utente');

  // --- NUOVA PARTE ---
  const favorites = await this.favoriteController.getFavorites();
  const playlists = await this.playlistController.getPlaylists();

  // Puoi generare qualche consiglio fittizio per ora
  const recommended = favorites.slice(0, 4).map(f => ({
    title: f.title,
    artist: f.artist,
    artwork: f.artwork
  }));

  // 🎵 Mostra nuova home in stile Spotify
  this.homeView.renderSpotifyHome(favorites, playlists, recommended);

  // Scorri in alto per estetica
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0,0); }
}







}



