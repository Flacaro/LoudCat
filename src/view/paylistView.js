export default class PlaylistView {
  constructor() {
    this.modal = null;
  }

  showModal(song, playlists = [], onSelect) {
    if (this.modal) this.modal.remove();

    this.modal = document.createElement("div");
    this.modal.id = "playlist-modal";
    this.modal.className = "playlist-modal";

    this.modal.innerHTML = `
      <div class="playlist-modal-content">
        <h4>Aggiungi "${song.title}" a playlist</h4>
        <select id="playlist-select">
          ${playlists.map(pl => `<option value="${pl.id}">${pl.name}</option>`).join("")}
          <option value="__new__">➕ Crea nuova playlist</option>
        </select>
        <input id="new-playlist-name" placeholder="Nome nuova playlist" style="display:none;">
        <div class="modal-buttons">
          <button id="playlist-cancel" class="btn btn-outline-secondary">Annulla</button>
          <button id="playlist-ok" class="btn btn-primary">Conferma</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    const select = this.modal.querySelector("#playlist-select");
    const newInput = this.modal.querySelector("#new-playlist-name");
    const cancelBtn = this.modal.querySelector("#playlist-cancel");
    const okBtn = this.modal.querySelector("#playlist-ok");

    // Mostra/nascondi input nuova playlist
    const toggleNewInput = () => {
      if (select.value === "__new__") {
        newInput.style.display = "block";
        newInput.focus();  // mette il focus sull'input
      } else {
        newInput.style.display = "none";
      }
    };

    toggleNewInput(); // iniziale (nel caso sia selezionato __new__ di default)
    select.addEventListener("change", toggleNewInput);

    cancelBtn.addEventListener("click", () => this.modal.remove());
    okBtn.addEventListener("click", () => {
      let playlistId = select.value;
      let playlistName = playlistId !== "__new__" ? select.options[select.selectedIndex].text : newInput.value.trim();

      if (!playlistName) {
        alert("Inserisci un nome valido per la nuova playlist.");
        newInput.focus();
        return;
      }

      onSelect(playlistId, playlistName);
      this.modal.remove();
    });
  }
}
