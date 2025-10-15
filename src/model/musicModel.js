// musicModel.js
// Gestisce i dati e le chiamate tramite i services

import { fetchSongs } from "../services/apiService.js";

export default class MusicModel {
  async getSongs(query, type = "artist") {
    return await fetchSongs(query, type);
  }
}

