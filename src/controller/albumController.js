// albumViewController.js
import AlbumView from "../view/albumView.js";
import AlbumViewService from "../services/albumViewService.js";

export default class AlbumViewController {
  // Accept parentView (the shared MusicView) and model so we can
  // re-render the previous results using the main view.
  constructor(parentView = null, model = null) {
    this.parentView = parentView; // MusicView instance used to render results
    this.model = model;
    this.view = new AlbumView();
    this.service = new AlbumViewService();
    // store the last results shown so the controller can render them on "back"
    // must be an object compatible with MusicView.renderResults, e.g. { albums: [...] }
    this.lastResults = null;
  }

  async showAlbum(albumId, backHandler) {
    this.view.renderLoading();
    try {
      const album = await this.service.getAlbumDetails(albumId);
      this.view.renderAlbum(album);
      // If no backHandler was provided, create a default one that
      // re-renders the previously stored results (if any).
      const handler = typeof backHandler === "function"
        ? backHandler
        : () => {
            console.debug('AlbumViewController.backHandler invoked, lastResults:', this.lastResults);
            const toRestore = this.lastResults || (this.parentView && this.parentView.getRenderedResults && this.parentView.getRenderedResults());
            if (toRestore) {
              if (this.parentView && typeof this.parentView.renderResults === 'function') {
                console.debug('Restoring results via parentView.renderResults');
                this.parentView.renderResults(toRestore);
              } else if (this.view && typeof this.view.renderResults === 'function') {
                console.debug('Restoring results via album view renderResults fallback');
                this.view.renderResults(toRestore);
              } else {
                console.debug('No renderResults available, clearing container');
                this.view.container.innerHTML = "<p>Nessun risultato precedente</p>";
              }
            } else {
              console.debug('No lastResults to restore');
              this.view.container.innerHTML = "<p>Nessun risultato precedente</p>";
            }
          };

      this.view.bindBack(handler);
    } catch (err) {
      console.error("Errore nel caricamento album:", err);
      this.view.container.innerHTML = "<p>❌ Errore nel caricamento dell'album</p>";
    }
  }

   // Accept optional `previousResults` (array) so the caller can provide
   // the list currently shown; this avoids relying on view internals.
   handleAlbumClick(albumId, previousResults = null) {
    // previousResults may be an array (albums) or a full results object.
    if (Array.isArray(previousResults)) {
      this.lastResults = { albums: previousResults };
    } else if (previousResults && typeof previousResults === 'object') {
      this.lastResults = previousResults;
    }

    this.showAlbum(albumId);
   }
}
