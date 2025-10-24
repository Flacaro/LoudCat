import { doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db } from "../firebase.js";

// Small helper: show a centered modal to capture an email string. Returns the entered string or null on cancel.
function promptForEmail(message) {
  return new Promise((resolve) => {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'lc-modal-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.inset = '0';
    backdrop.style.background = 'rgba(0,0,0,0.45)';
    backdrop.style.display = 'flex';
    backdrop.style.alignItems = 'center';
    backdrop.style.justifyContent = 'center';
    backdrop.style.zIndex = '1200';

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'lc-modal';
    modal.style.minWidth = '320px';
    modal.style.maxWidth = '90%';
    modal.style.background = '#fff';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
    modal.style.padding = '18px';
    modal.style.boxSizing = 'border-box';
    modal.style.fontFamily = 'inherit';

    const title = document.createElement('div');
    title.textContent = message || 'Inserisci email';
    title.style.marginBottom = '10px';
    title.style.fontWeight = '600';

    const input = document.createElement('input');
    input.type = 'email';
    input.placeholder = 'es. nome@esempio.com';
    input.style.width = '100%';
    input.style.padding = '8px 10px';
    input.style.fontSize = '14px';
    input.style.marginBottom = '12px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'flex-end';
    btnRow.style.gap = '8px';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Annulla';
    cancelBtn.className = 'btn btn-outline-secondary';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.textContent = 'Condividi';
    okBtn.className = 'btn btn-primary';

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(okBtn);

    modal.appendChild(title);
    modal.appendChild(input);
    modal.appendChild(btnRow);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Focus and handlers
    input.focus();

    function cleanup() {
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      backdrop.removeEventListener('click', onBackdropClick);
      document.removeEventListener('keydown', onKey);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }

    function onOk(e) {
      e.stopPropagation();
      const v = input.value ? input.value.trim() : '';
      if (!v || !/\S+@\S+\.\S+/.test(v)) {
        input.focus();
        input.style.borderColor = 'crimson';
        return;
      }
      cleanup();
      resolve(v);
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

export default class ShareController {
  async handleShare(song) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) { alert('Devi effettuare il login per condividere una canzone.'); return; }
    // Show a centered modal to request recipient email instead of using prompt()
    const recipientEmail = await promptForEmail('Inserisci l\'email del destinatario con cui condividere:');
    if (!recipientEmail) return;
    const emailTrim = recipientEmail.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(emailTrim)) { alert('Email non valida.'); return; }

    try {
      // Ensure recipient exists in users collection (users are stored by uid with an 'email' field)
      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('email', '==', emailTrim));
      let snap;
      try {
        snap = await getDocs(q);
      } catch (qErr) {
        console.error('Errore durante la ricerca dell\'utente destinatario (getDocs users):', qErr);
        // If the error is permission-related, show a clearer message
        if (qErr && (qErr.code === 'permission-denied' || /permission/i.test(qErr.message || ''))) {
          alert('Impossibile cercare utenti: permessi insufficienti per leggere la collection users.\nVerifica le regole di Firestore.');
          return;
        }
        // Other errors: rethrow to outer catch
        throw qErr;
      }

      if (snap.empty) {
        alert('Nessun utente trovato con questa email. Impossibile condividere.');
        return;
      }

      // Use the first matched user (email should be unique)
      const recipientDoc = snap.docs[0];
      const recipientUid = recipientDoc.id;

      // Create global share record
      const shareRef = doc(db, 'shares', `${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
      try {
        await setDoc(shareRef, { fromUid: user.uid, fromEmail: user.email, toEmail: emailTrim, toUid: recipientUid, song, createdAt: new Date().toISOString() });
      } catch (writeErr) {
        // Clear, actionable error messaging for permission issues (common when Firestore rules changed)
        console.error('Errore scrittura share:', writeErr);
        if (writeErr && (writeErr.code === 'permission-denied' || /permission/i.test(writeErr.message || ''))) {
          alert('Impossibile creare la condivisione: permessi insufficienti.\nVerifica le regole di Firestore o implementa una Cloud Function server-side per scrivere la condivisione.');
          return;
        }
        // rethrow to be handled by outer catch
        throw writeErr;
      }

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
