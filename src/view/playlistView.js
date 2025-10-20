export default class PlaylistView {
  constructor() {}

  bindCreatePlaylist(handler) {
    const btn = document.getElementById('createPlaylistBtn');
    btn?.addEventListener('click', async () => {
      // Prefer a small custom modal in future; keep prompt for now
      const name = prompt('Inserisci il nome della nuova playlist:');
      if (name && handler) handler(name);
    });
  }

  showModal(song, playlists, onSelect) {
    // simple modal: list playlists and allow selection
    const modal = document.createElement('div');
    modal.className = 'playlist-modal-overlay';
    modal.innerHTML = `
      <div class="playlist-modal">
        <h5>Seleziona playlist</h5>
        <ul class="list-group">
          ${playlists.map(p => `<li class="list-group-item playlist-item" data-id="${p.id}">${p.name}</li>`).join('')}
        </ul>
        <button class="btn btn-secondary close-playlist-modal">Chiudi</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('.playlist-item').forEach(li => {
      li.addEventListener('click', () => {
        const id = li.getAttribute('data-id');
        if (onSelect) onSelect(id);
        modal.remove();
      });
    });
    modal.querySelector('.close-playlist-modal')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }

  updatePlaylistButton(songId, playlistId, isAdded) {
    const btns = document.querySelectorAll(`.playlist-btn[data-song-id="${songId}"]`);
    btns.forEach(btn => {
      btn.textContent = isAdded ? '- Rimuovi dalla playlist' : '+ Aggiungi alla playlist';
      btn.classList.toggle('btn-outline-primary', !isAdded);
      btn.classList.toggle('btn-danger', isAdded);
    });
  }
}
