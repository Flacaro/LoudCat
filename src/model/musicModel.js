// musicModel.js
// Gestisce i dati e le chiamate tramite i services

import { fetchSongs } from "../services/apiService.js";

export default class MusicModel {
  async getSongs(query) {
    return await fetchSongs(query);
  }
}
