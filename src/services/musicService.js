// musicService.js
import { fetchSongs, fetchAlbums, fetchArtists, fetchTracksByAlbum } from "./apiService.js";
import Song from "../model/song.js";
import Album from "../model/album.js";
import Artist from "../model/artist.js";

// **NEW**: Shared mapper for raw API song data to Song model
function mapToSong(item) {
  return new Song({
    id: item.trackId,
    title: item.title,
    artist: item.artist,
    album: item.album,
    artwork: item.artwork,
    preview: item.preview
  });
}

// **NEW**: Shared mapper for raw API album data to Album model
function mapToAlbum(item) {
  return new Album({
    id: item.collectionId,
    title: item.title,
    artist: item.artist,
    releaseDate: item.releaseDate,
    coverImage: item.artwork,
    tracks: []
  });
}

// **NEW**: Shared mapper for raw API artist data to Artist model
function mapToArtist(item) {
  return new Artist({
    id: item.artistId,
    name: item.name,
    genre: item.genre,
    artwork: item.artwork,
    albums: item.albums || []
  });
}

// Servizio principale per la ricerca di musica
export default class MusicService {
  async search(query) {
    const [songsData, albumsData, artistsData] = await Promise.all([
      fetchSongs(query),
      fetchAlbums(query),
      fetchArtists(query)
    ]);

    return {
      songs: songsData.map(mapToSong),
      albums: albumsData.map(mapToAlbum),
      artists: artistsData.map(mapToArtist)
    };
  }

  // Ottiene le canzoni in base alla query e al tipo (artista, album, ecc.)
  async getSongs(query, type = "artist") {
    const data = await fetchSongs(query, type);
    return data.map(mapToSong);
  }

  async getAlbums(query) {
    const data = await fetchAlbums(query);
    return data.map(mapToAlbum);
  }

  async getAlbumTracks(albumId) {
    return await fetchTracksByAlbum(albumId);
  }
}

