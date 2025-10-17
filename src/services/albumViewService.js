// albumViewService.js
import { fetchAlbumById, fetchTracksByAlbum } from "./apiService.js";

export default class AlbumViewService {
  async getAlbumDetails(albumId) {
    const [albumInfo, tracks] = await Promise.all([
      fetchAlbumById(albumId),
      fetchTracksByAlbum(albumId)
    ]);

    return {
      id: albumInfo.collectionId,
      title: albumInfo.title || albumInfo.collectionName,
      artist: albumInfo.artistName,
      coverImage: albumInfo.artworkUrl100,
      releaseDate: albumInfo.releaseDate?.split("-")[0],
      genre: albumInfo.primaryGenreName,
      tracks
    };
  }
}
