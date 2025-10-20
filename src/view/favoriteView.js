export default class FavoriteView {
  constructor() {}

  updateFavoriteState(songId, isFav) {
    const btn = document.querySelector(`.fav-btn[data-song-id="${songId}"]`);
    if (btn) {
      btn.textContent = isFav ? '💛 Rimuovi dai preferiti' : '⭐ Aggiungi ai preferiti';
      btn.classList.toggle('btn-warning', isFav);
      btn.classList.toggle('btn-outline-warning', !isFav);
    }
  }
}
