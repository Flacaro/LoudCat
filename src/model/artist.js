export default class Artist {
  constructor({
    id,
    name,
    country = "Unknown",
    type = "Unknown",
    disambiguation = "",
    picture = "assets/img/avatar-placeholder.svg",
    fans = 0,
    nb_album = 0,
    albums = [],
    bio = "",
    links = []
  }) {
    this.id = id;
    this.name = name;
    this.country = country;
    this.type = type;
    this.disambiguation = disambiguation;
    this.picture = picture; // ✅ match what views use
    this.fans = fans;
    this.nb_album = nb_album;
    this.albums = albums;
    this.bio = bio;
    this.links = links;
  }
}
