import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";

export default class UserController {
  async loadUserCollections(userId) {
    if (!userId) return { favorites: [], playlists: [] };

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { favorites: [], playlists: [] };

    const data = userSnap.data();
    const playlists = data.playlists || [];

    const favCol = collection(db, "users", userId, "favorites");
    const favSnap = await getDocs(favCol);
    const favorites = favSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return { favorites, playlists };
  }

  renderUserCollections({ favorites, playlists }, view) {
    const container = document.getElementById("results-container");
    container.innerHTML = "";

    if(favorites.length) {
      const favHtml = favorites.map(song => `
        <div class="card song-card hover-card">
          <img src="${song.artwork || 'assets/img/avatar-placeholder.svg'}" alt="${song.title}" />
          <h4>${song.title}</h4>
          <p>${song.artist}</p>
        </div>
      `).join("");
      container.insertAdjacentHTML("beforeend", `<h3>I tuoi preferiti</h3>${favHtml}`);
    } else {
      container.insertAdjacentHTML("beforeend", "<h3>I tuoi preferiti</h3><p>Nessun preferito</p>");
    }

    if(playlists.length) {
      const plHtml = playlists.map(pl => `
        <div class="card playlist-card hover-card">
          <h4>${pl.name}</h4>
          <p>${pl.songs.length} brani</p>
        </div>
      `).join("");
      container.insertAdjacentHTML("beforeend", `<h3>Le tue playlist</h3>${plHtml}`);
    } else {
      container.insertAdjacentHTML("beforeend", "<h3>Le tue playlist</h3><p>Nessuna playlist creata</p>");
    }
  }
}
