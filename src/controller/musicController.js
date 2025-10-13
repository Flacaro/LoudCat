// musicController.js
// Collega la View e il Model

export default class MusicController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  init() {
    this.view.bindSearch(this.handleSearch.bind(this));
  }

  async handleSearch(query) {
    try {
      this.view.renderLoading();
      const songs = await this.model.getSongs(query);
      this.view.renderResults(songs);
    } catch (err) {
      console.error(err);
      this.view.renderError();
    }
  }
}
