// albumViewController.js
import AlbumView from "../view/albumView.js";
import AlbumViewService from "../services/albumViewService.js";

export default class AlbumViewController {
  constructor() {
    this.view = new AlbumView();
    this.service = new AlbumViewService();
  }

  async showAlbum(albumId, backHandler) {
    this.view.renderLoading();
    try {
      const album = await this.service.getAlbumDetails(albumId);
      this.view.renderAlbum(album);
      this.view.bindBack(backHandler);
    } catch (err) {
      console.error("Errore nel caricamento album:", err);
      this.view.container.innerHTML = "<p>❌ Errore nel caricamento dell'album</p>";
    }
  }
}
