// authController.js
import { register, login, logout, onUserChanged, saveUserData, loadUserData } from "../model/modelAuth.js";
import { getEmail, getPassword, getUsername, showUserUI, showLoginUI, renderData } from "../view/header.js";

//inizializza e gestisce tutta la logica di autenticazione Firebase
export function initFirebaseAuth(controller) {

  //controlla che sia stato passato un controller valido
  if (!controller) {
    console.error("AuthController: controller non fornito!");
    return;
  }

  //Listener per i cambiamenti dello stato dell'utente (login/logout)
  //`onUserChanged` è una funzione del modello che osserva Firebase Authentication, chiamato 
  //ogni volta che l'utente si logga o si disconnette
  onUserChanged(async (user) => {
    const homeContainer = document.getElementById("home-container");
    const resultsContainer = document.getElementById("results-section");

    if (user) {
      //se l'utente è autenticato, mostra l'interfaccia personalizzata
      showUserUI(user.email);
      console.log("Utente autenticato:", user.email);

      //rimuove eventuale schermata di benvenuto
      if (controller.welcomeView) {
        controller.welcomeView.clear();
      }

      //carica le collezioni personali dell'utente (preferiti, playlist, ecc.)
      if (controller.userController) {
        const { favorites, playlists } = await controller.userController.loadUserCollections(user.uid);
        controller.userController.renderUserCollections({ favorites, playlists }, controller.view);
      }

      //mostra la home e nasconde la sezione risultati
      if (homeContainer) homeContainer.style.display = "block";
      if (resultsContainer) resultsContainer.style.display = "none";

      // Carica la home personalizzata (assicura che i nuovi utenti vedano la welcome personalizzata)
      try {
        if (controller && typeof controller.loadHome === 'function') {
          await controller.loadHome();
        }
      } catch (e) {
        console.warn('Impossibile caricare la home dopo il cambio di stato utente:', e);
      }

    } else {
      //se l'utente è disconnesso, mostra la schermata di login
      showLoginUI();
      console.log("Nessun utente autenticato");

      //svuota eventuali risultati della home view personale
      if (controller.homeView && controller.homeView.results) {
        controller.homeView.results.innerHTML = "";
      }

      //mostra il container home e nasconde risultati
      if (homeContainer) {
        homeContainer.innerHTML = ""; // Pulisce completamente il contenitore
        homeContainer.style.display = "block";
      }
      if (resultsContainer) {
        resultsContainer.style.display = "none";
      }

      //renderizza la welcome view per utenti non autenticati
      if (controller.welcomeView) {
        controller.welcomeView.render();
      }
    }
  });

  //valida l'email inserita nella registrazione
  function isValidEmail(email) {
    return typeof email === "string" && /\S+@\S+\.\S+/.test(email);
  }

  //trasforma gli errori in messaggi leggibili
  function userMessageForFirebaseError(err) {
    if (!err || !err.code) return err && err.message ? err.message : "Errore sconosciuto";
    switch (err.code) {
      case "auth/invalid-email":
        return "Email non valida. Inserisci un indirizzo email corretto.";
      case "auth/email-already-in-use":
        return "Questa email è già registrata.";
      case "auth/weak-password":
        return "Password troppo debole. Inserisci almeno 6 caratteri.";
      case "auth/wrong-password":
        return "Password errata.";
      case "auth/user-not-found":
        return "Utente non trovato.";
      default:
        return err.message || err.code;
    }
  }

  //selezione degli elementi dell'interfaccia per il modulo di login/registrazione
  const registerBtnEl = document.getElementById("registerBtn");
  const loginBtnEl = document.getElementById("loginBtn");
  const authSection = document.getElementById("auth");
  const registerFields = document.getElementById("registerFields");
  const confirmRegisterBtn = document.getElementById("confirmRegisterBtn");
  const confirmLoginBtn = document.getElementById("confirmLoginBtn");
  const cancelAuthBtn = document.getElementById("cancelAuthBtn");

  //mostra il form di registrazione
  registerBtnEl?.addEventListener("click", () => {
    if (authSection) authSection.style.display = "block";
    if (registerFields) registerFields.style.display = "block";
    if (confirmRegisterBtn) confirmRegisterBtn.style.display = "inline-block";
    if (confirmLoginBtn) confirmLoginBtn.style.display = "none";
  });

  //mostra il form di login
  loginBtnEl?.addEventListener("click", () => {
    if (authSection) authSection.style.display = "block";
    if (registerFields) registerFields.style.display = "none";
    if (confirmRegisterBtn) confirmRegisterBtn.style.display = "none";
    if (confirmLoginBtn) confirmLoginBtn.style.display = "inline-block";
  });

  //nasconde la sezione di autenticazione (quando si preme "Annulla")
  cancelAuthBtn?.addEventListener("click", () => {
    if (authSection) authSection.style.display = "none";
  });

  //gestisce la registrazione utente (email + password + username)
  confirmRegisterBtn?.addEventListener("click", async () => {
    if (!confirmRegisterBtn) return;

    try {
      const email = getEmail();
      const pass = getPassword();
      if (!email || !pass) { alert("Inserisci email e password."); return; }
      if (!isValidEmail(email)) { alert("Formato email non valido."); return; }
      if (pass.length < 6) { alert("La password deve avere almeno 6 caratteri."); return; }

      const username = getUsername ? getUsername() : null;

      //disabilita il bottone per evitare registrazioni multiple
      confirmRegisterBtn.disabled = true;

      //registra l'utente su Firebase
      const cred = await register(email, pass);
      const user = cred.user;

      //aggiorna il profilo Firebase dell'utente
      try {
        const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
        await updateProfile(user, { displayName: username || null });
        if (typeof user.reload === "function") await user.reload();
      } catch (profErr) {
        console.warn("Impossibile aggiornare il profilo utente:", profErr?.message || profErr);
      }

      //crea e salva il documento utente nel database
      const userDoc = { 
        email: user.email, 
        username: username || null, 
        createdAt: new Date().toISOString() 
      };
      await saveUserData(user.uid, userDoc);

      console.log("Registrazione avvenuta:", user.email);
      alert("Registrazione effettuata con successo: " + user.email);

      //mostra immediatamente i dati utente nella UI
      try {
        showUserUI(user.email);
        renderData(userDoc);
      } catch (uiErr) {
        console.warn("Impossibile aggiornare immediatamente l'UI:", uiErr);
      }

      //nasconde il form di autenticazione
      if (authSection) authSection.style.display = "none";
    } catch (err) {
      //gestione degli errori di registrazione
      const msg = userMessageForFirebaseError(err);
      console.error("Errore nella registrazione:", err?.code, err?.message, err);
      alert("Registrazione fallita: " + msg);
    } finally {
      //riabilita il bottone di conferma
      confirmRegisterBtn.disabled = false;
    }
  });

  //gestisce il login
  confirmLoginBtn?.addEventListener("click", async () => {
    try {
      const email = getEmail();
      const pass = getPassword();
      if (!email || !pass) { alert("Inserisci email e password."); return; }
      if (!isValidEmail(email)) { alert("Formato email non valido."); return; }

      //esegue l'accesso
      await login(email, pass);
      console.log("Login eseguito per:", email);

      //nasconde la sezione di login
      if (authSection) authSection.style.display = "none";
    } catch (err) {
      const msg = userMessageForFirebaseError(err);
      console.error("Errore login:", err);
      alert("Login fallito: " + msg);
    }
  });

  //logout
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await logout();
  });

  //carica i dati salvati dell'utente (da Firestore)
  //mostra le informazioni salvate nel pannello dell'utente.
  document.getElementById("loadBtn").addEventListener("click", async () => {
    const user = (await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"))
      .getAuth()
      .currentUser;
    if (!user) return;

    const data = await loadUserData(user.uid);
    if (data) renderData(data);
  });
}
