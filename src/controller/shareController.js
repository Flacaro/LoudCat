import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
      const shareRef = doc(db, 'shares', `${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
      await setDoc(shareRef, { fromUid: user.uid, fromEmail: user.email, toEmail: emailTrim, song, createdAt: new Date().toISOString() });

      const usersRef = doc(db, 'users', emailTrim.replace(/[^a-zA-Z0-9]/g, '_'));
      const userSnap = await getDoc(usersRef);
      if (userSnap.exists()) {
        const recipientSharedRef = doc(db, 'users', usersRef.id, 'shared', `${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
        await setDoc(recipientSharedRef, { from: user.email, song, createdAt: new Date().toISOString() });
      }

      alert('Canzone condivisa con ' + emailTrim + '!');
    } catch (err) {
      console.error('Errore durante la condivisione:', err);
      alert('Errore durante la condivisione.');
    }
  }
}
