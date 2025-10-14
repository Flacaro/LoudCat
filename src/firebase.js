// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
//init database
const db = getFirestore(app);
//init auth
const auth = getAuth(app);

export {app, db, auth};