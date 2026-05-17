/**
 * particles.js — Système de particules
 *
 * Génère des effets visuels (poussière, étincelles, confetti).
 * Chaque type de burst est paramétré dans la fonction burst().
 *
 * Pour ajouter un effet : ajouter un case dans burst().
 */

const ParticleSystem = (() => {

  let particles = [];

  /** Réinitialise toutes les particules */
  function init() {
    particles = [];
  }

  /**
   * Génère un burst de particules.
   * @param {string} type    'jump' | 'coin' | 'death' | 'dust' | 'bounce' | 'monsterDust'
   * @param {number} x, y   position du burst
   */
  function burst(type, x, y) {
    switch (type) {

      case 'jump':
        for (let i = 0; i < CONFIG.PARTICLES.jumpCount; i++) {
          particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * -3 - 1,
            size:  3 + Math.random() * 4,
            color: '#7c3aed',
            alpha: 0.8,
            decay: 0.04 + Math.random() * 0.03,
            gravity: 0.15,
          });
        }
        break;

      case 'bounce':
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 8) * i - Math.PI / 2;
          particles.push({
            x, y,
            vx: Math.cos(angle) * (2 + Math.random() * 3),
            vy: Math.sin(angle) * (2 + Math.random() * 3),
            size:  2 + Math.random() * 3,
            color: '#74b9ff',
            alpha: 0.9,
            decay: 0.05,
            gravity: 0.1,
          });
        }
        break;

      case 'coin':
        for (let i = 0; i < CONFIG.PARTICLES.coinCount; i++) {
          const angle = (Math.PI * 2 / CONFIG.PARTICLES.coinCount) * i;
          particles.push({
            x, y,
            vx: Math.cos(angle) * (1 + Math.random() * 3),
            vy: Math.sin(angle) * (1 + Math.random() * 3) - 2,
            size:  2 + Math.random() * 3,
            color: Math.random() > 0.5 ? '#ffd32a' : '#ffe566',
            alpha: 1,
            decay: 0.04 + Math.random() * 0.04,
            gravity: 0.12,
          });
        }
        break;

      case 'death':
        for (let i = 0; i < CONFIG.PARTICLES.deathCount; i++) {
          particles.push({
            x: x + (Math.random() - 0.5) * 40,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * -6 - 2,
            size:  4 + Math.random() * 8,
            color: Math.random() > 0.5 ? '#ff4757' : '#ffa502',
            alpha: 1,
            decay: 0.025 + Math.random() * 0.02,
            gravity: 0.25,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.2,
          });
        }
        break;

      case 'dust':
        for (let i = 0; i < CONFIG.PARTICLES.dustCount; i++) {
          particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y,
            vx: (Math.random() - 0.5) * 2 - 1,
            vy: -Math.random() * 1.5,
            size:  2 + Math.random() * 2,
            color: '#7c3aed',
            alpha: 0.5,
            decay: 0.05 + Math.random() * 0.05,
            gravity: -0.02,
          });
        }
        break;

      case 'monsterDust':
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: x + (Math.random() - 0.5) * 30,
            y,
            vx: -Math.random() * 2 - 1,
            vy: -Math.random() * 1,
            size:  4 + Math.random() * 4,
            color: '#4a0000',
            alpha: 0.6,
            decay: 0.04,
            gravity: -0.01,
          });
        }
        break;
    }
  }

  /** Met à jour toutes les particules */
  function update() {
    particles = particles.filter(p => p.alpha > 0.01);
    particles.forEach(p => {
      p.x     += p.vx;
      p.y     += p.vy;
      p.vy    += p.gravity || 0;
      p.alpha -= p.decay;
      if (p.rotation !== undefined) p.rotation += p.rotSpeed;
    });
  }

  /** Dessine toutes les particules */
  function draw(ctx) {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle   = p.color;

      if (p.rotation !== undefined) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // API publique
  return { init, burst, update, draw };

})();
