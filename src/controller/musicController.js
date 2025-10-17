import SearchController from "./searchController.js";
import FavoriteController from "./favoriteController.js";
import PlaylistController from "./playlistController.js";
import ShareController from "./shareController.js";
import AlbumController from "./albumController.js";
import UserController from "./userController.js";

export default class MusicController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.userController = new UserController();
    this.searchController = new SearchController(model, view);
    this.favoriteController = new FavoriteController(view);
    this.playlistController = new PlaylistController(view);
    this.shareController = new ShareController(view);
    this.albumController = new AlbumController(view, model);
  }

  init() {
    this.view.bindSearch(query => this.searchController.handleSearch(query));
    this.view.bindAlbumClick(albumId => this.albumController.handleAlbumClick(albumId));
    this.view.bindFavoriteToggle(song => this.favoriteController.handleFavoriteToggle(song));
    this.view.bindAddToPlaylist(song => this.playlistController.handlePlaylist(song));
    this.view.bindShare(song => this.shareController.handleShare(song));
    this.view.bindCreatePlaylist(name => this.playlistController.createPlaylist(name));
    this.searchController.loadLatestSearch();
  }
}
