// controller.js
import { register, login, logout, onUserChanged, saveUserData, loadUserData } from "./model.js";
import { getEmail, getPassword, showUserUI, showLoginUI, renderData } from "./view.js";
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
 // Gestione registrazione
 document.getElementById("registerBtn").addEventListener("click", async () => {
  try {
  const email = getEmail();
   const pass = getPassword();
   const cred = await register(email, pass);
   const user = cred.user;

   await saveUserData(user.uid, { email: user.email, createdAt: new Date().toISOString() });
  } catch (err) {
      console.log("Errore nella registrazione") }

 });

 //evento login
 document.getElementById("loginBtn").addEventListener("click", async () => {
   const email = getEmail();
   const pass = getPassword();
   await login(email, pass);
 });
 document.getElementById("logoutBtn").addEventListener("click", async () => {
   await logout();
 });
 document.getElementById("loadBtn").addEventListener("click", async () => {
   const user = (await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js")).getAuth().currentUser;
   if (!user) return;
   const data = await loadUserData(user.email);
   if (data) renderData(data);
 });
}