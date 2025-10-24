// albumViewController.js
import AlbumView from "../view/albumView.js";
import AlbumViewService from "../services/albumViewService.js";

//controller che si occupa della gestione della logica di visualizzazione degli album
export default class AlbumViewController {
  constructor(parentView = null, model = null) {
    this.parentView = parentView;
    this.model = model;
    this.view = new AlbumView();
    this.service = new AlbumViewService();
    // Memorizza gli ultimi risultati mostrati, così da poterli ripristinare al “back”
    this.lastResults = null;
  }

  //mostra i dettagli di un album
  //backHandler -Funzione opzionale da eseguire quando l’utente preme “indietro”.
  async showAlbum(albumId, backHandler) {
    this.view.renderLoading();
    try {
      //recupera i dettagli dell'album
      const album = await this.service.getAlbumDetails(albumId);
      this.view.renderAlbum(album);
      //ripristina i risultati precedenti memorizzati in lastResults
      const handler = typeof backHandler === "function"
        ? backHandler
        : () => {
          console.debug('AlbumViewController.backHandler invoked, lastResults:', this.lastResults);
          // Recupera i risultati precedenti (lastResults o quelli nel parentView)
          const toRestore = this.lastResults || (this.parentView && this.parentView.getRenderedResults && this.parentView.getRenderedResults());
          if (toRestore) {
            // Se la vista principale ha un metodo renderResults, lo usa per ripristinare i dati
            if (this.parentView && typeof this.parentView.renderResults === 'function') {
              console.debug('Restoring results via parentView.renderResults');
              this.parentView.renderResults(toRestore);
            }
            // In alternativa, prova a usare un metodo di fallback nella view stessa
            else if (this.view && typeof this.view.renderResults === 'function') {
              console.debug('Restoring results via album view renderResults fallback');
              this.view.renderResults(toRestore);
            }
            // Se nessuna delle due viste è disponibile, mostra un messaggio vuoto
            else {
              console.debug('No renderResults available, clearing container');
              this.view.container.innerHTML = "<p>Nessun risultato precedente</p>";
            }
          } else {
            console.debug('No lastResults to restore');
            this.view.container.innerHTML = "<p>Nessun risultato precedente</p>";
          }
        };

      //collega l'handler del pulsante "indietro" alla vista
      this.view.bindBack(handler);
    } catch (err) {
      console.error("Errore nel caricamento album:", err);
      this.view.container.innerHTML = "<p>❌ Errore nel caricamento dell'album</p>";
    }
  }

  //gestisce il click su un album
  handleAlbumClick(albumId, previousResults = null, isUserLoggedIn = false) {
    if (Array.isArray(previousResults)) {
      this.lastResults = { albums: previousResults };
    } else if (previousResults && typeof previousResults === 'object') {
      this.lastResults = previousResults;
    }
    
    //salva lo stato di login dell’utente per riutilizzarlo
    this._isUserLoggedIn = isUserLoggedIn;

    //definisce il comportamento del pulsante “indietro”
    const backHandler = () => {
      console.debug('AlbumViewController.backHandler invoked, lastResults:', this.lastResults);

      // Recupera i risultati precedenti (da lastResults o dalla vista principale)
      const toRestore = this.lastResults ||
        (this.parentView && this.parentView.getRenderedResults && this.parentView.getRenderedResults());

      if (toRestore) {
        //ripristina i risultati tramite la vista principale
        if (this.parentView && typeof this.parentView.renderResults === 'function') {
          console.debug('Restoring results via parentView.renderResults with isUserLoggedIn:', this._isUserLoggedIn);
          this.parentView.renderResults(toRestore, this._isUserLoggedIn);
        } else {
          console.debug('No renderResults available, clearing container');
          this.view.container.innerHTML = "<p>Nessun risultato precedente</p>";
        }
      } else {
        console.debug('No lastResults to restore');
        this.view.container.innerHTML = "<p>Nessun risultato precedente</p>";
      }
    };

    // mostra i dettagli dell’album e passa l’handler per il “back”
    this.showAlbum(albumId, backHandler);
  }
}
