/**
 * hud.js — Interface joueur (HUD)
 *
 * Met à jour les éléments du HUD HTML :
 *   - Score (distance)
 *   - Pièces ramassées
 *   - Vitesse actuelle
 *   - Barre de danger monstre
 *
 * Les éléments sont en HTML/CSS pour des performances optimales.
 */

const HUD = (() => {

  // Références aux éléments HTML
  let elScore, elCoins, elSpeed;
  let lastScore = -1, lastCoins = -1, lastSpeed = -1;

  function init() {
    elScore = document.getElementById('hud-score');
    elCoins = document.getElementById('hud-coins');
    elSpeed = document.getElementById('hud-speed');
    lastScore = lastCoins = lastSpeed = -1;
  }

  /**
   * Met à jour le HUD avec les données du jeu.
   * N'écrit dans le DOM que si la valeur a changé (perf).
   */
  function update(score, coins, speed) {
    const sc = Math.floor(score);
    const sp = speed.toFixed(1);

    if (sc !== lastScore) {
      elScore.textContent = sc.toLocaleString();
      lastScore = sc;
    }
    if (coins !== lastCoins) {
      elCoins.textContent = `🪙 ${coins}`;
      lastCoins = coins;
    }
    if (sp !== lastSpeed) {
      elSpeed.textContent = `${sp}x`;
      lastSpeed = sp;

      // Couleur vitesse : vert → orange → rouge
      const ratio = (speed - CONFIG.SPEED_INITIAL) / (CONFIG.SPEED_MAX - CONFIG.SPEED_INITIAL);
      if (ratio < 0.4) elSpeed.style.color = '#2ed573';
      else if (ratio < 0.75) elSpeed.style.color = '#ffa502';
      else elSpeed.style.color = '#ff4757';
    }

    // Monstre
    Monster.updateDangerBar();
  }

  /**
   * Affiche un message flottant sur le canvas
   * (score bonus, pièce, etc.)
   */
  function drawFloatingText(ctx, text, x, y, color = '#ffd32a', size = 16) {
    ctx.save();
    ctx.fillStyle   = color;
    ctx.font        = `bold ${size}px 'Press Start 2P', monospace`;
    ctx.textAlign   = 'center';
    ctx.shadowColor = color;
    ctx.shadowBlur  = 8;
    ctx.fillText(text, x, y);
    ctx.textAlign   = 'left';
    ctx.shadowBlur  = 0;
    ctx.restore();
  }

  /**
   * Affiche le score milliaire (+500, +1000…) en overlay.
   */
  let milestoneMsg   = '';
  let milestoneTimer = 0;
  let milestoneY     = 120;

  function showMilestone(msg) {
    milestoneMsg   = msg;
    milestoneTimer = 120; // frames
    milestoneY     = 120;
  }

  function drawMilestone(ctx) {
    if (milestoneTimer <= 0) return;

    const alpha = Math.min(1, milestoneTimer / 20);
    milestoneY -= 0.3;
    milestoneTimer--;

    ctx.save();
    ctx.globalAlpha = alpha;
    drawFloatingText(ctx, milestoneMsg, CONFIG.CANVAS_WIDTH / 2, milestoneY, '#ffd32a', 18);
    ctx.restore();
  }

  /**
   * Effet d'écran rouge quand le monstre est très proche
   */
  function drawDangerOverlay(ctx, proximity) {
    if (proximity < 0.7) return;
    const alpha = (proximity - 0.7) * 0.25;
    ctx.save();
    ctx.fillStyle = `rgba(255,0,0,${alpha})`;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.restore();
  }

  /**
   * Lignes de vitesse (effet visuel à haute vitesse)
   */
  function drawSpeedLines(ctx, speed) {
    const ratio = (speed - 10) / (CONFIG.SPEED_MAX - 10);
    if (ratio <= 0) return;

    const count = Math.floor(ratio * 12);
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${ratio * 0.06})`;
    ctx.lineWidth   = 1;

    for (let i = 0; i < count; i++) {
      const y = Math.random() * CONFIG.CANVAS_HEIGHT;
      const len = 40 + Math.random() * 80;
      ctx.beginPath();
      ctx.moveTo(Math.random() * CONFIG.CANVAS_WIDTH, y);
      ctx.lineTo(Math.random() * CONFIG.CANVAS_WIDTH - len, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // API publique
  return {
    init, update,
    drawFloatingText, drawMilestone, showMilestone,
    drawDangerOverlay, drawSpeedLines,
  };

})();
