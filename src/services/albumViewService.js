// albumViewService.js
import { fetchAlbumById, fetchTracksByAlbum } from "./apiService.js";

export default class AlbumViewService {
  async getAlbumDetails(albumId) {
    try {
      const [albumInfo, tracks] = await Promise.all([
        fetchAlbumById(albumId),
        fetchTracksByAlbum(albumId),
      ]);

      return {
        id: albumInfo.collectionId,
        title: albumInfo.title || albumInfo.collectionName,
        artist: albumInfo.artistName,
        coverImage: albumInfo.artworkUrl100,
        releaseDate: albumInfo.releaseDate?.split("-")[0],
        genre: albumInfo.primaryGenreName,
        tracks,
      };
    } catch (err) {
      // add context to the error so controllers can show better messages
      throw new Error(`Errore nel caricamento dei dettagli album: ${err.message}`);
    }
  }
}
