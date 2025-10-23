import { doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db } from "../firebase.js";

export default class ShareController {
  async handleShare(song) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) { alert('Devi effettuare il login per condividere una canzone.'); return; }

    const recipientEmail = prompt('Inserisci l\'email del destinatario con cui condividere:');
    if (!recipientEmail) return;
    const emailTrim = recipientEmail.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(emailTrim)) { alert('Email non valida.'); return; }

    try {
      // Ensure recipient exists in users collection (users are stored by uid with an 'email' field)
      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('email', '==', emailTrim));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert('Nessun utente trovato con questa email. Impossibile condividere.');
        return;
      }

      // Use the first matched user (email should be unique)
      const recipientDoc = snap.docs[0];
      const recipientUid = recipientDoc.id;

      // Create global share record
      const shareRef = doc(db, 'shares', `${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
      await setDoc(shareRef, { fromUid: user.uid, fromEmail: user.email, toEmail: emailTrim, toUid: recipientUid, song, createdAt: new Date().toISOString() });

      // Also add an entry under recipient's users/{uid}/shared for quick access
      try {
        const recipientSharedRef = doc(db, 'users', recipientUid, 'shared', `${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
        await setDoc(recipientSharedRef, { from: user.email, song, createdAt: new Date().toISOString() });
      } catch (innerErr) {
        // Non-fatal: log but continue
        console.debug('Non è stato possibile scrivere nella subcollection shared del destinatario:', innerErr);
      }

      alert('Canzone condivisa con ' + emailTrim + '!');
    } catch (err) {
      console.error('Errore durante la condivisione:', err);
      alert('Errore durante la condivisione.');
    }
  }
}
