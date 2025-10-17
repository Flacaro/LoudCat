## LoudCat — AI coding assistant guidance

Short, actionable directions to help an automated coding agent be productive in this codebase.

- Big picture
  - Front-end only, single-page web app written in vanilla ES modules (no bundler). Entry point: `src/main.js`.
  - Pattern: lightweight MVC. Models in `src/model/*`, Views in `src/view/*`, Controllers in `src/controller/*`, and services that wrap remote requests in `src/services/*`.
  - Firebase is used for auth, Firestore and Storage. Initialization is in `src/firebase.js`. The app runs in the browser as ES modules and imports Firebase from the CDN.

- Important files to reference
  - `src/main.js` — app bootstrap: constructs `MusicService`, `MusicView`, `MusicController` and initializes auth UI bindings.
  - `src/services/apiService.js` — low-level API calls (iTunes). Use these helpers for network logic and to mirror request/response shapes.
  - `src/services/musicService.js` — converts raw API responses into Model instances used by the controllers/views.
  - `src/controller/musicController.js` — orchestrates view bindings, Firestore reads/writes, favorites/playlists sharing behavior. Many UX flows live here.
  - `src/view/musicView.js` and `src/view/header.js` — DOM rendering and event binding patterns. Views expect controllers to provide handlers via `bind*` methods.

- Conventions & patterns (project-specific)
  - Vanilla ES module imports (relative paths). No bundler or transpiler: keep code ES2020+ compatible for modern browsers.
  - Views expose `bindX(handler)` methods and then call handler references stored on the view (e.g., `this.favHandler`) — follow this pattern when adding new interactions.
  - Services return plain JS objects or Model instances (see `MusicService` mapping to `Song`, `Album`, `Artist` classes in `src/model/`). Keep transformation logic inside services, not controllers.
  - Firestore usage is in controllers and model helpers; keys and collection layout are discoverable in `musicController.js` and `authController.js`. Examples:
    - Searches saved at `searches/latest` (doc id `latest`).
    - Users documents live under `users/{uid}`; favorites are a subcollection `users/{uid}/favorites` and playlists are stored either as a field on the user doc (`playlists`) or as `users/{uid}/playlists/{playlistId}` in some flows.
  - Firebase CDN imports: do not change to NPM package imports without updating runtime (the app expects browser CDN URLs).

- Data shapes (examples)
  - Song used in views: { id, title, artist, album, artwork, preview }
    - In `musicView.renderSongs()` songs are encoded into `data-song` attributes via `encodeURIComponent(JSON.stringify(song))` — preserve JSON-serializable fields and avoid circular references.
  - Album object returned by `fetchAlbums()` contains `collectionId`, `title`, `artist`, `artwork`, `trackCount`, etc. `albumId` is `collectionId` used for lookup via `fetchTracksByAlbum`.

- Typical change patterns and safe edits
  - When adding a new UI action: add a `bindNewAction(handler)` in the relevant view, call it from controller constructor/init, and implement the handler in the controller. Follow existing naming and event-attachment style.
  - When modifying API behavior, prefer changes in `src/services/apiService.js` or `src/services/musicService.js` so controllers/view code can remain unchanged.
  - For Firestore schema changes, update both `authController.js` and `musicController.js` where reads/writes occur; preserve backwards-compatible merges (use `{ merge: true }` when possible).

- Debugging & quick-run notes
  - The app is static and intended to be opened from a local webserver or via GitHub Pages. To test locally run a static server (e.g., `npx http-server` or VS Code Live Server). Keep in mind Firebase CDN imports require an HTTP(S) origin (file:// won't work).
  - Console logs are used liberally for debug; follow existing patterns (console.warn/console.error) when surfacing errors.

- What not to change without confirmation
  - Replacing CDN Firebase imports with package-managed imports or moving to a bundler — this changes runtime expectations. Propose such migrations in a PR and include a migration plan and test steps.
  - Changing user document keying strategy (uid vs normalized email) without checking `authController.js` and `musicController.js` flows — both locations have assumptions about how users are looked up.

- Examples to cite in PRs
  - Add a new album details panel: use `musicView.bindAlbumClick()` + `MusicController.handleAlbumClick()` + `MusicService.getAlbumTracks()` (see `musicController.js` and `apiService.fetchTracksByAlbum`).
  - Persisting latest search: see `handleSearch()` in `musicController.js` which writes `searches/latest`.

- Minimal acceptance criteria for agent changes
  - Preserve browser ES module imports and avoid introducing server-side build steps unless requested.
  - Keep mutations to Firestore schema localized and backwards-compatible where possible.
  - UI handlers must be wired through `bind*` methods on views to keep separation of concerns.

If any section is unclear or you'd like more examples (tests, linting, or CI), tell me which area to expand and I'll iterate.
