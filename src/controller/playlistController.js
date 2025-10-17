import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db } from "../firebase.js";

export default class PlaylistController {
  constructor(view) {
    this.view = view;
  }

  async handlePlaylist(song) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      this.view.showToast("Devi effettuare il login per gestire la playlist.");
      return;
    }

    const playlistId = song.id || song.title.replace(/\s+/g,'-').toLowerCase();
    const plRef = doc(db, "users", user.uid, "playlists", playlistId);

    try {
      const snap = await getDoc(plRef);
      if (snap.exists()) {
        const data = snap.data();
        const songExists = data.songs?.some(s => s.id === song.id);
        if (songExists) {
          await updateDoc(plRef, { songs: arrayRemove(song.id) });
          this.view.showToast("Canzone rimossa dalla playlist!");
        } else {
          await updateDoc(plRef, { songs: arrayUnion(song.id) });
          this.view.showToast("Canzone aggiunta alla playlist!");
        }
      } else {
        await setDoc(plRef, {
          name: "My Playlist",
          songs: [{ ...song, addedAt: new Date().toISOString() }]
        });
        this.view.showToast("Playlist creata e canzone aggiunta!");
      }
    } catch (err) {
      console.error("Errore nella gestione della playlist:", err);
    }
  }

  async createPlaylist(playlistName) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      this.view.showToast("Devi effettuare il login per creare una playlist.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const data = snap.exists() ? snap.data() : {};
      const playlists = data.playlists || [];

      if (playlists.some(pl => pl.name === playlistName)) {
        this.view.showToast("Esiste già una playlist con questo nome!");
        return;
      }

      playlists.push({ name: playlistName, songs: [] });
      await setDoc(userRef, { playlists }, { merge: true });
      this.view.showToast(`Playlist "${playlistName}" creata con successo!`);
    } catch (err) {
      console.error("Errore nella creazione della playlist:", err);
      this.view.showToast("Errore durante la creazione della playlist.");
    }
  }
}
