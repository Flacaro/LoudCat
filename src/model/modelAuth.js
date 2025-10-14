import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 

  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore, doc, setDoc, getDoc } 

  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth();

const db = getFirestore();

// --- AUTH ---

export async function register(email, password) {

  return await createUserWithEmailAndPassword(auth, email, password);

}

export async function login(email, password) {

  return await signInWithEmailAndPassword(auth, email, password);

}

export async function logout() {

  return await signOut(auth);

}

export function onUserChanged(callback) {

  onAuthStateChanged(auth, callback);

}

// --- FIRESTORE ---

export async function saveUserData(uid, data) {

  const ref = doc(db, "users", uid);

  await setDoc(ref, data);

}

export async function loadUserData(uid) {

  const ref = doc(db, "users", uid);

  const snap = await getDoc(ref);

  return snap.exists() ? snap.data() : null;

}
 