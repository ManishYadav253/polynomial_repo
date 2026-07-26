/* ══════════════════════════════════════════════════════════
   PARTICLES — Canvas-based floating math symbol background
══════════════════════════════════════════════════════════ */
(function _initParticleSystem() {
  const canvas  = document.getElementById('particle-canvas');
  const ctx     = canvas.getContext('2d');
  const SYMBOLS = ['∫', '∂', 'Σ', 'π', '∞', '√', 'Δ', 'λ', 'α', 'β', 'γ', '∇', '≈', 'φ', 'θ', '±', '∈', '⊂'];
  const MAX     = 55;
  let W, H, particles = [], mouse = { x: -999, y: -999 };
  let animFrame;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function createParticle() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      x:     rnd(0, W),
      y:     rnd(0, H),
      vx:    rnd(-0.15, 0.15),
      vy:    rnd(-0.35, -0.12),
      size:  rnd(10, 26),
      alpha: rnd(0.04, 0.18),
      sym:   SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      hue:   Math.random() < 0.6 ? 240 : (Math.random() < 0.5 ? 270 : 195),  // indigo/violet/cyan
      life:  0,
      maxLife: rnd(200, 600)
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < MAX; i++) {
      const p = createParticle();
      p.y = rnd(0, H); // random initial y
      p.life = rnd(0, p.maxLife);
      particles.push(p);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    particles.forEach((p, i) => {
      p.life++;
      if (p.life > p.maxLife) {
        particles[i] = createParticle();
        particles[i].x = rnd(0, W);
        particles[i].y = H + 30;
        return;
      }

      // Mouse repulsion
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) {
        p.x += dx / dist * 1.2;
        p.y += dy / dist * 1.2;
      }

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -40) p.x = W + 40;
      if (p.x > W + 40) p.x = -40;

      const progress = p.life / p.maxLife;
      const alpha = p.alpha * Math.sin(progress * Math.PI); // fade in/out

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${p.size}px JetBrains Mono, monospace`;
      ctx.fillStyle = isDark
        ? `hsl(${p.hue}, 80%, 75%)`
        : `hsl(${p.hue}, 60%, 45%)`;
      ctx.fillText(p.sym, p.x, p.y);
      ctx.restore();
    });

    animFrame = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); initParticles(); });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  resize();
  initParticles();
  draw();

  // Re-init on theme change
  document.addEventListener('themechange', () => { initParticles(); });
})();
