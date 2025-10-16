export default class Album { 
    constructor({ id, title, artist, releaseDate, coverImage, tracks }) {
        this.id = id;
        this.title = title;
        this.artist = artist;
        this.releaseDate = releaseDate;
        this.coverImage = coverImage;
        this.tracks = tracks || [];
    }
    addTrack(track) {
        this.tracks.push(track);
    }
    getTracks() {
        return this.tracks;
    }
    getTitle() {
        return this.title;
    }
    getArtist() {
        return this.artist;
    }   
    getReleaseDate() {
        return this.releaseDate;
    }
    getCoverImage() {
        return this.coverImage;
    }
}