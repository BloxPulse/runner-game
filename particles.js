/**
 * parallax.js — Système de décor parallax multi-couches
 *
 * Génère et anime les couches de fond en arrière-plan.
 * Chaque couche défile à une vitesse différente (effet de profondeur).
 *
 * Pour ajouter une couche : modifier CONFIG.PARALLAX
 * et ajouter son rendu dans la fonction drawLayer().
 */

const ParallaxSystem = (() => {

  const W = CONFIG.CANVAS_WIDTH;
  const H = CONFIG.CANVAS_HEIGHT;
  const GY = CONFIG.GROUND_Y;

  // Offsets de défilement pour chaque couche
  let offsets = {};
  let layers  = [];

  // Éléments décoratifs pré-générés (montagnes, nuages, arbres…)
  let decorElements = {};

  /** Initialise le système, génère les éléments décoratifs */
  function init() {
    layers  = CONFIG.PARALLAX;
    offsets = {};

    layers.forEach(layer => {
      offsets[layer.id] = 0;

      // Génère les éléments pour chaque couche
      if (layer.id === 'mountains') {
        decorElements.mountains = generateMountains(3, W * 2.5, 120, 250);
      }
      if (layer.id === 'hills_far') {
        decorElements.hills_far = generateHills(6, W * 2, 60, 140, '#0f3460');
      }
      if (layer.id === 'hills_near') {
        decorElements.hills_near = generateHills(8, W * 1.5, 40, 100, '#1a0533');
        decorElements.trees = generateTrees(12, W * 1.5);
      }
    });
  }

  /** Met à jour les offsets selon la vitesse du jeu */
  function update(gameSpeed) {
    layers.forEach(layer => {
      offsets[layer.id] -= gameSpeed * layer.factor;
    });
  }

  /** Dessine toutes les couches de fond */
  function draw(ctx, holes = []) {
    // ─── 1. Ciel (gradient) ───────────────────
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GY);
    skyGrad.addColorStop(0,   '#0a0a1a');
    skyGrad.addColorStop(0.6, '#1a0533');
    skyGrad.addColorStop(1,   '#2d0b4e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, GY);

    // ─── 2. Étoiles (fixes) ───────────────────
    drawStars(ctx);

    // ─── 3. Lune ─────────────────────────────
    drawMoon(ctx);

    // ─── 4. Montagnes lointaines ──────────────
    if (decorElements.mountains) {
      drawScrolledShapes(ctx, decorElements.mountains, offsets.mountains, '#16213e', GY);
    }

    // ─── 5. Collines lointaines ───────────────
    if (decorElements.hills_far) {
      drawScrolledShapes(ctx, decorElements.hills_far, offsets.hills_far, '#0f3460', GY);
    }

    // ─── 6. Collines proches + arbres ─────────
    if (decorElements.hills_near) {
      drawScrolledShapes(ctx, decorElements.hills_near, offsets.hills_near, '#1a0533', GY);
    }
    if (decorElements.trees) {
      drawTrees(ctx, decorElements.trees, offsets.hills_near);
    }

    // ─── 7. Sol ───────────────────────────────
    drawGround(ctx, holes);

    // ─── 8. Lignes de vitesse (si rapide) ─────
    // Appelé séparément par le jeu si besoin
  }

  /** Dessine le sol avec les trous */
  function drawGround(ctx, holes = []) {
    const groundH = H - GY;

    // Fond du sol
    const groundGrad = ctx.createLinearGradient(0, GY, 0, H);
    groundGrad.addColorStop(0, '#1a1a2e');
    groundGrad.addColorStop(0.2, '#0d0d1a');
    groundGrad.addColorStop(1, '#050508');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GY, W, groundH);

    // Ligne de sol lumineuse
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth   = 2;
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.moveTo(0, GY);

    // Masquer les trous
    let lastX = 0;
    holes.forEach(hole => {
      if (hole.x > lastX && hole.x < W) {
        ctx.lineTo(hole.x, GY);
        ctx.moveTo(hole.x + hole.w, GY);
        lastX = hole.x + hole.w;
      }
    });
    ctx.lineTo(W, GY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Grille de sol animée
    drawGroundGrid(ctx, holes);

    // Noircir les trous
    holes.forEach(hole => {
      if (hole.x < W && hole.x + hole.w > 0) {
        const hx = Math.max(0, hole.x);
        const hw = Math.min(W, hole.x + hole.w) - hx;

        // Trou = noir avec gradient de profondeur
        const holeGrad = ctx.createLinearGradient(hx, GY, hx, H);
        holeGrad.addColorStop(0, '#000000');
        holeGrad.addColorStop(1, '#0a0005');
        ctx.fillStyle = holeGrad;
        ctx.fillRect(hx, GY, hw, groundH);

        // Bords du trou lumineux (danger)
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth   = 1;
        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur  = 6;
        ctx.beginPath();
        ctx.moveTo(hx, GY);
        ctx.lineTo(hx, GY + 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx + hw, GY);
        ctx.lineTo(hx + hw, GY + 20);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });
  }

  /** Lignes de grille au sol */
  function drawGroundGrid(ctx, holes) {
    // Offset lié à l'offset du sol
    const gridOffset = (-offsets.ground) % 60;

    ctx.strokeStyle = 'rgba(124,58,237,0.15)';
    ctx.lineWidth   = 1;

    // Lignes verticales
    for (let x = -gridOffset; x < W; x += 60) {
      // Éviter de dessiner dans les trous
      const blocked = holes.some(h => x > h.x && x < h.x + h.w);
      if (!blocked) {
        ctx.beginPath();
        ctx.moveTo(x, GY);
        ctx.lineTo(x - 30, H);
        ctx.stroke();
      }
    }

    // Lignes horizontales (perspective)
    for (let i = 0; i < 5; i++) {
      const y = GY + i * (H - GY) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  // ─── Étoiles fixes ────────────────────────────

  let stars = null;
  function buildStars() {
    stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x:    Math.random() * W,
        y:    Math.random() * GY * 0.85,
        r:    Math.random() * 1.5 + 0.3,
        blink: Math.random() * Math.PI * 2,
      });
    }
  }
  function drawStars(ctx) {
    if (!stars) buildStars();
    const t = Date.now() * 0.001;
    stars.forEach(s => {
      const alpha = 0.4 + Math.sin(t + s.blink) * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawMoon(ctx) {
    const mx = W * 0.8, my = 70, mr = 35;
    // Halo
    const halo = ctx.createRadialGradient(mx, my, mr, mx, my, mr * 3);
    halo.addColorStop(0, 'rgba(200,200,255,0.12)');
    halo.addColorStop(1, 'rgba(200,200,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 3, 0, Math.PI * 2);
    ctx.fill();
    // Lune
    ctx.fillStyle = '#d0d8f0';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    // Phase (ombre)
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(mx + 10, my, mr * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Générateurs procéduraux ──────────────────

  function generateMountains(count, totalW, minH, maxH) {
    const elems = [];
    let x = 0;
    while (x < totalW) {
      const w = 180 + Math.random() * 200;
      const h = minH + Math.random() * (maxH - minH);
      elems.push({ x, w, h, shade: 0.8 + Math.random() * 0.3 });
      x += w * 0.6 + Math.random() * 60;
    }
    return elems;
  }

  function generateHills(count, totalW, minH, maxH, color) {
    const elems = [];
    let x = 0;
    while (x < totalW) {
      const w = 80 + Math.random() * 150;
      const h = minH + Math.random() * (maxH - minH);
      elems.push({ x, w, h });
      x += w * 0.7 + Math.random() * 40;
    }
    return elems;
  }

  function generateTrees(count, totalW) {
    const trees = [];
    for (let i = 0; i < count; i++) {
      trees.push({
        x:      Math.random() * totalW,
        h:      50 + Math.random() * 60,
        w:      20 + Math.random() * 20,
        type:   Math.random() > 0.5 ? 'pine' : 'dead',
      });
    }
    return trees;
  }

  function drawScrolledShapes(ctx, elems, offset, baseColor, groundY) {
    elems.forEach(el => {
      const totalW = elems[elems.length - 1].x + 300;
      const sx     = ((el.x + offset) % totalW + totalW) % totalW;

      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.moveTo(sx, groundY);
      ctx.lineTo(sx + el.w / 2, groundY - el.h);
      ctx.lineTo(sx + el.w, groundY);
      ctx.closePath();
      ctx.fill();

      // Neige sur les montagnes
      if (el.h > 160) {
        ctx.fillStyle = 'rgba(220,230,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(sx + el.w * 0.35, groundY - el.h * 0.7);
        ctx.lineTo(sx + el.w / 2, groundY - el.h);
        ctx.lineTo(sx + el.w * 0.65, groundY - el.h * 0.7);
        ctx.closePath();
        ctx.fill();
      }
    });
  }

  function drawTrees(ctx, trees, offset) {
    const totalW = CONFIG.CANVAS_WIDTH * 1.5;
    trees.forEach(tree => {
      const sx = ((tree.x + offset) % totalW + totalW) % totalW;
      const ty = GY - tree.h;

      if (tree.type === 'pine') {
        ctx.fillStyle = '#0d2b1a';
        // Trois triangles
        [[0.5, 0], [0.4, 0.35], [0.3, 0.6]].forEach(([relW, relH]) => {
          ctx.beginPath();
          ctx.moveTo(sx, ty + tree.h * relH);
          ctx.lineTo(sx + tree.w / 2, ty + tree.h * relH - tree.h * 0.35);
          ctx.lineTo(sx + tree.w, ty + tree.h * relH);
          ctx.fill();
        });
        ctx.fillStyle = '#1a3a28';
        ctx.fillRect(sx + tree.w * 0.4, ty + tree.h * 0.7, tree.w * 0.2, tree.h * 0.3);
      } else {
        // Arbre mort
        ctx.strokeStyle = '#1a0a00';
        ctx.lineWidth   = 3;
        ctx.beginPath();
        ctx.moveTo(sx + tree.w / 2, GY);
        ctx.lineTo(sx + tree.w / 2, ty + tree.h * 0.3);
        ctx.stroke();
        // Branches
        ctx.lineWidth = 2;
        [[-1, 0.4], [1, 0.5], [-0.7, 0.6]].forEach(([dir, frac]) => {
          ctx.beginPath();
          ctx.moveTo(sx + tree.w / 2, ty + tree.h * frac);
          ctx.lineTo(sx + tree.w / 2 + dir * tree.w * 0.6, ty + tree.h * frac - tree.h * 0.2);
          ctx.stroke();
        });
      }
    });
  }

  // API publique
  return { init, update, draw, drawGround };

})();
