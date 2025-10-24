import PlaylistController from "../controller/playlistController.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../firebase.js";

export default class HomeView {
  constructor() {
    this.results = document.getElementById("home-container");
    this.welcomeMessage = document.getElementById("welcome-message");
    this._songClickHandler = null;
    this.playlistController = new PlaylistController(this);
    this._clickSuppressTimer = null;
    // Global capture click guard: if suppression is active, swallow clicks before they reach other handlers
    try {
      document.addEventListener('click', (e) => {
        try {
          const blocker = document.getElementById('__click_blocker');
          if (window.__suppressClicks || blocker) {
            try { e.stopImmediatePropagation?.(); } catch (err) {}
            try { e.stopPropagation(); } catch (err) {}
            try { e.preventDefault(); } catch (err) {}
            try { console.debug('GLOBAL: suppressed click due to modal close', { target: e.target && e.target.tagName, suppressFlag: !!window.__suppressClicks, blocker: !!blocker }); } catch (err) {}
            return;
          }
        } catch (err) { /* ignore */ }
      }, { capture: true });
    } catch (err) { /* ignore */ }
  }

  // Insert a transparent full-screen blocker to absorb any clicks for a short time
  _addClickBlocker(ms = 350) {
    try {
      // avoid duplicates
      if (document.getElementById('__click_blocker')) return;
      const blk = document.createElement('div');
      blk.id = '__click_blocker';
      Object.assign(blk.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '1999',
        background: 'transparent',
        pointerEvents: 'auto'
      });
      document.body.appendChild(blk);
      setTimeout(() => { try { blk.remove(); } catch (e) { /* ignore */ } }, ms);
    } catch (e) { /* ignore */ }
  }

  // Temporarily disable pointer events on the main results area so underlying
  // cards cannot receive clicks while a modal is closing.
  _disableResultsPointerEvents(ms = 350) {
    try {
      const el = this.results || document.getElementById('results-container') || document.getElementById('home-container');
      if (!el) return;
      const prev = el.style.pointerEvents;
      el.style.pointerEvents = 'none';
      setTimeout(() => { try { el.style.pointerEvents = prev || ''; } catch (e) { /* ignore */ } }, ms);
    } catch (e) { /* ignore */ }
  }

  // Suppress accidental click handlers on underlying UI for a short time
  suppressClicks(ms = 300) {
    try {
      window.__suppressClicks = true;
      if (this._clickSuppressTimer) clearTimeout(this._clickSuppressTimer);
      this._clickSuppressTimer = setTimeout(() => { window.__suppressClicks = false; this._clickSuppressTimer = null; }, ms);
    } catch (e) { /* ignore */ }
  }


  showWelcomeMessage(user) {
    if (!this.welcomeMessage) return;
    const name =
      user && user.displayName
        ? user.displayName
        : user && user.email
          ? user.email
          : "Utente";
    this.welcomeMessage.textContent = `Ciao, ${name}`;
    this.welcomeMessage.classList.remove("d-none");
  }

  clearWelcomeMessage() {
    if (this.welcomeMessage) {
      this.welcomeMessage.textContent = "";
      this.welcomeMessage.classList.add("d-none");
    }
  }

  bindSongClick(handler) {
    this._songClickHandler = typeof handler === "function" ? handler : null;
  }

  showSongsModal(title, songs, playlistId = null, isFavorites = false) {
    const modal = document.createElement("div");
    modal.className = "playlist-modal";

    const content = document.createElement("div");
    content.className = "playlist-modal-content card p-3";
    Object.assign(content.style, {
      maxWidth: "980px",
      width: "100%",
      maxHeight: "calc(100vh - 80px)",
      overflowY: "auto",
      borderRadius: "8px",
    });

    content.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">${title}</h5>
        <button class="btn-close" aria-label="Close"></button>
      </div>
      <div class="container-fluid">
        <div class="row g-3">
          ${songs
        .map(
          (s, i) => `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
              <div class="card song-card h-100" data-index="${i}" data-song-id="${s.id || ""
            }">
                <div class="artwork-container">
                  <img src="${s.artwork || "assets/img/avatar-placeholder.svg"}"
                       alt="${s.title || ""}" 
                       style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div class="card-body p-2">
                  <h6 class="card-title mb-1" 
                      style="font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                      ${s.title || "-"}
                  </h6>
                  <p class="card-text text-muted mb-1"
                     style="font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                     ${s.artist || ""}
                  </p>
                  ${s.preview
              ? `<audio class="song-preview" controls preload="none" src="${s.preview}">
                           Il tuo browser non supporta l'audio
                         </audio>`
              : `<div class="text-muted small">Preview non disponibile</div>`
            }
             </div>
                <div class="d-flex justify-content-center mt-2">
                  <button class="btn btn-sm btn-danger trash-btn" data-song-id="${s.id || ''}" title="Rimuovi">🗑</button>
                </div>
                <div class="overlay-link" aria-hidden="true"></div>
              </div>
            </div>`
        )
        .join("")}
        </div>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);
    // mark there is an open modal so other handlers can early-return
    try { window.__modalOpen = true; } catch (e) { /* ignore */ }
    // ensure modal.remove clears the flag after a short delay to avoid race
    try {
      const origRemove = modal.remove.bind(modal);
      modal.remove = () => {
        try { origRemove(); } catch (e) { /* ignore */ }
        try { setTimeout(() => { window.__modalOpen = false; }, 350); } catch (e) { /* ignore */ }
      };
    } catch (e) { /* ignore */ }

    // Chiudi modale — attach handlers in capture phase to stop earlier handlers
    const closeBtn = content.querySelector(".btn-close");
    if (closeBtn) {
      const closeHandler = (e) => {
        try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
        try { e.stopPropagation(); } catch (err) { /* ignore */ }
        try { e.preventDefault(); } catch (err) { /* ignore */ }
        if (isFavorites) {
          try { console.debug('HomeView: closing favorites modal via close button', { playlistId, isFavorites, eventPhase: e.eventPhase, type: e.type, target: e.target && e.target.tagName }); } catch (err) { /* ignore */ }
          try { console.debug('HomeView: closeHandler composedPath', { path: (e.composedPath && e.composedPath()) || (e.path || []), time: Date.now() }); } catch (err) { /* ignore */ }
        }
        try { this.suppressClicks(350); } catch (err) { /* ignore */ }
        try { this._addClickBlocker(350); } catch (err) { /* ignore */ }
        try { this._disableResultsPointerEvents(350); } catch (err) { /* ignore */ }
        modal.remove();
      };
      // capture=true so we intercept before document-level capture handlers
      closeBtn.addEventListener('pointerdown', closeHandler, { capture: true });
      closeBtn.addEventListener('click', closeHandler, { capture: true });
    }

    // overlay click: also attach in capture phase
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
        try { e.stopPropagation(); } catch (err) { /* ignore */ }
        try { e.preventDefault(); } catch (err) { /* ignore */ }
        if (isFavorites) {
          try { console.debug('HomeView: closing favorites modal via overlay click', { playlistId, isFavorites, eventPhase: e.eventPhase, type: e.type, target: e.target && e.target.tagName }); } catch (err) { /* ignore */ }
        }
        try { this.suppressClicks(350); } catch (err) { /* ignore */ }
        try { this._addClickBlocker(350); } catch (err) { /* ignore */ }
        try { this._disableResultsPointerEvents(350); } catch (err) { /* ignore */ }
        modal.remove();
      }
    }, { capture: true });
    
    // Delegated handler for per-song trash buttons inside the modal
    modal.addEventListener('click', async (e) => {
      const btn = e.target.closest('.trash-btn');
      if (!btn) return;
      try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
      try { e.stopPropagation(); } catch (err) { /* ignore */ }
      try { e.preventDefault(); } catch (err) { /* ignore */ }
      const songId = btn.dataset.songId;
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) { this.showToast('Devi effettuare il login per rimuovere elementi.', 'warning'); return; }

      // Debug: log context to help trace failures when invoked from Home
      try {
        console.debug('HomeView: delete click', { playlistId, songId, userId: user?.uid, time: Date.now(), path: (e.composedPath && e.composedPath()) || (e.path || []) });
      } catch (e) { /* ignore logging errors */ }

      btn.disabled = true;
      try {
        if (isFavorites) {
          const favRef = doc(db, 'users', user.uid, 'favorites', songId);
          await deleteDoc(favRef);
          this.showToast('Brano rimosso dai preferiti.', 'info');
        } else if (playlistId) {
          if (!playlistId) {
            console.error('HomeView: playlistId mancante al momento della rimozione', { songId, songsLength: (songs || []).length });
            this.showToast('Impossibile individuare la playlist. Riprova.', 'error');
            btn.disabled = false;
            return;
          }

          const plRef = doc(db, 'users', user.uid, 'playlists', playlistId);
          const snap = await getDoc(plRef);
          const data = snap.exists() ? snap.data() : null;
          console.debug('HomeView: playlist document fetched', { exists: snap.exists(), songsCount: data && Array.isArray(data.songs) ? data.songs.length : 0 });
          if (data && Array.isArray(data.songs)) {
            const updated = data.songs.filter(s => s.id !== songId);
            await updateDoc(plRef, { songs: updated });
            // keep the modal's in-memory songs list in sync so reopening/closing
            // doesn't show the deleted item again
            try {
              const idx = (songs || []).findIndex(s => s.id === songId);
              if (idx !== -1) songs.splice(idx, 1);
              try { console.debug('HomeView: modal songs array updated', { playlistId, songId, songsLength: (songs || []).length, time: Date.now() }); } catch (err) { /* ignore */ }
            } catch (e) { /* ignore */ }
            // notify other components if they want to refresh (optional)
            try { window.dispatchEvent(new CustomEvent('playlist:updated', { detail: { playlistId } })); } catch (e) { /* ignore */ }
            this.showToast('Brano rimosso dalla playlist.', 'info');
          } else {
            this.showToast('Playlist non trovata o formato inatteso.', 'warning');
          }
        } else {
          const favRef = doc(db, 'users', user.uid, 'favorites', songId);
          await deleteDoc(favRef);
          // remove from the local array so the modal state is consistent
          try {
            const idx = (songs || []).findIndex(s => s.id === songId);
            if (idx !== -1) songs.splice(idx, 1);
            window.dispatchEvent(new CustomEvent('favorites:updated', { detail: {} }));
          } catch (e) { /* ignore */ }
          this.showToast('Brano rimosso.', 'info');
        }

        // remove the visual card safely: find the closest .card then its column wrapper
        const cardEl = btn.closest('.card');
        let col = null;
        if (cardEl) col = cardEl.closest('[class*="col-"]');
        if (!col) col = btn.closest('.col-12, .col-md-4, .col-sm-6, .col-lg-3');
        if (col) {
          try { console.debug('HomeView: removing card element from DOM for song', { songId, time: Date.now() }); } catch (err) { /* ignore */ }
          col.remove();
        }
      } catch (err) {
        console.error('Errore durante la rimozione:', err);
        this.showToast(`Errore durante la rimozione del brano: ${err?.message || ''}`, 'error');
        btn.disabled = false;
      }
    });

    // Gestione audio
    const originalOverflow = content.style.overflowY;
    const audios = content.querySelectorAll(".song-preview");

    audios.forEach((audio) => {
      audio.addEventListener("play", () => {
        content.style.overflowY = "visible";
        audios.forEach((other) => {
          if (other !== audio) other.pause();
        });
      });
      const restoreOverflow = () =>
        (content.style.overflowY = originalOverflow || "auto");
      audio.addEventListener("pause", restoreOverflow);
      audio.addEventListener("ended", restoreOverflow);

      ["click", "pointerdown", "mousedown"].forEach((ev) =>
        audio.addEventListener(ev, (e) => e.stopPropagation())
      );
    });

    // Gestione click sulle card
    content.querySelectorAll(".song-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("audio") || e.target.closest("button")) return;
        try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
        try { e.stopPropagation(); } catch (err) { /* ignore */ }
        try { e.preventDefault(); } catch (err) { /* ignore */ }
        const index = Number(card.dataset.index);
        const song = songs[index];
        if (!song) return;

        if (typeof this._songClickHandler === "function") {
          try {
            this._songClickHandler(song);
          } catch (err) {
            console.error("songClick handler error", err);
          }
          try { this.suppressClicks(350); } catch (err) { /* ignore */ }
          try { console.debug('HomeView: songCard click handler firing, composedPath:', { path: (e.composedPath && e.composedPath()) || (e.path || []), time: Date.now(), suppressFlag: !!window.__suppressClicks, blocker: !!document.getElementById('__click_blocker') }); } catch (err) { /* ignore */ }
          modal.remove();
        } else if (song.id) {
          window.location.href = `#/song?id=${encodeURIComponent(song.id)}`;
        }
      });
    });
  }

  showCreatePlaylistModal(onConfirm) {
    const modal = document.createElement("div");
    modal.className = "playlist-modal";

    const content = document.createElement("div");
    content.className = "playlist-modal-content card p-3";
    Object.assign(content.style, {
      maxWidth: "400px",
      width: "100%",
      borderRadius: "12px",
      textAlign: "center",
    });

    content.innerHTML = `
    <h5 class="mb-3">Crea nuova playlist</h5>
    <input id="playlistNameInput" class="form-control mb-3" type="text" placeholder="Nome playlist" />
    <div class="d-flex justify-content-end gap-2">
      <button id="cancelBtn" class="btn btn-secondary">Annulla</button>
      <button id="createBtn" class="btn btn-primary">Crea</button>
    </div>
  `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const input = content.querySelector("#playlistNameInput");
    const btnCreate = content.querySelector("#createBtn");
    const btnCancel = content.querySelector("#cancelBtn");

    const closeModal = () => modal.remove();

    btnCancel.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    btnCreate.addEventListener("click", () => {
      const name = input.value.trim();
      closeModal();
      if (typeof onConfirm === "function") onConfirm(name);
    });

    input.focus();
  }


  renderSpotifyHome(favorites = [], playlists = [], recommended = []) {
    if (!this.results) return;
    this.results.innerHTML = "";

    const container = document.createElement("div");
    container.className = "spotify-home";

    const createRow = (items, type) => {
      const section = document.createElement("div");
      section.className = "home-section";

      const titleMap = {
        playlists: "Le tue playlist",
        favorites: "I tuoi preferiti",
        recommended: "Consigliati per te",
      };
      section.innerHTML = `<h5>${titleMap[type]}</h5>`;

      const row = document.createElement("div");
      row.className = "cards-row";

      // Card “Crea playlist”
      if (type === "playlists") {
        const addCard = document.createElement("div");
        addCard.className = "playlist-card create-card";
        addCard.textContent = "Crea playlist";
        addCard.addEventListener("click", () => {
          this.playlistController.handleCreatePlaylist();
        });
        row.appendChild(addCard);
      }

      if (items.length === 0) {
        // Placeholder se non ci sono canzoni/playlist
        const placeholder = document.createElement("div");
        placeholder.className = "placeholder-card text-muted";
        placeholder.textContent = type === "recommended"
          ? "Nessun consiglio disponibile al momento"
          : "Nessun elemento da mostrare";
        row.appendChild(placeholder);
      } else {
        items.forEach((item) => {
          const card = document.createElement("div");
          card.className = type === "playlists" ? "playlist-card" : "song-card";

          if (type === "playlists") {
            // expose playlist id on the card so capture-phase handlers can locate it
            card.dataset.playlistId = item.id || '';
            card.innerHTML = `
            <div class="song-artwork-wrapper">
              <div class="song-artwork" style="background-image:url('${item.songs?.[0]?.artwork || "assets/img/avatar-placeholder.svg"}');"></div>
            </div>
            <div class="text-truncate fw-semibold mt-1">${item.name}</div>
            <small>${(item.songs || []).length} brani</small>
            <button onclick="event.stopPropagation()" class="btn btn-sm btn-danger playlist-trash-btn" data-playlist-id="${item.id || ''}" title="Elimina playlist">🗑</button>
          `;
            card.addEventListener("click", (e) => {
              // Safely detect clicks on interactive controls (trash button, audio, buttons)
              try {
                const isInteractive = (e.target && typeof e.target.closest === 'function')
                  && Boolean(e.target.closest('.playlist-trash-btn') || e.target.closest('button') || e.target.closest('audio') || e.target.closest('a'));
                if (isInteractive) return;
              } catch (err) {
                // If something goes wrong detecting the target, avoid opening the modal
                console.warn('HomeView: error detecting click target on playlist card', err);
                return;
              }

              this.showSongsModal(item.name, item.songs || [], item.id, false);
            });
          } else {
            card.innerHTML = `
                        <div class="song-artwork-wrapper">
                            <div class="song-artwork" 
                                style="background-image:url('${item.artwork || "assets/img/avatar-placeholder.svg"}'); border-radius: 50%;"></div>
                        </div>
                        <div class="text-truncate fw-semibold mt-1">${item.title}</div>
                        <small>${item.artist || ""}</small>
                        ${item.preview
                ? `<audio class="song-preview" controls preload="none" src="${item.preview}"></audio>`
                : `<div class="text-muted small">Preview non disponibile</div>`}
                    `;
          }
          row.appendChild(card);
          // Attach single-item modal only for song items (not for playlist cards)
          if (type !== "playlists") {
            card.addEventListener("click", (e) => {
              if (e.target.closest("audio") || e.target.closest("button")) return;
              this.showSongsModal(item.title, [item], null, true);
            });
          } else {
            // For playlist cards: attach the trash handler to the button and
            // attach the "open playlist" handler only to specific clickable
            // elements (artwork and title). This prevents the trash button
            // click from ever opening the playlist.
            const trashBtn = card.querySelector('.playlist-trash-btn');
            if (trashBtn) {
              console.log('HomeView: playlist trash button found for', { id: trashBtn.dataset.playlistId });
            } else {
              // If no trashBtn was found (unexpected), log for debugging
              console.warn('HomeView: expected .playlist-trash-btn not found for playlist card', { itemId: item.id });
            }

            // Attach open handlers on artwork and title only
            const art = card.querySelector('.song-artwork-wrapper');
            const titleEl = card.querySelector('.text-truncate');
            const openHandler = (e) => {
              try {
                const blocked = !!window.__suppressClicks || !!document.getElementById('__click_blocker') || !!window.__modalOpen;
                if (blocked) {
                  try { console.debug('HomeView: playlist openHandler suppressed', { itemId: item.id, blocked, time: Date.now(), path: (e.composedPath && e.composedPath()) || (e.path || []) }); } catch (err) { /* ignore */ }
                  return;
                }
                if (e.target.closest && e.target.closest('.playlist-trash-btn')) return;
              } catch (err) { return; }
              try { console.debug('HomeView: playlist openHandler executing', { itemId: item.id, time: Date.now(), path: (e.composedPath && e.composedPath()) || (e.path || []) }); } catch (err) { /* ignore */ }
              this.showSongsModal(item.name, item.songs || [], item.id, false);
            };
            if (art) art.addEventListener('click', openHandler);
            if (titleEl) titleEl.addEventListener('click', openHandler);
          }

        });

        
      }

      section.appendChild(row);
      return section;
    };

    // Render playlists, favorites e consigliati
    // For playlists we attach a capture-phase click handler (like favorites)
    // so clicks on the playlists "folder" open the full playlists view instead
    // of letting card-level handlers run (prevents click fall-through after modal close).
    const playSection = createRow(playlists, "playlists");
    // Clicking the playlists area from home should open the playlist that was clicked.
    // If the click is on a specific playlist card, open that playlist; otherwise
    // fall back to opening the first playlist (if present).
    playSection.addEventListener('click', (e) => {
      try {
        if (window.__suppressClicks || window.__modalOpen) return;
        // allow interactive elements and the create-card to work
        if (e.target.closest && e.target.closest('button, a, audio')) return;
        // If user clicked the "Crea playlist" card, forward to controller
        const createCard = e.target && typeof e.target.closest === 'function' ? e.target.closest('.create-card') : null;
        if (createCard) {
          try { this.playlistController?.handleCreatePlaylist(); } catch (err) { console.error('Errore creazione playlist', err); }
          return;
        }
        try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
        try { e.stopPropagation(); } catch (err) { /* ignore */ }

        // If clicked on a specific playlist card, open that playlist
        const card = e.target && typeof e.target.closest === 'function' ? e.target.closest('.playlist-card') : null;
        if (card) {
          // ignore clicks explicitly on the trash button
          if (e.target.closest && e.target.closest('.playlist-trash-btn')) return;
          const pid = card.dataset.playlistId;
          if (pid) {
            const pl = (playlists || []).find(p => String(p.id) === String(pid));
            if (pl) {
              try { this.showSongsModal(pl.name || 'Playlist', pl.songs || [], pl.id, false); } catch (err) { console.error('Errore apertura playlist cliccata', err); }
              return;
            }
          }
        }

        // fallback: open first playlist if any
        if (!playlists || playlists.length === 0) return;
        const first = playlists[0];
        try { this.showSongsModal(first.name || 'Playlist', first.songs || [], first.id, false); } catch (err) { console.error('Errore apertura prima playlist', err); }
      } catch (err) { /* ignore */ }
    }, { capture: true });
    container.appendChild(playSection);
    // make favorites section clickable to open a modal with all favorites
    const favSection = createRow(favorites, "favorites");
    // Prefer to intercept the click in capture phase so we open the
    // full favorites modal instead of letting card-level handlers open
    // single-item modals. We stop propagation so card handlers don't run.
    favSection.addEventListener('click', (e) => {
      try {
        // ignore if suppression or another modal is open
        if (window.__suppressClicks || window.__modalOpen) return;
        // ignore clicks on interactive elements inside the section
        if (e.target.closest && e.target.closest('button, a, audio')) return;
        // prevent underlying card click handlers from firing
        try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
        try { e.stopPropagation(); } catch (err) { /* ignore */ }
        this.showSongsModal('I tuoi preferiti', favorites);
      } catch (err) { /* ignore */ }
    }, { capture: true });
    container.appendChild(favSection);
    container.appendChild(createRow(recommended, "recommended")); // sempre renderizzata

    this.results.appendChild(container);

    // Debug capture: temporary listener to trace pointer events that may fall
    // through when modals close. Logs fav/playlist/open targets and suppression.
    document.addEventListener('pointerdown', (e) => {
      try {
        const isFavBtn = e.target.closest && e.target.closest('.fav-btn');
        const isPlaylistBtn = e.target.closest && e.target.closest('.playlist-btn');
        const isPlaylistCard = e.target.closest && e.target.closest('.playlist-card');
        const isSongCard = e.target.closest && e.target.closest('.song-card');
        const info = {
          type: e.type,
          eventPhase: e.eventPhase,
          targetTag: e.target && e.target.tagName,
          isFavBtn: !!isFavBtn,
          isPlaylistBtn: !!isPlaylistBtn,
          isPlaylistCard: !!isPlaylistCard,
          isSongCard: !!isSongCard,
          suppressFlag: !!window.__suppressClicks,
          timestamp: Date.now()
        };
        if (isFavBtn || isPlaylistBtn || isPlaylistCard || isSongCard) {
          try { console.debug('DEBUG POINTERDOWN:', info, { target: e.target }); } catch (err) { /* ignore */ }
        }
      } catch (err) { /* ignore */ }
    }, { capture: true }); // capture phase

    // Capture-phase delegated handler: handle playlist deletion before any
    // other handlers (prevents card opening). Runs in capture phase.
    container.addEventListener('click', async (e) => {
      try {
        const btn = e.target.closest && e.target.closest('.playlist-trash-btn');
        if (!btn) return;
        // prevent other handlers from running
        try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
        try { e.stopPropagation?.(); } catch (err) { /* ignore */ }
        try { e.preventDefault?.(); } catch (err) { /* ignore */ }

        const playlistId = btn.dataset.playlistId;
        console.log('HomeView (capture): playlist trash clicked', { playlistId });
        if (!playlistId) {
          this.showToast('ID playlist mancante. Impossibile eliminare.', 'error');
          return;
        }

        const confirmed = await this.showConfirmModal('Sei sicuro di voler eliminare questa playlist? Questa operazione non è reversibile.');
        if (!confirmed) return;

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) { this.showToast('Devi effettuare il login per eliminare playlist.', 'warning'); return; }

        btn.disabled = true;
        try {
          const plRef = doc(db, 'users', user.uid, 'playlists', playlistId);
          await deleteDoc(plRef);
          this.showToast('Playlist eliminata.', 'info');
          const card = btn.closest('.playlist-card');
          if (card) card.remove();
        } catch (err) {
          console.error('Errore eliminazione playlist (capture handler):', err);
          this.showToast('Errore durante l\'eliminazione della playlist.', 'error');
          btn.disabled = false;
        }
      } catch (err) { /* ignore */ }
    }, true);

    // NOTE: per-card trash handlers are attached directly when creating each playlist card
    // to ensure clicks on the trash button don't accidentally bubble and open the playlist.
  }

  // Small confirm modal that returns a Promise<boolean>
  showConfirmModal(message) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'playlist-modal';

      const content = document.createElement('div');
      content.className = 'playlist-modal-content card p-3';
      Object.assign(content.style, {
        maxWidth: '420px',
        width: '100%',
        borderRadius: '12px',
        textAlign: 'center'
      });

      content.innerHTML = `
        <h5 class="mb-3">Conferma eliminazione</h5>
        <p class="text-muted small">${message}</p>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <button id="confirmCancel" class="btn btn-secondary">Annulla</button>
          <button id="confirmOk" class="btn btn-danger">Elimina</button>
        </div>
      `;

      modal.appendChild(content);
      document.body.appendChild(modal);

      const btnOk = content.querySelector('#confirmOk');
      const btnCancel = content.querySelector('#confirmCancel');

      const cleanup = (val) => { modal.remove(); resolve(val); };

      btnCancel.addEventListener('click', (e) => {
        try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
        try { e.stopPropagation(); } catch (err) { /* ignore */ }
        try { e.preventDefault(); } catch (err) { /* ignore */ }
        cleanup(false);
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
          try { e.stopPropagation(); } catch (err) { /* ignore */ }
          try { e.preventDefault(); } catch (err) { /* ignore */ }
          cleanup(false);
        }
      }, { capture: true });
      btnOk.addEventListener('click', (e) => {
        try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
        try { e.stopPropagation(); } catch (err) { /* ignore */ }
        try { e.preventDefault(); } catch (err) { /* ignore */ }
        cleanup(true);
      });
      // focus the cancel to avoid accidental deletes
      btnCancel.focus();
    });
  }


  showToast(message, type = "info") {
    document.querySelectorAll(".custom-toast").forEach(t => t.remove());
    const toast = document.createElement("div");
    toast.className = `custom-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 3000);
  }

  renderOnlySection(type, items = []) {
  const homeContainer = document.getElementById("home-container");
  const resultsSection = document.getElementById("results-section");
  if (homeContainer) homeContainer.style.display = "block";
  if (resultsSection) resultsSection.style.display = "none";

  if (!this.results) return;
  this.results.innerHTML = "";

  const container = document.createElement("div");
  container.className = "spotify-home";

  const section = document.createElement("div");
  section.className = "home-section";

  const titleMap = {
    playlists: "Le tue playlist",
    favorites: "I tuoi preferiti",
  };

  section.innerHTML = `<h5>${titleMap[type] || "Sezione"}</h5>`;

  const row = document.createElement("div");
  row.className = (type === "favorites" || type === "playlists") 
    ? "cards-row grid-layout" 
    : "cards-row";

  // 🔹 Se è la sezione playlist → aggiungi la card "Crea playlist"
  if (type === "playlists") {
    const addCard = document.createElement("div");
    addCard.className = "playlist-card create-card";
    addCard.innerHTML = `<div class="fw-semibold mt-2">Crea playlist</div>`;
    addCard.addEventListener("click", () => {
      this.playlistController?.handleCreatePlaylist();
    });
    row.appendChild(addCard);
  }

  if (!items || items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "text-muted placeholder-card";
    empty.textContent = "Nessun elemento da mostrare";
    row.appendChild(empty);
  } else {
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = type === "playlists" ? "playlist-card" : "song-card";

        if (type === "playlists") {
        card.innerHTML = `
          <div class="song-artwork-wrapper">
            <div class="song-artwork" style="background-image:url('${
              item.songs?.[0]?.artwork || "assets/img/avatar-placeholder.svg"
            }');"></div>
          </div>
          <div class="text-truncate fw-semibold mt-1">${item.name}</div>
          <small>${(item.songs || []).length} brani</small>
        `;
  // expose playlist id on the card so capture-phase handlers can locate it
  card.dataset.playlistId = item.id || '';
  // add trash button to allow deleting playlist from this view as well
        const trashHtml = `<button onclick="event.stopPropagation()" class="btn btn-sm btn-danger playlist-trash-btn" data-playlist-id="${item.id || ''}" title="Elimina playlist">🗑</button>`;
        card.insertAdjacentHTML('beforeend', trashHtml);

        card.addEventListener("click", () => {
          this.showSongsModal(item.name, item.songs || [], item.id, false);
        });
      } else if (type === "favorites") {
        card.innerHTML = `
          <div class="song-artwork-wrapper">
            <div class="song-artwork" style="background-image:url('${
              item.artwork || "assets/img/avatar-placeholder.svg"
            }'); border-radius:50%;"></div>
          </div>
          <div class="text-truncate fw-semibold mt-1">${item.title}</div>
          <small>${item.artist || ""}</small>
          ${
            item.preview
              ? `<audio class="song-preview" controls preload="none" src="${item.preview}"></audio>`
              : `<div class="text-muted small">Preview non disponibile</div>`
          }
        `;
        // add a trash button for favorites in the single-section view
        const favTrash = `<div class="d-flex justify-content-center mt-2"><button onclick="event.stopPropagation()" class="btn btn-sm btn-danger fav-trash-btn" data-song-id="${item.id || ''}" title="Rimuovi dai preferiti">🗑</button></div>`;
        card.insertAdjacentHTML('beforeend', favTrash);
      }

      row.appendChild(card);
    });
  }

  section.appendChild(row);
  container.appendChild(section);
  this.results.innerHTML = ""; // pulisci prima
  this.results.appendChild(container);

  // Capture-phase delegated handler for playlist deletion in the single-section view
  container.addEventListener('click', async (e) => {
    try {
      const btn = e.target.closest && e.target.closest('.playlist-trash-btn');
      if (!btn) return;
      try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
      try { e.stopPropagation(); } catch (err) { /* ignore */ }
      try { e.preventDefault(); } catch (err) { /* ignore */ }

      const playlistId = btn.dataset.playlistId;
      if (!playlistId) {
        this.showToast('ID playlist mancante. Impossibile eliminare.', 'error');
        return;
      }

      const confirmed = await this.showConfirmModal('Sei sicuro di voler eliminare questa playlist? Questa operazione non è reversibile.');
      if (!confirmed) return;

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) { this.showToast('Devi effettuare il login per eliminare playlist.', 'warning'); return; }

      btn.disabled = true;
      try {
        const plRef = doc(db, 'users', user.uid, 'playlists', playlistId);
        await deleteDoc(plRef);
        this.showToast('Playlist eliminata.', 'info');
        const card = btn.closest('.playlist-card');
        if (card) card.remove();
      } catch (err) {
        console.error('Errore eliminazione playlist (single-section handler):', err);
        this.showToast('Errore durante l\'eliminazione della playlist.', 'error');
        btn.disabled = false;
      }
    } catch (err) { /* ignore */ }
  }, true);

  // Capture-phase delegated handler for favorites deletion in the single-section view
  container.addEventListener('click', async (e) => {
    try {
      const btn = e.target.closest && e.target.closest('.fav-trash-btn');
      if (!btn) return;
      try { e.stopImmediatePropagation?.(); } catch (err) { /* ignore */ }
      try { e.stopPropagation(); } catch (err) { /* ignore */ }
      try { e.preventDefault(); } catch (err) { /* ignore */ }

      const songId = btn.dataset.songId;
      if (!songId) {
        this.showToast('ID brano mancante. Impossibile rimuovere.', 'error');
        return;
      }

      const confirmed = await this.showConfirmModal('Rimuovere questo brano dai preferiti?');
      if (!confirmed) return;

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) { this.showToast('Devi effettuare il login per rimuovere preferiti.', 'warning'); return; }

      btn.disabled = true;
      try {
        const favRef = doc(db, 'users', user.uid, 'favorites', songId);
        await deleteDoc(favRef);
        this.showToast('Brano rimosso dai preferiti.', 'info');
        const card = btn.closest('.song-card') || btn.closest('.col-md-4');
        if (card) card.remove();
      } catch (err) {
        console.error('Errore rimozione preferito (single-section handler):', err);
        this.showToast('Errore durante la rimozione del preferito.', 'error');
        btn.disabled = false;
      }
    } catch (err) { /* ignore */ }
  }, true);

  requestAnimationFrame(() => {
    const home = document.querySelector(".spotify-home");
    if (home && !home.classList.contains("loaded")) home.classList.add("loaded");
    window.dispatchEvent(new Event("resize"));
  });
}   
  
}
