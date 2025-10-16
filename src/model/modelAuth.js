import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "../firebase.js";

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
  // use merge to avoid overwriting the whole document when updating a single field
  await setDoc(ref, data, { merge: true });
}

export async function loadUserData(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}
 