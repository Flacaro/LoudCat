// albumViewService.js
import { fetchAlbumById, fetchTracksByAlbum } from "./apiService.js";

export default class AlbumViewService {
  // Recupera i dettagli di un album, inclusi le tracce
  async getAlbumDetails(albumId) {
    try {
      const [albumInfo, tracks] = await Promise.all([
        //usa le funzioni di apiService per ottenere i dati
        fetchAlbumById(albumId),
        fetchTracksByAlbum(albumId),
      ]);
      //restituisce un oggetto Album con i dettagli e le tracce
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
      //gestione errori
      throw new Error(`Errore nel caricamento dei dettagli album: ${err.message}`);
    }
  }
}
