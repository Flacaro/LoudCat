// artistProfileController.js

import ArtistProfileService from "../services/artistProfileService.js";
import ArtistProfileView from "../view/artistProfileView.js";

//controller che gestisce la logica per mostrare il profilo di un artista.
export default class ArtistProfileController {
  constructor() {

    this.service = new ArtistProfileService();
    this.view = new ArtistProfileView();
    this._onBack = this._onBack.bind(this);
  }

  //backHandler -Funzione opzionale da eseguire quando l’utente preme “indietro”.
  async showArtistProfile(backHandler, artistName) {
    try {
      // se non viene passato un nome, genera un errore
      if (!artistName) throw new Error("Nessun artista specificato");
      this.view.renderLoading();

      //ricerca artista per nome
      const searched = await this.service.searchArtistByName(artistName);

      //se la ricerca non restituisce un ID valido, interrompe il processo
      if (!searched?.id) throw new Error("Artista non trovato");

      //recupera i dettagli completi dell’artista
      //usa l’ID trovato in precedenza per ottenere informazioni più approfondite: (biografia, album, anni di attività, ecc.).
      const artist = await this.service.getArtistProfile(searched.id);

      if (artist.albums && artist.albums.length > 0) {
        //mostra un profilo parziale (es. informazioni base + loader per album)
        this.view.renderPartialProfile(artist, true);

        //arricchisce gli album con altre info
        artist.albums = await this.service.enrichAlbumsWithItunesIds(
          artist.albums,
          artist.name
        );
      }

      //mostra il profilo completo dell’artista
      this.view.renderArtistProfile(artist);

      //collega la funzione “indietro”:
      //se viene fornito un backHandler, usa quello.
      //altrimenti utilizza il metodo interno _onBack() come comportamento di default.
      this.view.bindBack(typeof backHandler === 'function' ? backHandler : this._onBack);
    } catch (err) {
      console.error("Error loading artist profile:", err);
      this.view.renderError("❌ Impossibile caricare il profilo artista.");
    }
  }

   //se c’è una cronologia di navigazione, torna indietro nella history del browser.
   //altrimenti ricarica la pagina da zero.
  _onBack() {
    if (history.length > 1) {
      history.back();
    } else {
      window.location.reload();
    }
  }
}
