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
import { bindHomeClick } from "../view/header.js";

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
  
  bindHomeClick(() => {
      // carica home se necessario
      if (typeof this.loadHome === "function") this.loadHome();
      // toggle visibilità
      document.getElementById("results-section")?.classList.add("d-none");
      const home = document.getElementById("home-container");
      if (home) {
        home.classList.remove("d-none");
        home.scrollIntoView({ behavior: "smooth", block: "start" });
      }
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

  this.homeView.renderUserCollections(favorites, playlists);
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
      });

      this._unsubPlaylists = onSnapshot(playCol, async () => {
        // refresh home data when playlists change
        await this.loadUserCollections();
      });
    } catch (err) {
      console.error('Errore sottoscrizione realtime:', err);
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
  // Ensure the home container is visible and other sections are hidden,
  // clear any existing results (albums/artist/results) and then load user collections.
  const auth = getAuth();
  const user = auth.currentUser;

  const resultsSection = document.getElementById("results-section");
  const homeContainer = document.getElementById("home-container");
  // There are multiple elements with id 'results-container' (legacy); clear them all
  const resultsContainers = document.querySelectorAll('#results-container');

  // Show home, hide results
  if (homeContainer) homeContainer.style.display = 'block';
  if (resultsSection) resultsSection.style.display = 'none';

  // Clear rendered content in all results containers to remove album/artist detail views
  resultsContainers.forEach(c => { if (c) c.innerHTML = ''; });

  if (!user) {
    // Not logged in: show a minimal welcome message but don't attempt to load collections
    this.homeView.showWelcomeMessage('Visitatore');
    return;
  }

  this.homeView.showWelcomeMessage(user.displayName || 'Utente');

  // Use controller method to fetch freshest data (favorites/playlists) so Home always reflects recent changes
  await this.loadUserCollections();

  // Smooth scroll to top for better UX when returning to Home
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0,0); }

}
}



