export default class Playlist {
    constructor(name) {
        this.name = name;
        this.songs = [];
    }

    addSong(song) {
        this.songs.push(song);
    }
    removeSong(songId) {
        this.songs = this.songs.filter(song => song.id !== songId);
    }
    getSongs() {
        return this.songs;
    }
}