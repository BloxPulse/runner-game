/**
 * audio.js — Système audio du jeu
 *
 * Gère les effets sonores via l'API Web Audio.
 * Si aucun fichier n'est fourni, génère des sons procéduraux.
 * Pour ajouter un son : AudioSystem.play('monSon').
 */

const AudioSystem = (() => {

  // Contexte Web Audio (créé au premier geste utilisateur)
  let ctx = null;
  const buffers = {}; // cache des buffers chargés

  /** Initialise le contexte audio (appelé à la première interaction) */
  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio non supporté');
    }
  }

  /** Charge un fichier audio dans le cache */
  async function load(id, url) {
    if (!ctx || !url) return;
    try {
      const res  = await fetch(url);
      const data = await res.arrayBuffer();
      buffers[id] = await ctx.decodeAudioData(data);
    } catch (e) {
      console.warn(`Impossible de charger l'audio : ${url}`);
    }
  }

  /** Joue un son chargé ou génère un son procédural */
  function play(id, volume = 0.5) {
    if (!ctx) return;

    // Si buffer chargé → le jouer
    if (buffers[id]) {
      const src    = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      src.buffer   = buffers[id];
      gainNode.gain.value = volume;
      src.connect(gainNode);
      gainNode.connect(ctx.destination);
      src.start();
      return;
    }

    // Sinon → son procédural de fallback
    playSynthetic(id, volume);
  }

  /**
   * Sons synthétiques générés via Web Audio.
   * Chaque son est une petite enveloppe sonore.
   */
  function playSynthetic(id, volume) {
    if (!ctx) return;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (id) {
      case 'jump':
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        gain.gain.setValueAtTime(volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'doubleJump':
        osc.type = 'square';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
        gain.gain.setValueAtTime(volume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;

      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);
        gain.gain.setValueAtTime(volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'bounce':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(volume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'slide':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.25);
        gain.gain.setValueAtTime(volume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'gameover':
        // Accord descendant sinistre
        [200, 160, 120, 90].forEach((freq, i) => {
          const o2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          o2.type = 'sawtooth';
          o2.frequency.setValueAtTime(freq, now + i * 0.12);
          g2.gain.setValueAtTime(volume * 0.4, now + i * 0.12);
          g2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
          o2.connect(g2);
          g2.connect(ctx.destination);
          o2.start(now + i * 0.12);
          o2.stop(now + i * 0.12 + 0.25);
        });
        return; // Pas besoin de start() sur l'oscillateur principal
    }
  }

  /** Charge tous les sons définis dans CONFIG */
  async function loadAll() {
    init();
    for (const [id, url] of Object.entries(CONFIG.AUDIO)) {
      if (url) await load(id, url);
    }
  }

  // API publique
  return { init, load, play, loadAll };

})();
