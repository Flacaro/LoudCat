import SearchController from "./searchController.js";
import FavoriteController from "./favoriteController.js";
import PlaylistController from "./playlistController.js";
import ShareController from "./shareController.js";
import AlbumController from "./albumController.js";
import UserController from "./userController.js";
import ArtistProfileController from "./artistProfileController.js";
import HomeView from "../view/homeView.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
    this.albumController = new AlbumController(view, model);
    this.artistProfileController = new ArtistProfileController();
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
      } else {
        this.isUserLoggedIn = false;
        this.homeView.clearWelcomeMessage();
      }
    });

  this.view.bindAlbumClick(albumId => this.albumController.handleAlbumClick(albumId));
  this.view.bindFavoriteToggle(song => this.favoriteController.handleFavoriteToggle(song));
  this.view.bindAddToPlaylist(song => this.playlistController.handlePlaylist(song));
  this.view.bindShare(song => this.shareController.handleShare(song));
  this.view.bindCreatePlaylist(name => this.playlistController.createPlaylist(name));
  this.view.bindArtistClick(({ artistId, artistName }) => {
  this.artistProfileController.showArtistProfile(null, artistName);
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

  this.homeView.renderUserCollections(favorites, playlists);
}

async loadHome() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  this.homeView.results.innerHTML = "";

  const collections = await this.userController.loadUserCollections(user.uid);

  this.homeView.renderUserCollections(collections.favorites, collections.playlists);

}
}



