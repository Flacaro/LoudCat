// src/controller/artistProfileController.js
import ArtistProfileService from "../services/artistProfileService.js";
import ArtistProfileView from "../view/artistProfileView.js";

export default class ArtistProfileController {
  constructor() {
    this.service = new ArtistProfileService();
    this.view = new ArtistProfileView();
    this._onBack = this._onBack.bind(this);
  }

  // Show artist info by name
  // accept optional backHandler as first arg (provided by MusicController)
  async showArtistProfile(backHandler, artistName) {
    try {
      if (!artistName) throw new Error("Nessun artista specificato");
      this.view.renderLoading();

      // Step 1: Search artist by name (MusicBrainz)
      const searched = await this.service.searchArtistByName(artistName);
      if (!searched?.id) throw new Error("Artista non trovato");

      // Step 2: Get full artist details by MBID
      const artist = await this.service.getArtistProfile(searched.id);

      this.view.renderArtistProfile(artist);
      // prefer provided backHandler, else fallback to internal _onBack
      this.view.bindBack(typeof backHandler === 'function' ? backHandler : this._onBack);
    } catch (err) {
      console.error("Error loading artist profile:", err);
      this.view.renderError("❌ Impossibile caricare il profilo artista.");
    }
  }

  _onBack() {
    if (history.length > 1) history.back();
    else window.location.reload();
  }
}
