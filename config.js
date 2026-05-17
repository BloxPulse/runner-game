/**
 * coins.js — Système de pièces
 *
 * Génère des pièces en lignes ou en arcs devant le joueur.
 * Les pièces s'animent et sont collectées par collision.
 */

const CoinSystem = (() => {

  const C  = CONFIG.COINS;
  const GY = CONFIG.GROUND_Y;
  const W  = CONFIG.CANVAS_WIDTH;

  let coins      = [];
  let spawnTimer = 0;
  let frame      = 0;

  /** Réinitialise */
  function init() {
    coins      = [];
    spawnTimer = 600;
    frame      = 0;
  }

  /** Met à jour pièces et collecte */
  function update(gameSpeed) {
    frame++;

    // Déplacement
    coins.forEach(c => { c.x -= gameSpeed; });

    // Nettoyage
    coins = coins.filter(c => !c.collected && c.x + C.radius > -40);

    // Spawn
    spawnTimer -= gameSpeed;
    if (spawnTimer <= 0) {
      if (Math.random() < C.spawnChance) {
        spawnLine();
      }
      spawnTimer = 350 + Math.random() * 400;
    }
  }

  /**
   * Génère une ligne droite ou un arc de pièces
   */
  function spawnLine() {
    const pattern = Math.random();
    const startX  = W + 40;
    const count   = C.lineLength + Math.floor(Math.random() * 4);

    if (pattern < 0.5) {
      // Ligne droite horizontale (au sol)
      const baseY = GY - C.radius * 2 - 30;
      for (let i = 0; i < count; i++) {
        coins.push(makeCoin(startX + i * (C.radius * 2 + 14), baseY));
      }
    } else if (pattern < 0.75) {
      // Arc parabolique (à sauter pour collecter)
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const x = startX + i * 32;
        const y = (GY - 120) - Math.sin(t * Math.PI) * 100;
        coins.push(makeCoin(x, y));
      }
    } else {
      // Escalier montant
      for (let i = 0; i < count; i++) {
        const x = startX + i * 36;
        const y = GY - 40 - i * 28;
        if (y > 60) coins.push(makeCoin(x, y));
      }
    }
  }

  function makeCoin(x, y) {
    return {
      x, y,
      collected: false,
      collectFrame: 0,  // pour l'animation de collecte
    };
  }

  /**
   * Vérifie la collecte par le joueur.
   * Retourne le nombre de pièces collectées ce frame.
   */
  function checkCollection(playerHitbox) {
    let collected = 0;
    coins.forEach(c => {
      if (c.collected) return;
      if (
        Math.abs(c.x - (playerHitbox.x + playerHitbox.w / 2)) < C.radius + playerHitbox.w / 2 &&
        Math.abs(c.y - (playerHitbox.y + playerHitbox.h / 2)) < C.radius + playerHitbox.h / 2
      ) {
        c.collected = true;
        collected++;
        AudioSystem.play('coin');

        // Particules de collecte
        if (typeof ParticleSystem !== 'undefined') {
          ParticleSystem.burst('coin', c.x, c.y);
        }
      }
    });
    return collected;
  }

  /** Dessine toutes les pièces */
  function draw(ctx) {
    coins.forEach(c => {
      if (!c.collected) Renderer.drawCoin(c, frame);
    });
  }

  // API publique
  return { init, update, checkCollection, draw };

})();
