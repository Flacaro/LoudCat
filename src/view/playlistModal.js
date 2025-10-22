// playlistModal.js
export function initPlaylistModal(addSongToPlaylist, createNewPlaylist) {
  const modal = document.getElementById('playlistModal');
  const closeBtn = modal.querySelector('.modal-close-btn');
  const list = modal.querySelector('.playlist-list');

  function openPlaylistModal(playlists) {
    list.innerHTML = '';

    // Playlist esistenti
    playlists.forEach(pl => {
      const li = document.createElement('li');
      li.textContent = pl.name;
      li.dataset.id = pl.id;
      li.addEventListener('click', () => addSongToPlaylist(pl.id));
      list.appendChild(li);
    });

    // Card speciale "Crea playlist"
    const liNew = document.createElement('li');
    liNew.textContent = '+ Crea nuova playlist';
    liNew.style.fontWeight = '700';
    liNew.addEventListener('click', () => createNewPlaylist());
    list.prepend(liNew);

    modal.classList.remove('hidden');
  }

  // Chiudi con il pulsante
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  // Chiudi cliccando fuori dal contenuto
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  return { openPlaylistModal };
}
