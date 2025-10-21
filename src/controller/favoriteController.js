import { doc, setDoc, collection, getDocs, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db } from "../firebase.js";

export default class FavoriteController {
  constructor(view) {
    this.view = view;
  }

  async getFavorites() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const favsSnap = await getDocs(collection(db, "users", user.uid, "favorites"));
    return favsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Errore nel recupero dei preferiti:", err);
    return [];
  }
  
}


  async handleFavoriteToggle(song) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      this.view.showToast("Devi effettuare il login per gestire i preferiti.");
      return;
    }
    // The handler may receive either:
    // - a plain song object {id,title,...}
    // - a raw encoded string (from data-song)
    // - an HTMLElement (button) with data attributes we can read
    let songObj = null;
    try {
      if (song instanceof HTMLElement) {
        // try dataset.song -> might be encoded
        const raw = song.dataset.song;
        try {
          songObj = raw ? JSON.parse(decodeURIComponent(raw)) : null;
        } catch (e) {
          // fallback to individual fields
          songObj = {
            id: song.dataset.songId,
            title: decodeURIComponent(song.dataset.songTitle || "") || undefined,
            artist: decodeURIComponent(song.dataset.songArtist || "") || undefined,
            album: decodeURIComponent(song.dataset.songAlbum || "") || undefined,
            artwork: decodeURIComponent(song.dataset.songArtwork || "") || undefined,
            preview: decodeURIComponent(song.dataset.songPreview || "") || undefined,
          };
        }
      } else if (typeof song === 'string') {
        try { songObj = JSON.parse(decodeURIComponent(song)); } catch (e) { songObj = null; }
      } else if (song && typeof song === 'object') {
        songObj = song;
      }
    } catch (err) {
      console.warn('handleFavoriteToggle: failed to normalize incoming song payload', err, song);
    }

    const safeId = songObj && songObj.id ? songObj.id : (songObj && songObj.title ? String(songObj.title).replace(/\s+/g, '-').toLowerCase() : null);
    const title = songObj && songObj.title ? songObj.title : (song && song.dataset ? decodeURIComponent(song.dataset.songTitle || '') : undefined);
    if (!safeId) {
      console.warn('handleFavoriteToggle: missing song id and title', songObj || song);
      this.view.showToast('Impossibile determinare l\'ID del brano.');
      return;
    }

  const favRef = doc(db, "users", user.uid, "favorites", safeId);

    try {
      const snap = await getDoc(favRef);
      if (snap.exists()) {
        await deleteDoc(favRef);
        this.view.updateFavoriteState(safeId, false);
      } else {
        await setDoc(favRef, {
          title: title || (songObj && songObj.title) || null,
          artist: (songObj && songObj.artist) || null,
          album: (songObj && songObj.album) || null,
          artwork: (songObj && songObj.artwork) || null,
          preview: (songObj && songObj.preview) || null,
          addedAt: new Date().toISOString(),
        });
        this.view.updateFavoriteState(safeId, true);
      }
    } catch (err) {
      console.error("Errore nella gestione dei preferiti:", err);
      this.view.showToast("Errore nella gestione dei preferiti.");
    }
  }


}
