export default class PlaylistView {
  constructor() {}

  bindCreatePlaylist(handler) {
    const btn = document.getElementById('createPlaylistBtn');
    btn?.addEventListener('click', async () => {
      // Keep prompt for now (lightweight). Handler receives the new playlist name.
      const name = prompt('Inserisci il nome della nuova playlist:');
      if (name && handler) handler(name.trim());
    });
  }

  // showModal supports selecting an existing playlist or creating a new one.
  // onSelect is called with (playlistId, playlistName). If a new playlist is created,
  // playlistId will be '__new__' and playlistName the provided name.
  showModal(song, playlists = [], onSelect) {
    if (this.modal) this.modal.remove();

    this.modal = document.createElement('div');
    this.modal.id = 'playlist-modal';
    this.modal.className = 'playlist-modal-overlay';

    this.modal.innerHTML = `
      <div class="playlist-modal-content">
        <h4>Aggiungi "${song.title}" a playlist</h4>
        <select id="playlist-select" class="form-control">
          ${playlists.map(pl => `<option value="${pl.id}">${pl.name}</option>`).join('')}
          <option value="__new__">➕ Crea nuova playlist</option>
        </select>
        <input id="new-playlist-name" class="form-control mt-2" placeholder="Nome nuova playlist" style="display:none;">
        <div class="modal-buttons mt-3">
          <button id="playlist-cancel" class="btn btn-outline-secondary">Annulla</button>
          <button id="playlist-ok" class="btn btn-primary">Conferma</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    const select = this.modal.querySelector('#playlist-select');
    const newInput = this.modal.querySelector('#new-playlist-name');
    const cancelBtn = this.modal.querySelector('#playlist-cancel');
    const okBtn = this.modal.querySelector('#playlist-ok');

    const toggleNewInput = () => {
      if (select.value === '__new__') {
        newInput.style.display = 'block';
        newInput.focus();
      } else {
        newInput.style.display = 'none';
      }
    };

    toggleNewInput();
    select.addEventListener('change', toggleNewInput);

    cancelBtn.addEventListener('click', () => this.modal.remove());
    okBtn.addEventListener('click', () => {
      let playlistId = select.value;
      let playlistName = playlistId !== '__new__' ? select.options[select.selectedIndex].text : newInput.value.trim();

      if (playlistId === '__new__' && !playlistName) {
        alert('Inserisci un nome valido per la nuova playlist.');
        newInput.focus();
        return;
      }

      if (onSelect) onSelect(playlistId, playlistName);
      this.modal.remove();
    });

    // close when clicking outside
    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.modal.remove(); });
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
