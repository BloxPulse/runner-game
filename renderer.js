/**
 * player.js — Système joueur
 *
 * Gère la physique du joueur (gravité, saut, glissade),
 * les états (run, jump, slide, dead),
 * et les inputs clavier / tactile.
 */

const Player = (() => {

  const P  = CONFIG.PLAYER;
  const GY = CONFIG.GROUND_Y;

  // État courant du joueur
  let state = {
    x:         P.x,
    y:         GY - P.height,   // position (coin haut-gauche)
    vy:        0,                // vélocité verticale
    width:     P.width,
    height:    P.height,

    onGround:  false,
    jumpsLeft: 2,                // 2 = double saut possible

    isSliding:     false,
    slideTimer:    0,
    isSlidePressed: false,

    isDead:    false,
    animFrame: 0,
    skinIndex: CONFIG.activeSkin,

    // Trail de particules visuelles
    trail: [],
  };

  // Flags d'input
  const keys = {
    jump:  false,
    slide: false,
    jumpPressed:  false,  // front montant
    slidePressed: false,
  };

  // ─── Initialisation ──────────────────────────

  function init() {
    state.x         = P.x;
    state.y         = GY - P.height;
    state.vy        = 0;
    state.onGround  = false;
    state.jumpsLeft = 2;
    state.isSliding = false;
    state.slideTimer= 0;
    state.isDead    = false;
    state.animFrame = 0;
    state.trail     = [];

    setupInput();
    return state;
  }

  // ─── Inputs ──────────────────────────────────

  function setupInput() {
    // Clavier
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);

    // Tactile (mobile)
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      triggerJump();
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      const dy = e.touches[0].clientY - touchStartY;
      if (dy > 40 && !keys.slide) {
        keys.slide    = true;
        keys.slidePressed = true;
        triggerSlide();
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      keys.slide = false;
    });
  }

  function onKeyDown(e) {
    if (e.repeat) return;
    if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') {
      keys.jumpPressed = true;
      triggerJump();
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      keys.slide    = true;
      keys.slidePressed = true;
      triggerSlide();
    }
  }

  function onKeyUp(e) {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      keys.slide = false;
    }
  }

  function triggerJump() {
    if (state.isDead) return;

    // Arrêter la glissade pour sauter
    if (state.isSliding) {
      state.isSliding  = false;
      state.height     = P.height;
      state.y          = GY - P.height;
    }

    if (state.jumpsLeft > 0) {
      const isDouble = state.jumpsLeft < 2;
      state.vy        = isDouble ? P.doubleJumpForce : P.jumpForce;
      state.onGround  = false;
      state.jumpsLeft--;

      AudioSystem.play(isDouble ? 'doubleJump' : 'jump');

      // Déclencher particules de saut
      if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.burst('jump', state.x + state.width / 2, state.y + state.height);
      }
    }
  }

  function triggerSlide() {
    if (state.isDead || !state.onGround) return;
    if (state.isSliding) return;

    state.isSliding  = true;
    state.slideTimer = P.slideDuration;
    state.height     = P.slideHeight;
    state.y          = GY - P.slideHeight;

    AudioSystem.play('slide');
  }

  // ─── Mise à jour ─────────────────────────────

  function update(dt, holes) {
    if (state.isDead) {
      updateDead(dt);
      return;
    }

    state.animFrame++;

    // ─── Gravité ──────────────────────────────
    state.vy += P.gravity;
    if (state.vy > P.maxFallSpeed) state.vy = P.maxFallSpeed;

    state.y += state.vy;

    // ─── Glissade timer ───────────────────────
    if (state.isSliding) {
      state.slideTimer -= dt;
      if (state.slideTimer <= 0 && !keys.slide) {
        // Fin de glissade
        state.isSliding = false;
        state.height    = P.height;
        state.y         = GY - P.height;
      }
    }

    // ─── Collision sol ────────────────────────
    const groundLimit = GY - state.height;

    // Vérifier si le joueur est au-dessus d'un trou
    const overHole = holes.some(h =>
      state.x + state.width * 0.6 > h.x &&
      state.x + state.width * 0.4 < h.x + h.w
    );

    if (!overHole && state.y >= groundLimit) {
      state.y        = groundLimit;
      state.vy       = 0;
      state.onGround = true;
      state.jumpsLeft = 2;

      // Trail de poussière
      if (state.animFrame % 4 === 0) {
        if (typeof ParticleSystem !== 'undefined') {
          ParticleSystem.burst('dust', state.x + state.width * 0.3, GY);
        }
      }
    } else if (overHole || state.y < groundLimit) {
      state.onGround = false;

      // Tombé dans un trou = mort
      if (state.y > GY + 50) {
        kill('hole');
      }
    }

    // ─── Trail visuel ─────────────────────────
    if (state.animFrame % 3 === 0) {
      state.trail.push({ x: state.x, y: state.y, alpha: 0.4 });
    }
    state.trail = state.trail
      .map(t => ({ ...t, alpha: t.alpha - 0.05 }))
      .filter(t => t.alpha > 0);

    // Reset flags
    keys.jumpPressed  = false;
    keys.slidePressed = false;
  }

  function updateDead(dt) {
    // Chute finale
    state.vy += P.gravity;
    state.y  += state.vy;
    state.animFrame++;
  }

  // ─── Collision avec obstacle ──────────────────

  /**
   * Retourne le hitbox du joueur (légèrement réduit pour la jouabilité)
   */
  function getHitbox() {
    const margin = 6;
    return {
      x: state.x + margin,
      y: state.y + margin,
      w: state.width  - margin * 2,
      h: state.height - margin,
    };
  }

  /**
   * Rebond sur trampoline
   */
  function bounce(force = -18) {
    state.vy        = force;
    state.onGround  = false;
    state.jumpsLeft = 2;
    AudioSystem.play('bounce');

    if (typeof ParticleSystem !== 'undefined') {
      ParticleSystem.burst('bounce', state.x + state.width / 2, state.y + state.height);
    }
  }

  /**
   * Tue le joueur
   */
  function kill(reason = 'obstacle') {
    if (state.isDead) return;
    state.isDead = true;
    state.vy     = -10;

    AudioSystem.play('gameover');

    if (typeof ParticleSystem !== 'undefined') {
      ParticleSystem.burst('death', state.x + state.width / 2, state.y + state.height / 2);
    }
  }

  // ─── Dessin ──────────────────────────────────

  function draw(ctx) {
    const skin = CONFIG.SKINS[state.skinIndex];

    // Trail
    state.trail.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle   = skin.trailColor;
      ctx.fillRect(t.x, t.y, state.width, state.height);
      ctx.restore();
    });

    // Déterminer l'état visuel
    let visualState = 'run';
    if (state.isDead)    visualState = 'dead';
    else if (state.isSliding) visualState = 'slide';
    else if (!state.onGround) visualState = 'jump';

    Renderer.drawPlayer(
      state.x, state.y,
      state.width, state.height,
      visualState, state.animFrame,
      skin.color
    );
  }

  // ─── Nettoyage ───────────────────────────────

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
  }

  // API publique
  return {
    init, update, draw, destroy,
    getHitbox, bounce, kill,
    get state() { return state; },
    get isDead() { return state.isDead; },
  };

})();
