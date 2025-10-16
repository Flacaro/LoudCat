export default class Song {
  constructor({ id, title, artist, album, duration, preview, artwork}) {
    this.id = id;
    this.title = title;
    this.artist = artist;
    this.album = album;
    this.duration = duration;
    this.preview = preview;
    this.artwork = artwork;
    
}

playPreview() {
    const audio = new Audio(this.preview);
    audio.play();
  }
}