import SearchController from "./searchController.js";
import FavoriteController from "./favoriteController.js";
import PlaylistController from "./playlistController.js";
import ShareController from "./shareController.js";
import AlbumController from "./albumController.js";
import UserController from "./userController.js";
<<<<<<< HEAD
import ArtistProfileController from "./artistProfileController.js";
=======
import HomeView from "../view/homeView.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

>>>>>>> 7835cef09045066b302edb8b14e74fb85f677fcd

export default class MusicController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.homeView = new HomeView();

    this.userController = new UserController();
    this.searchController = new SearchController(model, view);
    this.searchController.controller = this;
    this.favoriteController = new FavoriteController(view);
    this.playlistController = new PlaylistController(view);
    this.shareController = new ShareController(view);
    this.albumController = new AlbumController(view, model);
<<<<<<< HEAD
    this.artistProfileController = new ArtistProfileController();
  }

  init() {
    // Bind search bar
    this.view.bindSearch(query => this.searchController.handleSearch(query));

    // Bind album clicks
    this.view.bindAlbumClick(albumId => this.albumController.handleAlbumClick(albumId));

    // Bind favorites
    this.view.bindFavoriteToggle(song => this.favoriteController.handleFavoriteToggle(song));

    // Bind playlist
    this.view.bindAddToPlaylist(song => this.playlistController.handlePlaylist(song));

    // Bind sharing
    this.view.bindShare(song => this.shareController.handleShare(song));

    // Bind playlist creation
    this.view.bindCreatePlaylist(name => this.playlistController.createPlaylist(name));

    // Load previous search
    this.searchController.loadLatestSearch();

    // Bind artist clicks for Deezer
    this.view.bindArtistClick(({ artistId, artistName }) => {
      this.artistProfileController.showArtistProfile(artistId, artistName);
    });
  }
=======

    this.isHomeLoaded = false;
    this.isUserLoggedIn = false;
  }

  async init() {
    this.view.bindSearch(query => this.searchController.handleSearch(query));
  this.view.bindAlbumClick(albumId => this.albumController.handleAlbumClick(albumId));
  this.view.bindFavoriteToggle(song => this.favoriteController.handleFavoriteToggle(song));
  this.view.bindAddToPlaylist(song => this.playlistController.handlePlaylist(song));
  this.view.bindShare(song => this.shareController.handleShare(song));
  this.view.bindCreatePlaylist(name => this.playlistController.createPlaylist(name));

  const user = this.userController.getCurrentUser();
if (user) {
  this.isUserLoggedIn = true;
  this.homeView.showWelcomeMessage(user.displayName || "Utente");
  await this.loadUserCollections();
  // 🔹 Non fare nulla con la ricerca
  return;
}

// Utente non loggato → carica eventuale ultima ricerca
const latest = this.model.getLastSearch?.();
if (latest) {
  this.searchController.loadLatestSearch();
}
  }

  async loadHome() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    this.isHomeLoaded = true;
    this.homeView.results.innerHTML = "";

    const collections = await this.userController.loadUserCollections(user.uid);
    this.homeView.showWelcomeMessage(user.displayName || "Utente");
    this.homeView.renderUserCollections(collections.favorites, collections.playlists);
  
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

  this.homeView.showWelcomeMessage(user.displayName || "Utente");

  // 🔹 Usa solo HomeView per il box
  this.homeView.renderUserCollections(collections.favorites, collections.playlists);
}

>>>>>>> 7835cef09045066b302edb8b14e74fb85f677fcd
}
