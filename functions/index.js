const functions = require("firebase-functions");
const fetch = require("node-fetch");

// Proxy MusicBrainz
exports.searchArtist = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Parametro 'q' mancante" });

  try {
    const response = await fetch(`https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(query)}&fmt=json`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Errore chiamata MusicBrainz" });
  }
});

// Proxy iTunes
exports.searchItunes = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  const term = req.query.term;
  if (!term) return res.status(400).json({ error: "Parametro 'term' mancante" });

  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=5`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Errore chiamata iTunes" });
  }
});
