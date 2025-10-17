import { fetchSongs, fetchAlbums, fetchArtists, fetchTracksByAlbum} from "./apiService.js";
import Song from "../model/song.js";
import Album from "../model/album.js";
import Artist from "../model/artist.js";

export default class MusicService {
  async search(query) {
    const [songsData, albumsData, artistsData] = await Promise.all([
      fetchSongs(query),
      fetchAlbums(query),
      fetchArtists(query)
    ]);

    return{
      songs: songsData.map(songData => new Song(songData)),
      albums: albumsData.map(albumData => new Album(albumData)),
      artists: artistsData.map(artistData => new Artist(artistData)) // Using Song class for artist results as well
    };
}

  async getSongs(query, type = "artist") {
    const data = await fetchSongs(query, type);
    return data.map(songData => new Song(songData));
  }

  async getAlbums(query){
    const data = await fetchAlbums(query, type);
    return data.map(albumData => new Album(albumData));
  }

  async getAlbumTracks(albumId) {
  return await fetchTracksByAlbum(albumId); // already returns tracklist
}

}

