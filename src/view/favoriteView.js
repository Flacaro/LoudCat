export default class FavoriteView {
  constructor() {}

  updateFavoriteState(songId, isFav) {
    const btns = document.querySelectorAll(`.fav-btn[data-song-id="${songId}"]`);
    if (!btns || btns.length === 0) return;
    btns.forEach(btn => {
      btn.textContent = isFav ? '💛 Rimuovi dai preferiti' : '⭐ Aggiungi ai preferiti';
      btn.classList.toggle('btn-warning', isFav);
      btn.classList.toggle('btn-outline-warning', !isFav);
    });
  }


}
