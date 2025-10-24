// authController.js
import { register, login, logout, onUserChanged, saveUserData, loadUserData } from "../model/modelAuth.js";
import { getEmail, getPassword, getUsername, showUserUI, showLoginUI, renderData } from "../view/header.js";


export function initFirebaseAuth(controller) {

  if (!controller) {
    console.error("AuthController: controller non fornito!");
    return;
  }
  
onUserChanged(async (user) => {
  const homeContainer = document.getElementById("home-container");
  const resultsContainer = document.getElementById("results-section");

  if (user) {
    showUserUI(user.email);
    console.log("Utente autenticato:", user.email);

    // Clear welcome view when user logs in
    if (controller.welcomeView) {
      controller.welcomeView.clear();
    }

    if (controller.userController) {
      const { favorites, playlists } = await controller.userController.loadUserCollections(user.uid);
      controller.userController.renderUserCollections({ favorites, playlists }, controller.view);
    }

    if (homeContainer) homeContainer.style.display = "block";
    if (resultsContainer) resultsContainer.style.display = "none";

  } else {
    showLoginUI();
    console.log("Nessun utente autenticato");

    if (homeContainer) {
      homeContainer.innerHTML = "";
      homeContainer.style.display = "none";
    }
    if (resultsContainer) resultsContainer.style.display = "none";

    if (controller.homeView) {
      controller.homeView.results.innerHTML = "";
    }
  }
});

 // helper di validazione
 function isValidEmail(email) {
   return typeof email === "string" && /\S+@\S+\.\S+/.test(email);
 }

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

  // UI elements for auth form toggling and confirm actions
  const registerBtnEl = document.getElementById("registerBtn");
  const loginBtnEl = document.getElementById("loginBtn");
  const authSection = document.getElementById("auth");
  const registerFields = document.getElementById("registerFields");
  const confirmRegisterBtn = document.getElementById("confirmRegisterBtn");
  const confirmLoginBtn = document.getElementById("confirmLoginBtn");
  const cancelAuthBtn = document.getElementById("cancelAuthBtn");

  // Show auth form when Register clicked (show username/photo)
  registerBtnEl?.addEventListener("click", () => {
    if (authSection) authSection.style.display = "block";
    if (registerFields) registerFields.style.display = "block";
    if (confirmRegisterBtn) confirmRegisterBtn.style.display = "inline-block";
    if (confirmLoginBtn) confirmLoginBtn.style.display = "none";
  });

  // photo upload removed: no preview handling

  // Show auth form when Login clicked (hide username/photo)
  loginBtnEl?.addEventListener("click", () => {
    if (authSection) authSection.style.display = "block";
    if (registerFields) registerFields.style.display = "none";
    if (confirmRegisterBtn) confirmRegisterBtn.style.display = "none";
    if (confirmLoginBtn) confirmLoginBtn.style.display = "inline-block";
  });

  // Cancel/hide auth section
  cancelAuthBtn?.addEventListener("click", () => { if (authSection) authSection.style.display = "none"; });

  // Confirm registration (email/password + save)
  confirmRegisterBtn?.addEventListener("click", async () => {
    if (!confirmRegisterBtn) return;
    try {
      const email = getEmail();
      const pass = getPassword();
      if (!email || !pass) { alert("Inserisci email e password."); return; }
      if (!isValidEmail(email)) { alert("Formato email non valido."); return; }
      if (pass.length < 6) { alert("La password deve avere almeno 6 caratteri."); return; }
  const username = getUsername ? getUsername() : null;

      // Disable button to prevent duplicate submissions while uploading
      confirmRegisterBtn.disabled = true;

      const cred = await register(email, pass);
      const user = cred.user;

      // photo upload removed: only save username
      try {
        const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
        await updateProfile(user, { displayName: username || null });
        if (typeof user.reload === "function") {
          await user.reload();
        }
      } catch (profErr) {
        console.warn("Impossibile aggiornare il profilo utente:", profErr && profErr.message ? profErr.message : profErr);
      }

      const userDoc = { email: user.email, username: username || null, createdAt: new Date().toISOString() };
      await saveUserData(user.uid, userDoc);
      console.log("Registrazione avvenuta:", user.email);
      alert("Registrazione effettuata con successo: " + user.email);
      // Immediately show user UI and display saved data so username appears in the Dati dell'utente section
      try {
        showUserUI(user.email);
        renderData(userDoc);
      } catch (uiErr) {
        console.warn('Impossibile aggiornare immediatamente l\'UI dopo la registrazione:', uiErr);
      }
      if (authSection) authSection.style.display = "none";
    } catch (err) {
      const msg = userMessageForFirebaseError(err);
      console.error("Errore nella registrazione:", err && err.code, err && err.message, err);
      alert("Registrazione fallita: " + msg);
    } finally {
      // Re-enable button after attempt
      confirmRegisterBtn.disabled = false;
    }
  });

  // Confirm login (email/password)
  confirmLoginBtn?.addEventListener("click", async () => {
    try {
      const email = getEmail();
      const pass = getPassword();
      if (!email || !pass) { alert("Inserisci email e password."); return; }
      if (!isValidEmail(email)) { alert("Formato email non valido."); return; }
      await login(email, pass);
      console.log("Login eseguito per:", email);
      if (authSection) authSection.style.display = "none";
    } catch (err) {
      const msg = userMessageForFirebaseError(err);
      console.error("Errore login:", err);
      alert("Login fallito: " + msg);
    }
  });
 document.getElementById("logoutBtn").addEventListener("click", async () => {
   await logout();
 });
 document.getElementById("loadBtn").addEventListener("click", async () => {
   const user = (await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js")).getAuth().currentUser;
   if (!user) return;
   const data = await loadUserData(user.uid);
   if (data) renderData(data);
 });
}