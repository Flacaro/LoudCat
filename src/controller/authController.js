// authController.js
import { register, login, logout, onUserChanged, saveUserData, loadUserData } from "../model/modelAuth.js";
import { getEmail, getPassword, showUserUI, showLoginUI, renderData } from "../view/header.js";
export function initFirebaseAuth() {
 // Rileva se l’utente è loggato o meno
 onUserChanged(async (user) => {
   if (user) {
     showUserUI(user.email);
     console.log("Utente autenticato:", user.email);
   } else {
     showLoginUI();
     console.log("Nessun utente autenticato");
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

 // Gestione registrazione
 document.getElementById("registerBtn").addEventListener("click", async () => {
  try {
    const email = getEmail();
    const pass = getPassword();

    if (!email || !pass) {
      alert("Inserisci email e password.");
      return;
    }
    if (!isValidEmail(email)) {
      alert("Formato email non valido.");
      return;
    }
    if (pass.length < 6) {
      alert("La password deve avere almeno 6 caratteri.");
      return;
    }

    const cred = await register(email, pass);
    const user = cred.user;

    await saveUserData(user.uid, { email: user.email, createdAt: new Date().toISOString() });
    console.log("Registrazione avvenuta:", user.email);
    alert("Registrazione effettuata con successo: " + user.email);
  } catch (err) {
    const msg = userMessageForFirebaseError(err);
    console.error("Errore nella registrazione:", err.code || err.message || err);
    alert("Registrazione fallita: " + msg);
  }

 });

 //evento login
 document.getElementById("loginBtn").addEventListener("click", async () => {
   try {
     const email = getEmail();
     const pass = getPassword();

     if (!email || !pass) {
       alert("Inserisci email e password.");
       return;
     }
     if (!isValidEmail(email)) {
       alert("Formato email non valido.");
       return;
     }

     await login(email, pass);
     console.log("Login eseguito per:", email);
   } catch (err) {
     const msg = userMessageForFirebaseError(err);
     console.error("Errore login:", err.code || err.message || err);
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