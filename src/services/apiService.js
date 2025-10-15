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
