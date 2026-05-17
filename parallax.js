/**
 * obstacles.js — Génération procédurale des obstacles
 *
 * Les obstacles sont générés à la volée selon la vitesse.
 * Chaque obstacle a un type, une position, et des propriétés.
 *
 * Pour ajouter un obstacle :
 *   1. Ajouter sa définition dans CONFIG.OBSTACLES.types
 *   2. Ajouter son rendu dans renderer.js → drawObstacle()
 */

const ObstacleSystem = (() => {

  const OBS  = CONFIG.OBSTACLES;
  const GY   = CONFIG.GROUND_Y;
  const W    = CONFIG.CANVAS_WIDTH;

  let obstacles  = [];     // liste active
  let holes      = [];     // liste des trous (traités séparément)
  let spawnTimer = 0;      // distance avant prochain obstacle
  let lastType   = null;   // évite deux fois le même type de suite

  // Difficulté
  let difficulty = 0;      // 0..1, augmente avec la vitesse

  /** Réinitialise le système */
  function init() {
    obstacles  = [];
    holes      = [];
    spawnTimer = 400;
    lastType   = null;
    difficulty = 0;
  }

  /**
   * Met à jour les obstacles.
   * @param {number} gameSpeed    vitesse du jeu (px/frame)
   * @param {number} distanceTot  distance totale parcourue
   */
  function update(gameSpeed, distanceTot) {
    difficulty = Math.min(1, distanceTot / 5000);

    // ─── Déplacement ─────────────────────────
    obstacles.forEach(ob => { ob.x -= gameSpeed; });
    holes.forEach(h    => { h.x  -= gameSpeed; });

    // ─── Nettoyage (hors écran gauche) ───────
    obstacles = obstacles.filter(ob => ob.x + ob.w > -60);
    holes     = holes.filter(h    => h.x  + h.w  > -60);

    // ─── Spawn ────────────────────────────────
    spawnTimer -= gameSpeed;
    if (spawnTimer <= 0) {
      spawnObstacle(gameSpeed);
      scheduleNext(gameSpeed);
    }
  }

  /** Crée un nouvel obstacle / trou */
  function spawnObstacle(gameSpeed) {
    // Choisir un type aléatoire (pondéré par difficulté)
    const type = pickType();

    if (type.isHole) {
      // Trou dans le sol
      holes.push({
        x: W + 10,
        w: type.w + Math.random() * 40,
        h: 0,
        type,
      });
    } else {
      // Obstacle classique
      const h = type.h + Math.floor(Math.random() * 20);
      const w = type.w;
      const y = type.isHigh
        ? GY - P_HEIGHT() + type.y  // obstacle haut (sous le haut de l'écran)
        : GY - h;                   // obstacle au sol

      obstacles.push({ x: W + 10, y, w, h, type });
    }
  }

  /**
   * Choisit un type d'obstacle selon la difficulté.
   * Les obstacles complexes apparaissent plus tard.
   */
  function pickType() {
    const types = OBS.types.filter(t => {
      // Trous uniquement après difficulty > 0.3
      if (t.isHole   && difficulty < 0.3) return false;
      // Obstacles hauts après difficulty > 0.15
      if (t.isHigh   && difficulty < 0.15) return false;
      // Éviter de répéter le même type
      if (t.id === lastType) return false;
      return true;
    });

    // Fallback si aucun type disponible
    if (types.length === 0) return OBS.types[0];

    const t = types[Math.floor(Math.random() * types.length)];
    lastType = t.id;
    return t;
  }

  /** Planifie le prochain spawn */
  function scheduleNext(gameSpeed) {
    const minGap = Math.max(OBS.minGapFar, OBS.minGap - difficulty * 100);
    const maxGap = OBS.maxGap - difficulty * 150;
    spawnTimer   = minGap + Math.random() * (maxGap - minGap);
  }

  /** Hauteur du joueur debout */
  function P_HEIGHT() {
    return CONFIG.PLAYER.height;
  }

  /**
   * Vérifie la collision entre le joueur et les obstacles.
   * Retourne { hit: bool, type: typeObj|null, bouncy: bool }
   */
  function checkCollision(playerHitbox) {
    for (const ob of obstacles) {
      if (ob.type.isHole) continue;

      if (rectsOverlap(playerHitbox, { x: ob.x, y: ob.y, w: ob.w, h: ob.h })) {
        return { hit: true, obstacle: ob, bouncy: ob.type.bouncy };
      }
    }
    return { hit: false, obstacle: null, bouncy: false };
  }

  /** AABB simple */
  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  /** Dessine tous les obstacles */
  function draw(ctx) {
    obstacles.forEach(ob => Renderer.drawObstacle(ob));
    // Les trous sont dessinés par le parallax (sol absent)
  }

  // API publique
  return {
    init, update, checkCollision, draw,
    get obstacles() { return obstacles; },
    get holes()     { return holes; },
  };

})();
