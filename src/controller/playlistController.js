import { doc, setDoc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
        // Crea nuova playlist con la canzone
        plRef = doc(collection(db, "users", user.uid, "playlists"));
        await setDoc(plRef, { name: playlistName, songs: [{ ...song, addedAt: new Date().toISOString() }] });
        this.view.showToast(`Playlist "${playlistName}" creata e canzone aggiunta!`);
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



}
