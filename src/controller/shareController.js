//shareController.js
import { doc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db } from "../firebase.js";

//mostra un modale per chiedere un’email e 
//restituisce una Promise che risolve con l’email inserita o `null` se annullato
function promptForEmail(message) {
  return new Promise((resolve) => {
    //crea l’overlay di sfondo
    const backdrop = document.createElement('div');
    backdrop.className = 'email-modal-backdrop';

    //crea il contenitore del modale
    const modal = document.createElement('div');
    modal.className = 'email-modal';

    //titolo
    const title = document.createElement('div');
    title.className = 'email-modal-title';
    title.textContent = message || 'Inserisci email';

    //campo input
    const input = document.createElement('input');
    input.type = 'email';
    input.placeholder = 'es. nome@esempio.com';
    input.className = 'email-modal-input';

    //pulsanti
    const btnRow = document.createElement('div');
    btnRow.className = 'email-modal-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Annulla';
    cancelBtn.className = 'email-modal-btn cancel';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.textContent = 'Condividi';
    okBtn.className = 'email-modal-btn confirm';

    //assembla struttura
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(okBtn);
    modal.appendChild(title);
    modal.appendChild(input);
    modal.appendChild(btnRow);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    //gestione focus e interazioni
    input.focus();

    function cleanup() {
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      backdrop.removeEventListener('click', onBackdropClick);
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
    }

    function onOk(e) {
      e.stopPropagation();
      const value = input.value.trim();
      if (!value || !/\S+@\S+\.\S+/.test(value)) {
        input.classList.add('invalid');
        input.focus();
        return;
      }
      cleanup();
      resolve(value);
    }

    function onCancel(e) {
      e.stopPropagation();
      cleanup();
      resolve(null);
    }

    function onBackdropClick(e) {
      if (e.target === backdrop) {
        cleanup();
        resolve(null);
      }
    }

    function onKey(e) {
      if (e.key === 'Escape') { cleanup(); resolve(null); }
      if (e.key === 'Enter') { onOk(e); }
    }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    backdrop.addEventListener('click', onBackdropClick);
    document.addEventListener('keydown', onKey);
  });
}


//controller per la condivisione di una canzone tra utenti.
export default class ShareController {
  //condivide una canzone con un altro utente identificato dalla sua email
  async handleShare(song) {
    const auth = getAuth();
    const user = auth.currentUser;

    //se non loggato, blocca
    if (!user) {
      alert('Devi effettuare il login per condividere una canzone.');
      return;
    }

    //chiede via modale l’email del destinatario
    const recipientEmail = await promptForEmail('Inserisci l\'email del destinatario con cui condividere:');
    if (!recipientEmail) return;

    const emailTrim = recipientEmail.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(emailTrim)) {
      alert('Email non valida.');
      return;
    }

    try {
      //cerca il destinatario nella collection "users" tramite campo email
      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('email', '==', emailTrim));
      let snap;

      try {
        snap = await getDocs(q);
      } catch (qErr) {
        console.error('Errore durante la ricerca dell\'utente destinatario (getDocs users):', qErr);

        //messaggio specifico se l’errore è di permessi Firestore
        if (qErr && (qErr.code === 'permission-denied' || /permission/i.test(qErr.message || ''))) {
          alert('Impossibile cercare utenti: permessi insufficienti per leggere la collection users.\nVerifica le regole di Firestore.');
          return;
        }
        throw qErr;
      }

      //se nessun utente trovato
      if (snap.empty) {
        alert('Nessun utente trovato con questa email. Impossibile condividere.');
        return;
      }

      //usa il primo utente trovato (email deve essere unica)
      const recipientDoc = snap.docs[0];
      const recipientUid = recipientDoc.id;

      //crea un record globale di condivisione in "shares"
      const shareRef = doc(db, 'shares', `${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
      try {
        await setDoc(shareRef, {
          fromUid: user.uid,
          fromEmail: user.email,
          toEmail: emailTrim,
          toUid: recipientUid,
          song,
          createdAt: new Date().toISOString()
        });
      } catch (writeErr) {
        console.error('Errore scrittura share:', writeErr);

        //messaggio più chiaro se mancano permessi
        if (writeErr && (writeErr.code === 'permission-denied' || /permission/i.test(writeErr.message || ''))) {
          alert('Impossibile creare la condivisione: permessi insufficienti.\nVerifica le regole di Firestore o implementa una Cloud Function server-side per scrivere la condivisione.');
          return;
        }
        throw writeErr;
      }

      //aggiunge anche un record nella sottocollezione del destinatario per accesso rapido
      try {
        const recipientSharedRef = doc(
          db,
          'users',
          recipientUid,
          'shared',
          `${Date.now()}_${Math.random().toString(36).slice(2,8)}`
        );
        await setDoc(recipientSharedRef, {
          from: user.email,
          song,
          createdAt: new Date().toISOString()
        });
      } catch (innerErr) {
        console.debug('Non è stato possibile scrivere nella subcollection shared del destinatario:', innerErr);
      }

      alert('Canzone condivisa con ' + emailTrim + '!');
    } catch (err) {
      console.error('Errore durante la condivisione:', err);
      alert('Errore durante la condivisione.');
    }
  }
}
