
import {doc, setDoc, getDoc, collection, getDocs, updateDoc, arrayUnion} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db } from "../firebase.js";

//controller per la gestione delle playlist utente
//gestisce creazione, aggiunta e rimozione di canzoni nelle playlist
export default class PlaylistController {
  constructor(view) {
    this.view = view; 
  }

  //recupera tutte le playlist dell’utente loggato da Firestore
  async getPlaylists() {
    const auth = getAuth();
    const user = auth.currentUser;
    //se l’utente non è loggato, ritorna array vuoto
    if (!user) return []; 

    try {
      const playlistsSnap = await getDocs(collection(db, "users", user.uid, "playlists"));
      return playlistsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Errore nel recupero delle playlist:", err);
      return [];
    }
  }

  //gestisce il click sul pulsante "Aggiungi/Rimuovi dalla playlist"
  //se la canzone è già in una o più playlist → la rimuove
  //altrimenti apre un modal per scegliere dove aggiungerla
  async handlePlaylist(song) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      this.view.showToast("Devi effettuare il login per gestire la playlist.");
      return;
    }

    try {
      //recupera tutte le playlist dell’utente
      const playlistsSnap = await getDocs(collection(db, "users", user.uid, "playlists"));
      const playlists = playlistsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      //controlla se la canzone è già presente in una o più playlist
      const playlistsContainingSong = playlists.filter(pl =>
        pl.songs?.some(s => s.id === song.id)
      );

      if (playlistsContainingSong.length > 0) {
        //se sì → rimuove la canzone da tutte le playlist in cui si trova
        const removePromises = playlistsContainingSong.map(pl => {
          const plRef = doc(db, "users", user.uid, "playlists", pl.id);
          const updatedSongs = pl.songs.filter(s => s.id !== song.id);
          return updateDoc(plRef, { songs: updatedSongs });
        });

        await Promise.all(removePromises);
        this.view.showToast(`Canzone rimossa da ${playlistsContainingSong.length} playlist!`);
        //aggiorna il pulsante a “+ Aggiungi”
        return;
        this.view.updatePlaylistButton(song.id, null, false); 
      }

      //se la canzone NON è presente, mostra il modal per scegliere la playlist
      this.view.showPlaylistModal(song, playlists, async (playlistId, playlistName) => {
        let plRef;

        if (playlistId === "__new__") {
          //se l’utente ha scelto di creare una nuova playlist
          await this.createPlaylist(song, playlistName);
          this.view.showToast(`Playlist "${playlistName}" creata e canzone aggiunta!`);
          return;
        } else {
          //altrimenti aggiunge la canzone alla playlist esistente
          plRef = doc(db, "users", user.uid, "playlists", playlistId);
          const snap = await getDoc(plRef);
          const data = snap.data() || { songs: [] };

          await updateDoc(plRef, {
            songs: arrayUnion({ ...song, addedAt: new Date().toISOString() })
          });

          this.view.showToast(`Canzone aggiunta alla playlist "${data.name}"!`);
        }

        //aggiorna lo stato del pulsante nell’interfaccia
        this.view.updatePlaylistButton(song.id, playlistId, true);
      });

    } catch (err) {
      console.error(err);
      this.view.showToast("Errore nella gestione della playlist.");
    }
  }

  //crea una nuova playlist
  //può opzionalmente aggiungere subito una canzone
  async createPlaylist(song = null, playlistName = null) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      this.view.showToast("Devi effettuare il login per creare una playlist.");
      return;
    }

    //se il nome non è stato passato, lo chiede tramite il modal della vista
    if (!playlistName) {
      if (typeof this.view.showCreatePlaylistModal === 'function') {
        //aspetta il nome dal modal
        playlistName = await new Promise(resolve => {
          this.view.showCreatePlaylistModal(name => resolve(name));
        });
      } else {
        //in caso la view non abbia il modal → usa il prompt di default
        playlistName = prompt("Inserisci il nome della nuova playlist:");
      }
    }

    //validazione del nome
    if (!playlistName || playlistName.trim() === "") {
      if (playlistName !== null) {
        this.view.showToast("Nome playlist non valido.");
      }
      return;
    }

    try {
      //crea un nuovo documento playlist in Firestore
      const plRef = doc(collection(db, "users", user.uid, "playlists"));
      const newSong = song ? [{ ...song, addedAt: new Date().toISOString() }] : [];

      await setDoc(plRef, {
        name: playlistName.trim(),
        songs: newSong,
        createdAt: new Date().toISOString()
      });

      this.view.showToast(`Playlist "${playlistName.trim()}" creata${song ? " e canzone aggiunta" : ""}!`);

      //se è stata aggiunta una canzone, aggiorna il pulsante
      if (song) {
        this.view.updatePlaylistButton(song.id, plRef.id, true);
      }

    } catch (err) {
      console.error("Errore nella creazione della playlist:", err);
      this.view.showToast("Errore durante la creazione della playlist.");
    }
  }

  //gestisce la creazione di una playlist vuota (senza canzone associata)
  async handleCreatePlaylist() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      this.view.showToast("Devi effettuare il login per creare una playlist.");
      return;
    }

    //mostra il modal per inserire il nome della nuova playlist
    this.view.showCreatePlaylistModal(async (playlistName) => {
      if (!playlistName || playlistName.trim() === "") {
        this.view.showToast("Nome playlist non valido.");
        return;
      }

      try {
        const plRef = doc(collection(db, "users", user.uid, "playlists"));
        await setDoc(plRef, {
          name: playlistName.trim(),
          songs: [],
          createdAt: new Date().toISOString()
        });

        this.view.showToast(`Playlist "${playlistName.trim()}" creata!`);

        //se la vista ha un metodo per aggiornare la lista, lo richiama
        if (this.view.refreshPlaylists) {
          this.view.refreshPlaylists();
        }

      } catch (err) {
        console.error("Errore nella creazione della playlist:", err);
        this.view.showToast("Errore durante la creazione della playlist.");
      }
    });
  }
}
