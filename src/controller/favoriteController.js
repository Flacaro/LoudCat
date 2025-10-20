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

    const favRef = doc(db, "users", user.uid, "favorites", song.id);

    try {
      const snap = await getDoc(favRef);
      if (snap.exists()) {
        await deleteDoc(favRef);
        this.view.updateFavoriteState(song.id, false);
      } else {
        await setDoc(favRef, {
          title: song.title,
          artist: song.artist,
          album: song.album,
          artwork: song.artwork,
          preview: song.preview,
          addedAt: new Date().toISOString(),
        });
        this.view.updateFavoriteState(song.id, true);
      }
    } catch (err) {
      console.error("Errore nella gestione dei preferiti:", err);
      this.view.showToast("Errore nella gestione dei preferiti.");
    }
  }
}
