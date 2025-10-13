// apiService.js
// Servizio che gestisce le chiamate alle API pubbliche

export async function fetchSongs(query) {
  const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=12`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("Errore nella richiesta API");

  const data = await res.json();
  return data.results.map((item) => ({
    title: item.trackName,
    artist: item.artistName,
    artwork: item.artworkUrl100,
    preview: item.previewUrl,
  }));
}
