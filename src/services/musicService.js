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

    return {
      songs: songsData.map(s => new Song({
        id: s.trackId,          // if your Song class uses id
        title: s.title,
        artist: s.artist,
        album: s.album,
        artwork: s.artwork,
        preview: s.preview
      })),
      albums: albumsData.map(a => new Album({
        id: a.collectionId,
        title: a.title,
        artist: a.artist,
        releaseDate: a.releaseDate,
        coverImage: a.artwork,
        tracks: []              // initially empty
      })),
      artists: artistsData.map(ar => new Artist({
        id: ar.artistId,
        name: ar.name,
        genre: ar.genre,
        artwork: ar.artwork,
        albums: ar.albums || []
      }))
    };
  }

  async getSongs(query, type = "artist") {
    const data = await fetchSongs(query, type);
    return data.map(s => new Song({
      id: s.trackId,
      title: s.title,
      artist: s.artist,
      album: s.album,
      artwork: s.artwork,
      preview: s.preview
    }));
  }

  async getAlbums(query) {
    const data = await fetchAlbums(query);
    return data.map(a => new Album({
      id: a.collectionId,
      title: a.title,
      artist: a.artist,
      releaseDate: a.releaseDate,
      coverImage: a.artwork,
      tracks: []
    }));
  }

  async getAlbumTracks(albumId) {
    return await fetchTracksByAlbum(albumId);
  }
}

