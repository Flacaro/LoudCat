// apiService.js

// Servizio che gestisce le chiamate alle API pubbliche

// JSONP helper for iTunes endpoints (keeps app frontend-only when CORS blocks fetch)
function jsonpFetch(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const callbackName = `__itunes_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => {
      // cleanup
      window[callbackName] = () => {};
      script.remove();
      reject(new Error('JSONP request timed out'));
    }, timeout);

    window[callbackName] = (data) => {
      clearTimeout(timer);
      try {
        resolve(data);
      } finally {
        // cleanup
        delete window[callbackName];
        script.remove();
      }
    };

    // append callback param (url already contains ?) and use callback name
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
  let data;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Errore nella richiesta API: ${res.status} ${res.statusText} (${endpoint})`);
    data = await res.json();
  } catch (err) {
    // fallback to JSONP when CORS blocks fetch (iTunes supports callback param)
    try {
      data = await jsonpFetch(endpoint);
    } catch (jsonpErr) {
      throw new Error(`fetchSongs failed for ${endpoint}: ${err.message}; jsonp: ${jsonpErr.message}`);
    }
  }
  return data.results.map((item) => ({
    title: item.trackName,
    artist: item.artistName,
    album: item.collectionName,
    artwork: item.artworkUrl100,
    preview: item.previewUrl,
    genre: item.primaryGenreName || ""
  }));
}

export async function fetchAlbums(query) {
  const params = `term=${encodeURIComponent(query)}&entity=album&limit=12`;
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
      throw new Error(`fetchAlbums failed for ${endpoint}: ${err.message}; jsonp: ${jsonpErr.message}`);
    }
  }
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
    let data;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Errore nella richiesta API: ${res.status} ${res.statusText} (${endpoint})`);
      data = await res.json();
    } catch (err) {
      try {
        data = await jsonpFetch(endpoint);
      } catch (jsonpErr) {
        throw new Error(`fetchTracksByAlbum failed for ${endpoint}: ${err.message}; jsonp: ${jsonpErr.message}`);
      }
    }
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

  return data.results.map((item) => ({
    name: item.artistName,
    artistId: item.artistId,
    // remove artwork and genre completely
    albums: [] // optional
  }));
}


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

  // The first item is the album info, rest are tracks
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

export async function getRecommendedFromItunes(userGenres, userSongs) {
  const recommended = [];

  for (const genre of userGenres) {
    // cerca canzoni simili su iTunes per il genere
    const results = await fetchSongs(genre, "track"); // o "artist" se preferisci
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

