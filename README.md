# LoudCat

**LoudCat** è un'applicazione web client-side per esplorare, organizzare e condividere musica. Utilizza l'API di iTunes per la ricerca di brani, album e artisti, e Firebase per l'autenticazione e la gestione dei dati utente
(e il gatto è effettivamente rumoroso).

---

## Funzionalità principali

- **Ricerca musicale**: Cerca brani, album e artisti tramite l'integrazione con iTunes
- **Gestione preferiti**: Salva i tuoi brani preferiti e accedi rapidamente alla tua collezione
- **Playlist personalizzate**: Crea e gestisci playlist per organizzare la tua musica
- **Anteprime audio**: Ascolta snippet di 30 secondi direttamente nel browser
- **Condivisione**: Condividi brani con altri utenti registrati
- **Profili artista**: Esplora informazioni dettagliate su artisti e le loro discografie tramite MusicBrainz
- **Recensioni album**: Lascia recensioni e valutazioni sugli album

---

## Tecnologie utilizzate

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3
- **Framework CSS**: Bootstrap 5
- **Backend/Database**: Firebase (Authentication, Firestore, Storage)
- **API esterne**: 
  - iTunes Search API (ricerca musicale)
  - MusicBrainz API (profili artista)
- **Pattern architetturale**: MVC (Model-View-Controller)

---

## Struttura del progetto

```
LoudCat/
├── index.html              # Entry point dell'applicazione
├── assets/
│   ├── css/
│   │   └── style.css       # Stili personalizzati
│   ├── img/                # Immagini e icone
│   └── logo/               # Logo dell'applicazione
├── src/
│   ├── main.js             # Bootstrap dell'applicazione
│   ├── firebase.js         # Configurazione Firebase
│   ├── controller/         # Logica di controllo (MVC)
│   ├── model/              # Modelli dati
│   ├── view/               # Componenti UI
│   └── services/           # Servizi per API esterne
├── firebase.json           # Configurazione Firebase Hosting
└── README.md
```



## Regole di sicurezza Firestore

Per permettere il corretto funzionamento dell'app, configura le seguenti regole su Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utenti: lettura pubblica, scrittura solo per l'utente proprietario
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Preferiti e playlist: accesso privato
      match /favorites/{favId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /playlists/{playlistId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /shared/{shareId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Ricerche: lettura pubblica, scrittura autenticata
    match /searches/{searchId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Condivisioni: lettura e scrittura per utenti autenticati
    match /shares/{shareId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Utilizzo

### Per utenti non registrati
- Esplora la home page con le funzionalità principali
- Effettua ricerche musicali
- Visualizza profili artista

### Per utenti registrati
- **Registrati** o **Accedi** tramite il pulsante nell'header
- Salva brani nei **preferiti**
- Crea **playlist** personalizzate
- Condividi brani con altri utenti
- Lascia **recensioni** sugli album
- Gestisci il tuo profilo nella sezione **Account**

---


