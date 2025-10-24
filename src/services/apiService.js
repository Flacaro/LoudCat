// apiService.js

// Servizio che gestisce le chiamate alle API pubbliche

// iTunes Search API non supporta CORS, quindi usiamo JSONP come fallback
function jsonpFetch(url, timeout = 10000) {
  // Restituisce una Promise che risolve con i dati JSONP
  return new Promise((resolve, reject) => {
    const callbackName = `__itunes_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => {
      // timeout handler
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

    //aggiunge il parametro di callback all'URL
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

// Funzione per cercare canzoni su iTunes
export async function fetchSongs(query, type = "artist") {
  let params = `term=${encodeURIComponent(query)}&limit=12`;
  if (type === "artist") {
    params += `&entity=song&attribute=artistTerm`;
  } else if (type === "album") {
    params += `&entity=song&attribute=albumTerm`;
  } else if (type === "track") {
    params += `&entity=song&attribute=songTerm`;
  } else {
    params += `&entity=song`;
  }

  const endpoint = `https://itunes.apple.com/search?${params}`;
  let data;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Errore nella richiesta API: ${res.status} ${res.statusText} (${endpoint})`);
    data = await res.json();
  } catch (err) {
    // Se fetch fallisce (es. per CORS), prova con JSONP
    try {
      data = await jsonpFetch(endpoint);
    } catch (jsonpErr) {
      throw new Error(`fetchSongs failed for ${endpoint}: ${err.message}; jsonp: ${jsonpErr.message}`);
    }
  }
  // Mappa i risultati nel formato desiderato
  return data.results.map((item) => ({
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
  const params = `term=${encodeURIComponent(query)}&entity=album&limit=12`;
  const endpoint = `https://itunes.apple.com/search?${params}`;
  let data;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Errore nella richiesta API: ${res.status} ${res.statusText} (${endpoint})`);
    data = await res.json();
  } catch (err) {
    // Se fetch fallisce (es. per CORS), prova con JSONP
    try {
      data = await jsonpFetch(endpoint);
    } catch (jsonpErr) {
      throw new Error(`fetchAlbums failed for ${endpoint}: ${err.message}; jsonp: ${jsonpErr.message}`);
    }
  }
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
    const params = `id=${albumId}&entity=song`;
    const endpoint = `https://itunes.apple.com/lookup?${params}`;
    let data;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Errore nella richiesta API: ${res.status} ${res.statusText} (${endpoint})`);
      data = await res.json();
    } catch (err) {
      try {
        // Se fetch fallisce (es. per CORS), prova con JSONP
        data = await jsonpFetch(endpoint);
      } catch (jsonpErr) {
        throw new Error(`fetchTracksByAlbum failed for ${endpoint}: ${err.message}; jsonp: ${jsonpErr.message}`);
      }
    }
    // Il primo risultato è l'album, gli altri sono le tracce
    return data.results.slice(1).map((item) => ({
      title: item.trackName,
      duration: item.trackTimeMillis ? `${Math.floor(item.trackTimeMillis / 60000)}:${String(Math.floor((item.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}` : "N/A",
      preview: item.previewUrl,
   }));
}

// Funzione per cercare artisti su iTunes
export async function fetchArtists(query) {
  const params = `term=${encodeURIComponent(query)}&entity=musicArtist&limit=12`;
  const endpoint = `https://itunes.apple.com/search?${params}`;
  let data;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Errore nella richiesta API: ${res.status} ${res.statusText}`);
    data = await res.json();
  } catch (err) {
    try {
      data = await jsonpFetch(endpoint);
    } catch (jsonpErr) {
      throw new Error(`fetchArtists failed: ${err.message}; jsonp: ${jsonpErr.message}`);
    }
  }
  //non è ottenibile l'immagine dell'artista da iTunes API
  return data.results.map((item) => ({
    name: item.artistName,
    artistId: item.artistId,
    albums: []
  }));
}

// Funzione per ottenere i dettagli di un album dato il suo ID
export async function fetchAlbumById(albumId) {
  const endpoint = `https://itunes.apple.com/lookup?id=${albumId}&entity=song`;
  let data;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Errore nella richiesta API: ${res.status} ${res.statusText} (${endpoint})`);
    data = await res.json();
  } catch (err) {
    try {
      data = await jsonpFetch(endpoint);
    } catch (jsonpErr) {
      throw new Error(`fetchAlbumById failed for ${endpoint}: ${err.message}; jsonp: ${jsonpErr.message}`);
    }
  }
  if (!data.results || !data.results.length) throw new Error("Album non trovato");

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

  for (const genre of userGenres) {
    // cerca canzoni simili su iTunes per il genere
    const results = await fetchSongs(genre, "track"); // o "artist"
    results.forEach(song => {
      if (!userSongs.some(s => s.title === song.title && s.artist === song.artist) &&
          !recommended.some(r => r.title === song.title && r.artist === song.artist)) {
        recommended.push(song);
      }
    });

    if (recommended.length >= 10) break; // massimo 10 consigli
  }

  return recommended.slice(0, 10);
}
// Funzione per cercare un album dato titolo e artista
export async function searchAlbumByTitleAndArtist(albumTitle, artistName) {
  const query = `${albumTitle} ${artistName}`;
  const params = `term=${encodeURIComponent(query)}&entity=album&limit=1`;
  const endpoint = `https://itunes.apple.com/search?${params}`;

  let data;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Errore nella richiesta API: ${res.status} ${res.statusText} (${endpoint})`);
    data = await res.json();
  } catch (err) {
    try {
      data = await jsonpFetch(endpoint);
    } catch (jsonpErr) {
      console.warn(`searchAlbumByTitleAndArtist failed for ${endpoint}: ${err.message}; jsonp: ${jsonpErr.message}`);
      return null; // Non riesce a trovare l'album
    }
  }
  
  // ritorna il primo risultato se esiste
  if (data.results && data.results.length > 0) {
    return {
      collectionId: data.results[0].collectionId,
      title: data.results[0].collectionName,
      artist: data.results[0].artistName,
      artwork: data.results[0].artworkUrl100
    };
  }
  
  return null;
}

