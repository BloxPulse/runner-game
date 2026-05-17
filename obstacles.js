/**
 * monster.js — Système du monstre poursuivant
 *
 * Le monstre suit le joueur à une distance variable.
 * Plus le jeu est rapide, plus le monstre se rapproche.
 * Si le joueur rate un obstacle, le monstre gagne du terrain.
 * La proximité est affichée dans la barre de danger du HUD.
 */

const Monster = (() => {

  const M  = CONFIG.MONSTER;
  const GY = CONFIG.GROUND_Y;
  const W  = CONFIG.CANVAS_WIDTH;

  let state = {
    x:         M.startOffset,     // Position X (peut être hors écran à gauche)
    y:         GY - M.height,
    width:     M.width,
    height:    M.height,

    proximity: 0,                  // 0 = loin, 1 = a rattrapé
    frame:     0,
    roarTimer: 0,                  // compte à rebours avant rugissement
    isRoaring: false,
  };

  /** Initialise le monstre */
  function init() {
    state.x         = M.startOffset;
    state.y         = GY - M.height;
    state.proximity = 0;
    state.frame     = 0;
    state.roarTimer = 0;
    state.isRoaring = false;
    return state;
  }

  /**
   * Met à jour la position et la proximité du monstre.
   * @param {number} gameSpeed   vitesse actuelle du jeu
   * @param {number} dt          delta time (ms)
   */
  function update(gameSpeed, dt) {
    state.frame++;

    // La distance cible entre le monstre et le joueur
    // diminue avec la vitesse (il se rapproche naturellement)
    const targetX      = CONFIG.PLAYER.x - 200 - (20 / gameSpeed) * 100;
    const catchUpSpeed = gameSpeed * M.catchUpRate;

    // Déplacement vers la cible
    state.x += (targetX - state.x) * catchUpSpeed;

    // Rugissement périodique (effet de terreur)
    state.roarTimer -= dt;
    if (state.roarTimer <= 0) {
      state.isRoaring = true;
      state.roarTimer = 4000 + Math.random() * 3000;
      setTimeout(() => { state.isRoaring = false; }, 600);
    }

    // Proximité (0 = loin, 1 = game over)
    const gap = CONFIG.PLAYER.x - (state.x + state.width);
    state.proximity = 1 - Math.min(1, Math.max(0, gap / 300));
  }

  /**
   * Le monstre accélère quand le joueur échoue.
   * Appelé depuis game.js lors d'une collision non-fatale.
   */
  function boost() {
    state.x += M.speedBoostOnObstacle * 60;
  }

  /**
   * Retourne true si le monstre a rattrapé le joueur.
   */
  function hasCaught() {
    return state.x + state.width >= CONFIG.PLAYER.x + CONFIG.PLAYER.width * 0.4;
  }

  /** Dessine le monstre et ses effets */
  function draw(ctx) {
    // Aura de danger (plus proche = plus intense)
    if (state.proximity > 0.4) {
      const alpha = (state.proximity - 0.4) * 0.6;
      const aura  = ctx.createRadialGradient(
        state.x + state.width, state.y + state.height / 2, 0,
        state.x + state.width, state.y + state.height / 2, 150 * state.proximity
      );
      aura.addColorStop(0, `rgba(255,20,20,${alpha})`);
      aura.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(
        state.x + state.width, state.y + state.height / 2,
        150 * state.proximity, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // Rugissement visuel
    if (state.isRoaring) {
      drawRoarEffect(ctx);
    }

    // Corps du monstre
    Renderer.drawMonster(state.x, state.y, state.width, state.height, state.frame);

    // Empreintes / poussière sous le monstre
    if (state.frame % 6 === 0 && typeof ParticleSystem !== 'undefined') {
      ParticleSystem.burst('monsterDust', state.x + state.width * 0.5, GY);
    }
  }

  /** Effet visuel de rugissement */
  function drawRoarEffect(ctx) {
    const cx = state.x + state.width - 10;
    const cy = state.y + 50;

    ctx.save();
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++) {
      const r  = 30 + i * 25;
      const a  = 0.4 - i * 0.12;
      ctx.strokeStyle = `rgba(255,100,0,${a})`;
      ctx.lineWidth   = 3 - i;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 4, Math.PI / 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Met à jour la barre de danger dans le HUD */
  function updateDangerBar() {
    const fill = document.getElementById('danger-bar-fill');
    if (!fill) return;

    const pct = Math.round(state.proximity * 100);
    fill.style.width = `${pct}%`;

    // Couleur progressive : vert → orange → rouge
    if (state.proximity < 0.4) {
      fill.style.background = 'linear-gradient(90deg, #2ed573, #ffa502)';
    } else if (state.proximity < 0.75) {
      fill.style.background = 'linear-gradient(90deg, #ffa502, #ff4757)';
    } else {
      fill.style.background = `linear-gradient(90deg, #ff4757, #ff0000)`;
      fill.style.boxShadow  = '0 0 8px #ff0000';
    }
  }

  // API publique
  return {
    init, update, boost, hasCaught, draw, updateDangerBar,
    get state()     { return state; },
    get proximity() { return state.proximity; },
  };

})();
