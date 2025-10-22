import { doc, setDoc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db } from "../firebase.js";

export default class PlaylistController {
  constructor(view) {
    this.view = view;
  }

  async getPlaylists() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const playlistsSnap = await getDocs(collection(db, "users", user.uid, "playlists"));
      return playlistsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Errore nel recupero delle playlist:", err);
      return [];
    }
  }

  async handlePlaylist(song) {


    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      this.view.showToast("Devi effettuare il login per gestire la playlist.");
      return;
    }

    try {
      const playlistsSnap = await getDocs(collection(db, "users", user.uid, "playlists"));
      const playlists = playlistsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Controlla se la canzone è già presente in qualche playlist
      const playlistsContainingSong = playlists.filter(pl => pl.songs?.some(s => s.id === song.id));

      if (playlistsContainingSong.length > 0) {
        // Rimuovi la canzone da tutte le playlist che la contengono
        const removePromises = playlistsContainingSong.map(pl => {
          const plRef = doc(db, "users", user.uid, "playlists", pl.id);
          const updatedSongs = pl.songs.filter(s => s.id !== song.id);
          return updateDoc(plRef, { songs: updatedSongs });
        });
        await Promise.all(removePromises);
        this.view.showToast(`Canzone rimossa da ${playlistsContainingSong.length} playlist!`);
        this.view.updatePlaylistButton(song.id, null, false); // Aggiorna pulsante a "+ Aggiungi"
        return;
      }

      // Se la canzone non è presente in nessuna playlist, apri modal per aggiungere
      this.view.showPlaylistModal(song, playlists, async (playlistId, playlistName) => {
        let plRef;
        if (playlistId === "__new__") {
          await this.createPlaylist(song);
          this.view.showToast(`Playlist "${playlistName}" creata e canzone aggiunta!`);
          return;
        } else {
          plRef = doc(db, "users", user.uid, "playlists", playlistId);
          const snap = await getDoc(plRef);
          const data = snap.data() || { songs: [] };
          await updateDoc(plRef, { songs: arrayUnion({ ...song, addedAt: new Date().toISOString() }) });
          this.view.showToast(`Canzone aggiunta alla playlist "${data.name}"!`);
        }

        this.view.updatePlaylistButton(song.id, playlistId, true);
      });

    } catch (err) {
      console.error(err);
      this.view.showToast("Errore nella gestione della playlist.");
    }
  }

  async createPlaylist(song = null) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      this.view.showToast("Devi effettuare il login per creare una playlist.");
      return;
    }

    const playlistName = prompt("Inserisci il nome della nuova playlist:");

    if (!playlistName || playlistName.trim() === "") {
      if (playlistName !== null) { // Evita il toast se l'utente ha premuto Annulla
        this.view.showToast("Nome playlist non valido.");
      }
      return;
    }

    try {
      const plRef = doc(collection(db, "users", user.uid, "playlists"));

      const newSong = song ? [{ ...song, addedAt: new Date().toISOString() }] : [];

      await setDoc(plRef, {
        name: playlistName.trim(),
        songs: newSong,
        createdAt: new Date().toISOString()
      });

      this.view.showToast(`Playlist "${playlistName.trim()}" creata${song ? " e canzone aggiunta" : ""}!`);

      // Se è stata aggiunta una canzone, aggiorna lo stato del pulsante
      if (song) {
        this.view.updatePlaylistButton(song.id, plRef.id, true);
      }
    } catch (err) {
      console.error("Errore nella creazione della playlist:", err);
      this.view.showToast("Errore durante la creazione della playlist.");
    }
  }


}
