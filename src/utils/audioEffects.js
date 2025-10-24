// audioEffects.js
// Utility per generare effetti sonori semplici usando Web Audio API

/**
 * Riproduce un file audio personalizzato (es. "You Suffer" by Napalm Death)
 * Assicurati di avere il file in assets/audio/
 */
export function playCustomAudio(audioPath = 'assets/audio/SpotiDown.App - You Suffer - Napalm Death.mp3') {
  try {
    const audio = new Audio(audioPath);
    audio.volume = 0.5; // Volume al 50% per non essere troppo forte
    audio.play().catch(err => {
      console.warn('Impossibile riprodurre audio:', err);
    });
  } catch (err) {
    console.warn('Errore nel caricamento audio:', err);
  }
}

/**
 * Riproduce un suono di "meow" stilizzato quando si clicca sul logo
 */
export function playMeowClick() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    // Oscillatore principale per il "meow"
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Crea un suono simile a un "meow" con modulazione di frequenza
    oscillator.type = 'sine';
    
    // Curva di frequenza che simula un "meow" breve
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    // Envelope per volume (attack-decay-release)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // attack
    gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.08); // sustain
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2); // release

    oscillator.start(now);
    oscillator.stop(now + 0.2);

    // Cleanup
    setTimeout(() => {
      try {
        audioContext.close();
      } catch (e) {
        // ignora errori di cleanup
      }
    }, 300);

  } catch (err) {
    console.warn('Impossibile riprodurre effetto sonoro:', err);
  }
}

/**
 * Riproduce un semplice click/beep
 */
export function playSimpleClick() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, now);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);

    setTimeout(() => {
      try {
        audioContext.close();
      } catch (e) {
        // ignora
      }
    }, 150);

  } catch (err) {
    console.warn('Impossibile riprodurre click:', err);
  }
}

/**
 * Riproduce un suono più elaborato con due toni (simile a un "purr" di gatto)
 */
export function playPurrClick() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    // Due oscillatori per un suono più ricco
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    osc1.type = 'sine';
    osc2.type = 'sine';

    // Frequenze leggermente dissonanti per un effetto più "caldo"
    osc1.frequency.setValueAtTime(400, now);
    osc2.frequency.setValueAtTime(403, now);

    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(302, now + 0.15);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.18);
    osc2.stop(now + 0.18);

    setTimeout(() => {
      try {
        audioContext.close();
      } catch (e) {
        // ignora
      }
    }, 250);

  } catch (err) {
    console.warn('Impossibile riprodurre purr:', err);
  }
}
