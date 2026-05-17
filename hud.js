/**
 * game.js — Contrôleur principal du jeu
 *
 * Ce module orchestre tous les autres :
 *   - Machine à états (MENU → PLAYING → GAMEOVER)
 *   - Boucle de jeu (requestAnimationFrame)
 *   - Gestion de la vitesse et du score
 *   - Collisions entre systèmes
 *   - Transition entre écrans
 */

const Game = (() => {

  // ─── Machine à états ─────────────────────────
  const STATE = { MENU: 0, PLAYING: 1, GAMEOVER: 2 };
  let currentState = STATE.MENU;

  // ─── Données de partie ───────────────────────
  let score       = 0;
  let coins       = 0;
  let gameSpeed   = CONFIG.SPEED_INITIAL;
  let distance    = 0;
  let frame       = 0;
  let lastTime    = 0;
  let animId      = null;
  let hiScore     = parseInt(localStorage.getItem('shadowrunner_hiscore') || '0');

  // Floating texts (pièces, bonus)
  let floatingTexts = [];

  // ─── Éléments DOM ────────────────────────────
  const screens = {
    menu:     document.getElementById('screen-menu'),
    game:     document.getElementById('screen-game'),
    gameover: document.getElementById('screen-gameover'),
  };

  // ─── Init ─────────────────────────────────────

  function init() {
    // Initialiser le renderer (canvas)
    Renderer.init();

    // Initialiser l'audio
    AudioSystem.init();
    AudioSystem.loadAll();

    // Boutons
    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-replay').addEventListener('click', startGame);
    document.getElementById('btn-menu').addEventListener('click', showMenu);

    // Menu score
    document.getElementById('menu-hiscore').textContent = hiScore;

    // Lancer l'animation du menu
    showMenu();
    runMenuAnimation();
  }

  // ─── Transitions d'écrans ─────────────────────

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });
  }

  function showMenu() {
    currentState = STATE.MENU;
    showScreen('menu');
    cancelAnimationFrame(animId);
  }

  function showGameOver() {
    currentState = STATE.GAMEOVER;
    showScreen('gameover');

    // Mise à jour du high score
    if (score > hiScore) {
      hiScore = Math.floor(score);
      localStorage.setItem('shadowrunner_hiscore', hiScore);
    }

    // Affichage stats
    document.getElementById('go-score').textContent = Math.floor(score).toLocaleString();
    document.getElementById('go-coins').textContent = coins;
    document.getElementById('go-best').textContent  = hiScore.toLocaleString();
  }

  // ─── Démarrage de partie ──────────────────────

  function startGame() {
    AudioSystem.init();  // doit être appelé après geste utilisateur

    // Réinitialiser tous les systèmes
    score     = 0;
    coins     = 0;
    gameSpeed = CONFIG.SPEED_INITIAL;
    distance  = 0;
    frame     = 0;
    floatingTexts = [];

    Player.init();
    Monster.init();
    ObstacleSystem.init();
    CoinSystem.init();
    ParticleSystem.init();
    ParallaxSystem.init();
    HUD.init();

    showScreen('game');
    currentState = STATE.PLAYING;

    cancelAnimationFrame(animId);
    lastTime = performance.now();
    animId   = requestAnimationFrame(gameLoop);
  }

  // ─── Boucle de jeu ────────────────────────────

  function gameLoop(timestamp) {
    if (currentState !== STATE.PLAYING) return;

    const dt = Math.min(timestamp - lastTime, 50); // cap à 50ms (anti-freeze)
    lastTime  = timestamp;
    frame++;

    update(dt);
    draw();

    animId = requestAnimationFrame(gameLoop);
  }

  // ─── Update ───────────────────────────────────

  function update(dt) {
    // ─── Vitesse (accélération progressive) ──
    gameSpeed = Math.min(
      CONFIG.SPEED_MAX,
      CONFIG.SPEED_INITIAL + distance * CONFIG.SPEED_INCREMENT
    );

    // ─── Distance & score ─────────────────────
    distance += gameSpeed;
    score    += gameSpeed * CONFIG.SCORE.distanceFactor;

    // Paliers de score (afficher un message)
    checkMilestones();

    // ─── Systèmes ─────────────────────────────
    ParallaxSystem.update(gameSpeed);
    Player.update(dt, ObstacleSystem.holes);
    Monster.update(gameSpeed / CONFIG.SPEED_INITIAL, dt);
    ObstacleSystem.update(gameSpeed, distance);
    CoinSystem.update(gameSpeed);
    ParticleSystem.update();

    // Floating texts
    floatingTexts = floatingTexts
      .map(t => ({ ...t, y: t.y - 1, alpha: t.alpha - 0.015 }))
      .filter(t => t.alpha > 0);

    // ─── Collisions ───────────────────────────
    if (!Player.isDead) {
      const hitbox = Player.getHitbox();

      // Obstacles
      const { hit, obstacle, bouncy } = ObstacleSystem.checkCollision(hitbox);
      if (hit) {
        if (bouncy) {
          // Trampoline → rebond
          Player.bounce(-20);
          Monster.boost();
        } else {
          // Collision fatale
          Player.kill('obstacle');
        }
      }

      // Pièces
      const newCoins = CoinSystem.checkCollection(hitbox);
      if (newCoins > 0) {
        coins += newCoins;
        score += newCoins * CONFIG.SCORE.coinBonus;
        HUD.update(score, coins, gameSpeed / CONFIG.SPEED_INITIAL);
        addFloatingText(`+${newCoins * CONFIG.SCORE.coinBonus}`, hitbox.x + hitbox.w, hitbox.y - 10);
      }

      // Monstre rattrapé
      if (Monster.hasCaught()) {
        Player.kill('monster');
      }
    }

    // ─── Game Over trigger ─────────────────────
    if (Player.isDead && Player.state.y > CONFIG.CANVAS_HEIGHT + 100) {
      // Attendre que le joueur soit sorti de l'écran
      setTimeout(showGameOver, 600);
      currentState = STATE.GAMEOVER;
      return;
    }

    // ─── HUD ──────────────────────────────────
    HUD.update(score, coins, gameSpeed / CONFIG.SPEED_INITIAL);
  }

  // ─── Draw ─────────────────────────────────────

  function draw() {
    const ctx = Renderer.ctx;
    Renderer.clear();

    // ─── 1. Fond parallax ─────────────────────
    ParallaxSystem.draw(ctx, ObstacleSystem.holes);

    // ─── 2. Pièces ────────────────────────────
    CoinSystem.draw(ctx);

    // ─── 3. Obstacles ─────────────────────────
    ObstacleSystem.draw(ctx);

    // ─── 4. Particules (derrière le joueur) ───
    ParticleSystem.draw(ctx);

    // ─── 5. Joueur ────────────────────────────
    Player.draw(ctx);

    // ─── 6. Monstre ───────────────────────────
    Monster.draw(ctx);

    // ─── 7. Effets HUD canvas ─────────────────
    HUD.drawSpeedLines(ctx, gameSpeed);
    HUD.drawDangerOverlay(ctx, Monster.proximity);
    HUD.drawMilestone(ctx);

    // Floating texts
    floatingTexts.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      HUD.drawFloatingText(ctx, t.text, t.x, t.y, t.color, 12);
      ctx.restore();
    });
  }

  // ─── Helpers ──────────────────────────────────

  let lastMilestone = 0;
  function checkMilestones() {
    const milestones = [100, 250, 500, 1000, 2000, 5000];
    const sc = Math.floor(score);
    for (const m of milestones) {
      if (sc >= m && lastMilestone < m) {
        lastMilestone = m;
        HUD.showMilestone(`🏆 ${m} pts !`);
      }
    }
  }

  function addFloatingText(text, x, y, color = '#ffd32a') {
    floatingTexts.push({ text, x, y, color, alpha: 1 });
  }

  // ─── Animation du menu ────────────────────────
  // Fond animé sur l'écran titre

  function runMenuAnimation() {
    const canvas = document.getElementById('menu-bg-canvas');
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    let t = 0;

    function animMenu() {
      if (currentState !== STATE.MENU) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.4;

      // Étoiles filantes
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth   = 1;
      for (let i = 0; i < 5; i++) {
        const x  = (t * (30 + i * 20) + i * 400) % (canvas.width + 100);
        const y  = 50 + i * 80 + Math.sin(t * 0.02 + i) * 30;
        const len = 40 + i * 15;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - len, y);
        ctx.stroke();
      }

      // Particules montantes
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 8; i++) {
        const x = (Math.sin(t * 0.01 + i * 1.3) * 0.5 + 0.5) * canvas.width;
        const y = (canvas.height - ((t * (0.5 + i * 0.3) + i * 100) % canvas.height));
        ctx.fillStyle = i % 3 === 0 ? '#7c3aed' : i % 3 === 1 ? '#ff4757' : '#ffd32a';
        ctx.beginPath();
        ctx.arc(x, y, 2 + i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      requestAnimationFrame(animMenu);
    }
    animMenu();
  }

  // ─── Démarrage ────────────────────────────────

  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API publique (pour debug)
  return {
    startGame, showMenu,
    get score()    { return score; },
    get coins()    { return coins; },
    get speed()    { return gameSpeed; },
  };

})();
