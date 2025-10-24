// apiService.js

// Servizio che gestisce le chiamate alle API pubbliche

// iTunes Search API non supporta CORS, quindi usiamo JSONP come fallback
function jsonpFetch(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const callbackName = `__itunes_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => {
      window[callbackName] = () => {};
      script.remove();
      reject(new Error('JSONP request timed out'));
    }, timeout);
    window[callbackName] = (data) => {
      clearTimeout(timer);
      try {
        resolve(data);
      } finally {
        delete window[callbackName];
        script.remove();
      }
    };

    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}callback=${callbackName}`;
    script.onerror = (e) => {
      clearTimeout(timer);
      delete window[callbackName];
      script.remove();
      reject(new Error('JSONP script error'));
    };

    document.head.appendChild(script);
  });
}

// Funzione di fetch con fallback a JSONP
async function fetchWithFallback(endpoint, context = 'API request') {
  let data;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    data = await res.json();
  } catch (err) {
    try {
      data = await jsonpFetch(endpoint);
    } catch (jsonpErr) {
      throw new Error(`${context} failed for ${endpoint}: ${err.message}; jsonp: ${jsonpErr.message}`);
    }
  }
  return data;
}

// funzione per costruire l'URL di ricerca iTunes
function buildItunesSearchUrl(query, entity, attribute = null, limit = 12) {
  let params = `term=${encodeURIComponent(query)}&entity=${entity}&limit=${limit}`;
  if (attribute) params += `&attribute=${attribute}`;
  return `https://itunes.apple.com/search?${params}`;
}

// funzione per costruire l'URL di lookup iTunes
function buildItunesLookupUrl(id, entity = null) {
  let params = `id=${id}`;
  if (entity) params += `&entity=${entity}`;
  return `https://itunes.apple.com/lookup?${params}`;
}

// Funzione per cercare canzoni su iTunes
export async function fetchSongs(query, type = "artist") {
  const attributeMap = {
    artist: 'artistTerm',
    album: 'albumTerm',
    track: 'songTerm'
  };
  const attribute = attributeMap[type] || null;
  const endpoint = buildItunesSearchUrl(query, 'song', attribute);
  const data = await fetchWithFallback(endpoint, 'fetchSongs');
  
  return data.results.map((item) => ({
    trackId: item.trackId,
    title: item.trackName,
    artist: item.artistName,
    album: item.collectionName,
    artwork: item.artworkUrl100,
    preview: item.previewUrl,
    genre: item.primaryGenreName || ""
  }));
}

// Funzione per cercare album su iTunes
export async function fetchAlbums(query) {
  const endpoint = buildItunesSearchUrl(query, 'album');
  const data = await fetchWithFallback(endpoint, 'fetchAlbums');
  // Mappiamo i risultati per restituire solo le informazioni rilevanti
  return data.results.map((item) => ({
    collectionId: item.collectionId,
    title: item.collectionName,
    artist: item.artistName,
    artwork: item.artworkUrl100,
    trackCount: item.trackCount,
    releaseDate: item.releaseDate ? item.releaseDate.split("-")[0] : "N/A",
    genre: item.primaryGenreName,
  }));
}

// Funzione per ottenere le tracce di un album dato il suo ID
export async function fetchTracksByAlbum(albumId) {
  const endpoint = buildItunesLookupUrl(albumId, 'song');
  const data = await fetchWithFallback(endpoint, 'fetchTracksByAlbum');
  
  // Il primo risultato è l'album, gli altri sono le tracce
  return data.results.slice(1).map((item) => ({
    trackId: item.trackId,
    title: item.trackName,
    duration: item.trackTimeMillis 
      ? `${Math.floor(item.trackTimeMillis / 60000)}:${String(Math.floor((item.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}` 
      : "N/A",
    preview: item.previewUrl,
  }));
}

// Funzione per cercare artisti su iTunes
export async function fetchArtists(query) {
  const endpoint = buildItunesSearchUrl(query, 'musicArtist');
  const data = await fetchWithFallback(endpoint, 'fetchArtists');
  //non usiamo album e track qui, solo info base artista
  return data.results.map((item) => ({
    name: item.artistName,
    artistId: item.artistId,
    albums: []
  }));
}

// Funzione per ottenere i dettagli di un album dato il suo ID
export async function fetchAlbumById(albumId) {
  const endpoint = buildItunesLookupUrl(albumId, 'song');
  const data = await fetchWithFallback(endpoint, 'fetchAlbumById');
  
  if (!data.results || !data.results.length) throw new Error("Album non trovato");
  
  // Il primo risultato è l'album, gli altri sono le tracce
  const albumInfo = data.results[0];
  return {
    collectionId: albumInfo.collectionId,
    title: albumInfo.collectionName,
    artistName: albumInfo.artistName,
    artworkUrl100: albumInfo.artworkUrl100,
    releaseDate: albumInfo.releaseDate,
    primaryGenreName: albumInfo.primaryGenreName
  };
}

// Funzione per ottenere raccomandazioni basate sui generi preferiti dell'utente
export async function getRecommendedFromItunes(userGenres, userSongs) {
  const recommended = [];
// Cicliamo sui generi preferiti dell'utente
  for (const genre of userGenres) {
    const results = await fetchSongs(genre, "track");
    results.forEach(song => {
      if (!userSongs.some(s => s.title === song.title && s.artist === song.artist) &&
          !recommended.some(r => r.title === song.title && r.artist === song.artist)) {
        recommended.push(song);
      }
    });

    if (recommended.length >= 10) break;
  }

  return recommended.slice(0, 10);
}

// Funzione per cercare un album dato titolo e artista
export async function searchAlbumByTitleAndArtist(albumTitle, artistName) {
  const query = `${albumTitle} ${artistName}`;
  const endpoint = buildItunesSearchUrl(query, 'album', null, 1);
  try {
    const data = await fetchWithFallback(endpoint, 'searchAlbumByTitleAndArtist');
    
    if (data.results && data.results.length > 0) {
      return {
        collectionId: data.results[0].collectionId,
        title: data.results[0].collectionName,
        artist: data.results[0].artistName,
        artwork: data.results[0].artworkUrl100
      };
    }
  } catch (err) {
    console.warn(`searchAlbumByTitleAndArtist failed for "${albumTitle}" by "${artistName}":`, err.message);
  }
  
  return null;
}

