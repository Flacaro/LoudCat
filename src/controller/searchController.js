import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";

export default class SearchController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    // store last results object { songs, albums, artists }
    this.lastResults = null;
  }

  async handleSearch(query) {
    try {
      this.view.renderLoading();
      const results = await this.model.search(query);
      // keep a reference so other controllers can reuse the recently rendered data
      this.lastResults = results;
      this.view.renderResults(results);

      try {
        const rc = this.view.results;
        if (rc) rc.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
        console.warn('Impossibile scrollare ai risultati', e);
      }


      // If attached to MusicController, update playlist-button state based on user's playlists
      if (this.controller?.playlistController) {
        // mark songs that are already present in user's playlists
        const songs = Array.isArray(results.songs) ? results.songs : [];
        await this._markPlaylistState(songs);
      }

      const ref = doc(db, "searches", "latest");
      // Serialize results to plain objects because Firestore rejects custom class instances
      const safeResults = {};
      if (results) {
        if (Array.isArray(results.songs)) {
          safeResults.songs = results.songs.map(s => ({
            id: s.id || null,
            title: s.title || null,
            artist: s.artist || null,
            album: s.album || null,
            artwork: s.artwork || null,
            preview: s.preview || null
          }));
        }
        if (Array.isArray(results.albums)) {
          safeResults.albums = results.albums.map(a => ({
            collectionId: a.collectionId || null,
            title: a.title || null,
            artist: a.artist || null,
            artwork: a.artwork || null,
            trackCount: a.trackCount || null,
            releaseDate: a.releaseDate || null
          }));
        }
        if (Array.isArray(results.artists)) {
          safeResults.artists = results.artists.map(ar => ({
            name: ar.name || null,
            artwork: ar.artwork || null,
            genre: ar.genre || null
          }));
        }
      }
      await setDoc(ref, { query, results: safeResults, updatedAt: new Date().toISOString() });
      console.log("Ricerca salvata su Firestore");
    } catch (err) {
      console.error(err);
      this.view.renderError();
    }
  }

  async loadLatestSearch() {
  // 🔹 Se l’utente è loggato, non renderizzare le card
  if (this.controller?.isUserLoggedIn) return;

  const ref = doc(db, "searches", "latest");
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  if (!data?.results) return;
  // save loaded results so controllers can access them
  this.lastResults = data.results;
  this.view.renderResults(data.results);

  try {
    const rc = this.view.results;
    if (rc) rc.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    console.warn('Impossibile scrollare ai risultati caricati', e);
  }

  if (this.controller?.playlistController) {
    const songs = Array.isArray(data.results.songs) ? data.results.songs : [];
    await this._markPlaylistState(songs);
  }
}

  // check user's playlists and toggle the playlist button UI for results
  async _markPlaylistState(songs) {
    if (!Array.isArray(songs) || songs.length === 0) return;
    try {
      const playlists = await this.controller.playlistController.getPlaylists();
      // build a map songId -> firstPlaylistId containing it
      const map = new Map();
      for (const pl of playlists) {
        (pl.songs || []).forEach(s => {
          const sid = s.id || (s.title ? s.title.replace(/\s+/g, '-').toLowerCase() : null);
          if (sid && !map.has(sid)) map.set(sid, pl.id);
        });
      }

      songs.forEach(s => {
        const sid = s.id || (s.title ? s.title.replace(/\s+/g, '-').toLowerCase() : null);
        const plId = sid ? map.get(sid) : null;
        const isAdded = !!plId;
        this.view.updatePlaylistButton(sid, plId || null, isAdded);
      });
    } catch (err) {
      console.error('Error while marking playlist state:', err);
    }
  }



}
