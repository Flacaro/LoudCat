import SearchController from "./searchController.js";
import FavoriteController from "./favoriteController.js";
import PlaylistController from "./playlistController.js";
import ShareController from "./shareController.js";
import AlbumController from "./albumController.js";
import UserController from "./userController.js";
import ArtistProfileController from "./artistProfileController.js";

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
}
