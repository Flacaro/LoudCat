// src/services/artistProfileService.js
export default class ArtistProfileService {
  constructor() {
    // Works better than corsproxy.io for MusicBrainz
    this.proxy = "https://api.allorigins.win/raw?url=";
  }

  // Search artist by name
  async searchArtistByName(name) {
    const endpoint = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(
      name
    )}&limit=1&fmt=json`;
    const res = await fetch(this.proxy + encodeURIComponent(endpoint));
    if (!res.ok) throw new Error("Errore nella ricerca artista MusicBrainz");

    const data = await res.json();
    const artist = data.artists?.[0];
    if (!artist) throw new Error("Artista non trovato");

    return artist;
  }

  // Get full artist profile
  async getArtistProfile(artistId) {
    const endpoint = `https://musicbrainz.org/ws/2/artist/${artistId}?fmt=json&inc=url-rels+release-groups`;
    const res = await fetch(this.proxy + encodeURIComponent(endpoint));
    if (!res.ok)
      throw new Error("Errore nel caricamento dati artista MusicBrainz");

    const data = await res.json();

    // Try to fetch cover art from first release group
    let artwork = "";
    const release = data["release-groups"]?.[0];
    if (release) {
      try {
        const coverRes = await fetch(
          this.proxy +
            encodeURIComponent(
              `https://coverartarchive.org/release-group/${release.id}/front-250`
            )
        );
        if (coverRes.ok) artwork = coverRes.url;
      } catch {
        console.warn("No cover art available for this artist");
      }
    }

    return this._mapArtistData(data, artwork);
  }

  // Normalize the data
  _mapArtistData(raw, artwork = "") {
    const releases = (raw["release-groups"] || []).map((rg) => ({
      id: rg.id,
      title: rg.title,
      type: rg["primary-type"] || "Album",
      cover: artwork || "assets/img/avatar-placeholder.svg",
      releaseDate: "—",
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
