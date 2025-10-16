export default class User {
    constructor(id, username, email, img) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.img = img;
        this.playlists = [];
    }
    addPlaylist(playlist) {
        this.playlists.push(playlist);
    }
    getPlaylists() {
        return this.playlists;
    }  
    getUsername() {
        return this.username;
    }
    getEmail() {
        return this.email;
    }
    getImg() {
        return this.img;
    }
}