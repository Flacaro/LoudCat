// artistProfileService.js
// Servizio per ottenere il profilo di un artista da MusicBrainz e arricchirlo con dati da iTunes
import { searchAlbumByTitleAndArtist } from "./apiService.js";

export default class ArtistProfileService {
  constructor() {
    //proxy list per aggirare CORS
    this.proxies = [
      "https://thingproxy.freeboard.io/fetch/",
      "https://api.allorigins.win/raw?url=",
      "https://api.allorigins.cf/raw?url=",
    ];
  }

  // prova a recuperare JSON direttamente, altrimenti usa i proxy
  async _fetchJsonWithFallback(url) {
    // prova fetch diretto
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (err) {
      //fetch diretto fallito, prova i proxy
      console.warn('Direct fetch failed for', url, err);
    }

    // prova i proxies in ordine
    for (const p of this.proxies) {
      const proxied = p.endsWith('=') ? p + encodeURIComponent(url) : p + url;
      try {
        const res = await fetch(proxied);
        if (res.ok) return await res.json();
        console.warn('Proxy responded with non-ok status', proxied, res.status);
      } catch (err) {
        console.warn('Proxy fetch failed', proxied, err);
      }
    }
    // tutti i tentativi falliti
    throw new Error(`Impossibile recuperare JSON da ${url} (direct + proxies failed)`);
  }

  // cerca un artista per nome con musicBrainz
  async searchArtistByName(name) {
    const endpoint = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(name)}&limit=1&fmt=json`;
    const data = await this._fetchJsonWithFallback(endpoint);
    const artist = data.artists?.[0];
    if (!artist) throw new Error("Artista non trovato");

    return artist;
  }

  // ottiene il profilo completo di un artista dato l'ID MusicBrainz
  async getArtistProfile(artistId) {
    const endpoint = `https://musicbrainz.org/ws/2/artist/${artistId}?fmt=json&inc=url-rels+release-groups`;
    const data = await this._fetchJsonWithFallback(endpoint);
    return this._mapArtistData(data);
  }

  // Mappa e arricchisce gli album con gli iTunes collectionId
  async enrichAlbumsWithItunesIds(albums, artistName) {
    console.log(`Matching ${albums.length} albums with iTunes for artist: ${artistName}`);
    
    // processa gli album uno per uno per evitare rate limiting
    const enrichedAlbums = [];
    
    for (const album of albums.slice(0, 20)) { // limita ai primi 20 album
      try {
        const itunesMatch = await searchAlbumByTitleAndArtist(album.title, artistName);
        
        enrichedAlbums.push({
          ...album,
          collectionId: itunesMatch?.collectionId || null,
          isClickable: !!itunesMatch?.collectionId
        });
        
        // aggiunto un piccolo delay per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.warn(`Failed to match album "${album.title}":`, err);
        enrichedAlbums.push({
          ...album,
          collectionId: null,
          isClickable: false
        });
      }
    }
    // Log dei risultati
    console.log(`Matched ${enrichedAlbums.filter(a => a.isClickable).length}/${enrichedAlbums.length} albums with iTunes`);
    return enrichedAlbums;
  }

  // mappa i dati raw di MusicBrainz in un formato utilizzabile
  _mapArtistData(raw) {
    const releases = (raw["release-groups"] || []).map((rg) => ({
      id: rg.id,
      title: rg.title,
      type: rg["primary-type"] || "Album",
      date: rg["first-release-date"] || "—",
      collectionId: null, // verrà arricchito successivamente con iTunes
      isClickable: false
    }));
    // ritorna l'oggetto artista mappato
    return {
      id: raw.id,
      name: raw.name,
      type: raw.type || "Unknown",
      disambiguation: raw.disambiguation || "",
      albums: releases,
      links: (raw.relations || [])
        .filter(
          (r) =>
            r.url &&
            (r.type === "official homepage" || r.type === "social network")
        )
        .map((r) => r.url.resource),
    };
  }
}
