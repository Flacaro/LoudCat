import { searchAlbumByTitleAndArtist } from "./apiService.js";

// src/services/artistProfileService.js
export default class ArtistProfileService {
  constructor() {
    // public proxies to try when direct requests are blocked by CORS
    this.proxies = [
      // order matters: try lightweight proxies known to work for JSON
      "https://thingproxy.freeboard.io/fetch/",
      "https://api.allorigins.win/raw?url=",
      // fallback variants
      "https://api.allorigins.cf/raw?url=",
    ];
  }

  // Try direct fetch first, then fall back to a list of public proxies.
  async _fetchJsonWithFallback(url) {
    // try direct
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (err) {
      // direct fetch failed - fall through to proxies
      console.warn('Direct fetch failed for', url, err);
    }

    // try proxies in order
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

    throw new Error(`Impossibile recuperare JSON da ${url} (direct + proxies failed)`);
  }

  // Search artist by name
  async searchArtistByName(name) {
    const endpoint = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(name)}&limit=1&fmt=json`;
    const data = await this._fetchJsonWithFallback(endpoint);
    const artist = data.artists?.[0];
    if (!artist) throw new Error("Artista non trovato");

    return artist;
  }

  // Get full artist profile
  async getArtistProfile(artistId) {
    const endpoint = `https://musicbrainz.org/ws/2/artist/${artistId}?fmt=json&inc=url-rels+release-groups`;
    const data = await this._fetchJsonWithFallback(endpoint);

    // Try to fetch cover art metadata from Cover Art Archive (JSON) for the first release group
    let artwork = "";
    const release = data["release-groups"]?.[0];
    if (release) {
      try {
        // Use the JSON endpoint which returns metadata including image URLs
        const coverJsonUrl = `https://coverartarchive.org/release-group/${release.id}`;
        try {
          const coverData = await this._fetchJsonWithFallback(coverJsonUrl);
          const image = (coverData.images || [])[0];
          // prefer a thumbnail or image URL if available
          artwork = image?.thumbnails?.small || image?.image || "";
        } catch (err) {
          console.warn(`Cover art metadata not available: ${err.message}`);
        }
      } catch (err) {
        console.warn("No cover art available for this artist or proxy failed:", err);
      }
    }

    return this._mapArtistData(data, artwork);
  }

  // NEW: Match MusicBrainz albums with iTunes
  async enrichAlbumsWithItunesIds(albums, artistName) {
    console.log(`Matching ${albums.length} albums with iTunes for artist: ${artistName}`);
    
    // Process albums in batches to avoid overwhelming the API
    const enrichedAlbums = [];
    
    for (const album of albums.slice(0, 20)) { // Limit to first 20 albums
      try {
        const itunesMatch = await searchAlbumByTitleAndArtist(album.title, artistName);
        
        enrichedAlbums.push({
          ...album,
          collectionId: itunesMatch?.collectionId || null,
          isClickable: !!itunesMatch?.collectionId
        });
        
        // Small delay to avoid rate limiting
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
    
    console.log(`Matched ${enrichedAlbums.filter(a => a.isClickable).length}/${enrichedAlbums.length} albums with iTunes`);
    return enrichedAlbums;
  }

  // Normalize the data
  _mapArtistData(raw, artwork = "") {
    const releases = (raw["release-groups"] || []).map((rg) => ({
      id: rg.id,
      title: rg.title,
      type: rg["primary-type"] || "Album",
      date: rg["first-release-date"] || "—",
      cover: artwork || "assets/img/avatar-placeholder.svg",
      collectionId: null, // Will be enriched later
      isClickable: false
    }));

    return {
      id: raw.id,
      name: raw.name,
      country: raw.country || "N/A",
      type: raw.type || "Unknown",
      disambiguation: raw.disambiguation || "",
      picture: artwork || "assets/img/avatar-placeholder.svg",
      fans: Math.floor(Math.random() * 500000) + 5000,
      nb_album: releases.length,
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
