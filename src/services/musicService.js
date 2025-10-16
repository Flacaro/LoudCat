import { fetchSongs } from "./apiService.js";
import Song from "../model/Song.js";

export default class MusicService {
  async getSongs(query, type = "artist") {
    const data = await fetchSongs(query, type);
    return data.map(songData => new Song(songData));
  }
  
}

