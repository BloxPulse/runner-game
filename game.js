/**
 * config.js — Configuration centrale du jeu
 *
 * Toutes les constantes ajustables sont ici.
 * Pour modifier la difficulté, la vitesse, les obstacles,
 * il suffit de changer ces valeurs.
 */

const CONFIG = {

  // ─── Canvas & dimensions ───────────────────
  CANVAS_WIDTH:  960,   // largeur logique du canvas
  CANVAS_HEIGHT: 540,   // hauteur logique du canvas

  // ─── Sol & zones ───────────────────────────
  GROUND_Y:      440,   // position Y du sol
  SKY_HEIGHT:    200,   // hauteur du ciel (pour le parallax)

  // ─── Vitesse ───────────────────────────────
  SPEED_INITIAL:   5,       // vitesse de départ (px/frame)
  SPEED_MAX:       18,      // vitesse maximale
  SPEED_INCREMENT: 0.0008,  // accélération par frame

  // ─── Joueur ────────────────────────────────
  PLAYER: {
    x:            120,    // position X fixe
    width:        40,
    height:       60,
    jumpForce:   -15,     // force du saut
    doubleJumpForce: -12, // force du double saut
    slideHeight:  30,     // hauteur du personnage en glissade
    slideDuration: 500,   // durée de la glissade en ms
    gravity:      0.7,    // gravité par frame
    maxFallSpeed: 18,     // vitesse de chute max
  },

  // ─── Monstre poursuivant ───────────────────
  MONSTER: {
    width:        80,
    height:      100,
    startOffset: -250,    // position de départ (X) par rapport au bord gauche
    catchUpRate:  0.002,  // taux de rattrapage (ajusté à la vitesse)
    maxProximity: 90,     // distance minimale avant game over
    speedBoostOnObstacle: 0.5, // boost du monstre quand le joueur rate un obstacle
  },

  // ─── Obstacles ─────────────────────────────
  OBSTACLES: {
    minGap:      400,     // écart minimum entre deux obstacles (px)
    maxGap:      800,     // écart maximum
    minGapFar:   300,     // écart min à haute vitesse
    types: [
      // Obstacle bas : à sauter
      { id: 'rock',      label: 'Rocher',    w: 40,  h: 50,  y: 0,   action: 'jump',   bouncy: false, color: '#7f8c8d' },
      { id: 'cactus',    label: 'Cactus',    w: 30,  h: 70,  y: 0,   action: 'jump',   bouncy: false, color: '#27ae60' },
      { id: 'stump',     label: 'Souche',    w: 50,  h: 40,  y: 0,   action: 'jump',   bouncy: false, color: '#8B4513' },
      // Obstacle haut : à glisser
      { id: 'beam',      label: 'Poutre',    w: 120, h: 20,  y: -80, action: 'slide',  bouncy: false, color: '#c0392b', isHigh: true },
      { id: 'fireball',  label: 'Boule feu', w: 30,  h: 30,  y: -90, action: 'slide',  bouncy: false, color: '#e67e22', isHigh: true },
      // Plateforme rebondissante
      { id: 'spring',    label: 'Trampoline',w: 60,  h: 20,  y: 0,   action: 'bounce', bouncy: true,  color: '#3498db' },
      // Trou dans le sol (géré spécialement)
      { id: 'hole',      label: 'Trou',      w: 90,  h: 0,   y: 0,   action: 'jump',   bouncy: false, color: null, isHole: true },
    ],
  },

  // ─── Pièces ────────────────────────────────
  COINS: {
    radius:    10,
    value:      1,
    spawnChance: 0.4,  // probabilité de pièce dans un gap (0–1)
    lineLength: 5,     // nombre de pièces dans une ligne
    bobSpeed:   0.08,  // vitesse d'oscillation verticale
    bobAmount:  6,     // amplitude de l'oscillation
  },

  // ─── Parallax (couches) ────────────────────
  // Chaque couche a une vitesse relative (factor × vitesse du jeu)
  PARALLAX: [
    { id: 'sky',        factor: 0.0,  color: '#1a1a2e' },
    { id: 'mountains',  factor: 0.1,  color: '#16213e' },
    { id: 'hills_far',  factor: 0.25, color: '#0f3460' },
    { id: 'hills_near', factor: 0.5,  color: '#1a0533' },
    { id: 'ground',     factor: 1.0,  color: '#0d0d0d' },
  ],

  // ─── Système de score ──────────────────────
  SCORE: {
    distanceFactor: 0.1,  // pts par pixel parcouru
    coinBonus:       10,  // pts par pièce
  },

  // ─── Particules ────────────────────────────
  PARTICLES: {
    jumpCount:  8,
    coinCount: 12,
    deathCount: 20,
    dustCount:   4,
  },

  // ─── Audio ────────────────────────────────
  // Chemins vers les fichiers sons (remplacer par vos assets)
  AUDIO: {
    jump:    null,  // 'sounds/jump.mp3'
    coin:    null,  // 'sounds/coin.mp3'
    gameover:null,  // 'sounds/gameover.mp3'
    bounce:  null,  // 'sounds/bounce.mp3'
    slide:   null,  // 'sounds/slide.mp3'
  },

  // ─── Skins du joueur ──────────────────────
  // Pour ajouter un skin, ajouter un objet ici
  SKINS: [
    { id: 'default', name: 'Runner', color: '#2ecc71', trailColor: 'rgba(46,204,113,0.3)' },
    { id: 'fire',    name: 'Fire',   color: '#e74c3c', trailColor: 'rgba(231,76,60,0.3)'  },
    { id: 'ice',     name: 'Ice',    color: '#74b9ff', trailColor: 'rgba(116,185,255,0.3)' },
  ],
  activeSkin: 0,

};

// Rendre CONFIG immuable (protection contre modifications accidentelles)
Object.freeze(CONFIG);
Object.freeze(CONFIG.PLAYER);
Object.freeze(CONFIG.MONSTER);
Object.freeze(CONFIG.COINS);
Object.freeze(CONFIG.SCORE);
Object.freeze(CONFIG.PARTICLES);
Object.freeze(CONFIG.AUDIO);
