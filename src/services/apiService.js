// apiService.js
// Servizio che gestisce le chiamate alle API pubbliche

export async function fetchSongs(query, type = "artist") {
  // iTunes API supports 'entity' and 'attribute' params to narrow searches.
  // Map our type to appropriate query params.
  let params = `term=${encodeURIComponent(query)}&limit=12`;
  if (type === "artist") {
    params += `&entity=song&attribute=artistTerm`;
  } else if (type === "album") {
    // album search: request album entity, but we still want track info to show previews.
    // We'll search for albumTerm and keep entity=song to receive track results for that album.
    params += `&entity=song&attribute=albumTerm`;
  } else if (type === "track") {
    params += `&entity=song&attribute=songTerm`;
  } else {
    params += `&entity=song`;
  }

  const endpoint = `https://itunes.apple.com/search?${params}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("Errore nella richiesta API");

  const data = await res.json();
  return data.results.map((item) => ({
    title: item.trackName,
    artist: item.artistName,
    album: item.collectionName,
    artwork: item.artworkUrl100,
    preview: item.previewUrl,
  }));
}

export async function fetchAlbums(query) {
  const params = `term=${encodeURIComponent(query)}&entity=album&limit=12`;
  const endpoint = `https://itunes.apple.com/search?${params}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("Errore nella richiesta API");

  const data = await res.json();
  return data.results.map((item) => ({
    collectionId: item.collectionId, // needed for album click
    title: item.collectionName,
    artist: item.artistName,
    artwork: item.artworkUrl100,
    trackCount: item.trackCount,
    releaseDate: item.releaseDate ? item.releaseDate.split("-")[0] : "N/A",
    genre: item.primaryGenreName,
  }));
}

export async function fetchTracksByAlbum(albumId) {
    const params = `id=${albumId}&entity=song`;
    const endpoint = `https://itunes.apple.com/lookup?${params}`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error("Errore nella richiesta API");
    const data = await res.json();
  // The first item is album info, the rest are tracks
    return data.results.slice(1).map((item) => ({
      title: item.trackName,
      duration: item.trackTimeMillis ? `${Math.floor(item.trackTimeMillis / 60000)}:${String(Math.floor((item.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}` : "N/A",
      preview: item.previewUrl,
   }));
}

export async function fetchArtists(query) {
  const params = `term=${encodeURIComponent(query)}&entity=musicArtist&limit=12`;
  const endpoint = `https://itunes.apple.com/search?${params}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("Errore nella richiesta API");

  const data = await res.json();
  return data.results.map((item) => ({
    name: item.artistName,
    artistId: item.artistId,
    genre: item.primaryGenreName,
    artwork: item.artworkUrl100 || './assets/default-artwork.png',
    albums: [] // optional: populate in MusicService if you want top albums
  }));
}

