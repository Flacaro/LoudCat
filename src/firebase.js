// Use Firebase CDN modules so the app can run as a plain ES module in the browser
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your web app's Firebase configuration (copied from console)
const firebaseConfig = {
  apiKey: "AIzaSyBoUBOu8rm_yzS7MWIY7YtMlyTfHmNbPT8",
  authDomain: "loudcat.firebaseapp.com",
  projectId: "loudcat",
  storageBucket: "loudcat.firebasestorage.app",
  messagingSenderId: "847871362501",
  appId: "1:847871362501:web:c0d5d5cb4faa6b0fe037ac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// init database
const db = getFirestore(app);
// init auth
const auth = getAuth(app);

export { app, db, auth };