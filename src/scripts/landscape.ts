// Hero figure: contour lines of a slowly drifting 2-D "loss landscape" with a
// handful of gradient-descent trajectories. Plain 2-D canvas, no dependencies.
// Renders a single static frame under prefers-reduced-motion and pauses while
// the figure is off-screen or the tab is hidden.

const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-landscape]');
if (canvas) start(canvas);

function start(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LEVELS = 12;
  const TRAIL = 36;
  const PARTICLES = 28;

  // Gaussian hills (a > 0) and valleys (a < 0) whose centres drift on slow
  // Lissajous paths, plus an optional valley that follows the pointer.
  const bumps = [
    { x: -0.85, y: -0.35, a: -1.0, s: 0.55, dx: 0.22, dy: 0.14, wx: 0.21, wy: 0.17, px: 0.0, py: 1.2 },
    { x: 0.85, y: 0.4, a: -0.85, s: 0.5, dx: 0.18, dy: 0.16, wx: 0.16, wy: 0.23, px: 2.1, py: 0.4 },
    { x: 0.05, y: -0.05, a: 0.9, s: 0.6, dx: 0.2, dy: 0.18, wx: 0.13, wy: 0.19, px: 4.0, py: 2.6 },
    { x: -0.45, y: 0.75, a: 0.6, s: 0.45, dx: 0.14, dy: 0.1, wx: 0.25, wy: 0.15, px: 1.0, py: 3.3 },
    { x: 0.95, y: -0.8, a: 0.55, s: 0.5, dx: 0.14, dy: 0.12, wx: 0.19, wy: 0.21, px: 5.2, py: 0.9 },
  ];
  const pointer = { x: 0, y: 0, active: false, strength: 0 };

  function field(x: number, y: number, time: number) {
    let v = 0.2 * (x * x - y * y); // gentle saddle so contours reach the edges
    for (const b of bumps) {
      const dx = x - (b.x + b.dx * Math.sin(time * b.wx + b.px));
      const dy = y - (b.y + b.dy * Math.cos(time * b.wy + b.py));
      v += b.a * Math.exp(-(dx * dx + dy * dy) / (b.s * b.s));
    }
    if (pointer.strength > 0.01) {
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      v -= 0.7 * pointer.strength * Math.exp(-(dx * dx + dy * dy) / 0.16);
    }
    return v;
  }

  // World space is x ∈ [-X, X], y ∈ [-1, 1] with square cells in pixel space.
  let W = 0;
  let H = 0;
  let X = 1.33;
  let cell = 8;
  let cols = 0;
  let rows = 0;
  let F = new Float32Array(0);
  let ink = '#000';
  let accent = '#a3242b';
  let t = Math.random() * 100;
  let last = 0;
  let visible = true;

  const toWorldX = (px: number) => -X + (px / W) * 2 * X;
  const toWorldY = (py: number) => -1 + (py / H) * 2;
  const toPxX = (x: number) => ((x + X) / (2 * X)) * W;
  const toPxY = (y: number) => ((y + 1) / 2) * H;

  type Particle = { x: number; y: number; trail: number[]; age: number; still: number; fading: boolean };
  const particles: Particle[] = [];
  function spawn(p: Particle) {
    // Prefer starting points on a hill so every trajectory has somewhere to go.
    for (let attempt = 0; attempt < 8; attempt++) {
      p.x = (Math.random() * 2 - 1) * X * 0.92;
      p.y = (Math.random() * 2 - 1) * 0.92;
      if (field(p.x, p.y, t) > 0.15) break;
    }
    p.trail = [];
    p.age = 0;
    p.still = 0;
    p.fading = false;
  }
  for (let i = 0; i < PARTICLES; i++) {
    const p: Particle = { x: 0, y: 0, trail: [], age: 0, still: 0, fading: false };
    spawn(p);
    particles.push(p);
  }

  function readColors() {
    const style = getComputedStyle(canvas);
    ink = style.color;
    accent = style.borderTopColor;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    X = W / H;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = Math.max(7, W / 88);
    cols = Math.ceil(W / cell);
    rows = Math.ceil(H / cell);
    F = new Float32Array((cols + 1) * (rows + 1));
    if (reduceMotion) drawStatic();
  }

  function sample(time: number) {
    const stride = cols + 1;
    for (let j = 0; j <= rows; j++) {
      const y = toWorldY(j * cell);
      for (let i = 0; i <= cols; i++) F[j * stride + i] = field(toWorldX(i * cell), y, time);
    }
  }

  // Marching squares over the sampled grid, one path per level.
  const frac = (p: number, q: number, v: number) => {
    const f = (v - p) / (q - p);
    return f < 0 ? 0 : f > 1 ? 1 : f;
  };
  function drawContours() {
    const c2d = ctx!;
    const stride = cols + 1;
    c2d.lineWidth = 1;
    c2d.lineJoin = 'round';
    c2d.strokeStyle = ink;
    const seg = (x1: number, y1: number, x2: number, y2: number) => {
      c2d.moveTo(x1, y1);
      c2d.lineTo(x2, y2);
    };
    for (let k = 0; k < LEVELS; k++) {
      const v = -1.1 + ((k + 0.5) * 2.2) / LEVELS;
      c2d.globalAlpha = 0.1 + 0.32 * (1 - (v + 1.1) / 2.2); // valleys drawn darker
      c2d.beginPath();
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const o = j * stride + i;
          const a = F[o];
          const b = F[o + 1];
          const c = F[o + stride + 1];
          const d = F[o + stride];
          const idx = (a > v ? 8 : 0) | (b > v ? 4 : 0) | (c > v ? 2 : 0) | (d > v ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          const x0 = i * cell;
          const y0 = j * cell;
          const tx = x0 + cell * frac(a, b, v), ty = y0;
          const rx = x0 + cell, ry = y0 + cell * frac(b, c, v);
          const bx = x0 + cell * frac(d, c, v), by = y0 + cell;
          const lx = x0, ly = y0 + cell * frac(a, d, v);
          switch (idx) {
            case 1: case 14: seg(lx, ly, bx, by); break;
            case 2: case 13: seg(bx, by, rx, ry); break;
            case 3: case 12: seg(lx, ly, rx, ry); break;
            case 4: case 11: seg(tx, ty, rx, ry); break;
            case 6: case 9: seg(tx, ty, bx, by); break;
            case 7: case 8: seg(lx, ly, tx, ty); break;
            case 5:
              if ((a + b + c + d) / 4 > v) { seg(lx, ly, tx, ty); seg(bx, by, rx, ry); }
              else { seg(lx, ly, bx, by); seg(tx, ty, rx, ry); }
              break;
            case 10:
              if ((a + b + c + d) / 4 > v) { seg(tx, ty, rx, ry); seg(lx, ly, bx, by); }
              else { seg(tx, ty, lx, ly); seg(rx, ry, bx, by); }
              break;
          }
        }
      }
      c2d.stroke();
    }
    c2d.globalAlpha = 1;
  }

  const g = [0, 0];
  function gradient(x: number, y: number, time: number) {
    const h = 0.004;
    g[0] = (field(x + h, y, time) - field(x - h, y, time)) / (2 * h);
    g[1] = (field(x, y + h, time) - field(x, y - h, time)) / (2 * h);
  }

  function stepParticles(time: number, dt: number) {
    const lr = 0.9 * dt;
    for (const p of particles) {
      if (p.fading) {
        p.trail.splice(0, 4);
        if (p.trail.length === 0) spawn(p);
        continue;
      }
      gradient(p.x, p.y, time);
      const slope = Math.hypot(g[0], g[1]);
      p.x -= lr * g[0] + (Math.random() - 0.5) * 0.004;
      p.y -= lr * g[1] + (Math.random() - 0.5) * 0.004;
      p.trail.push(p.x, p.y);
      if (p.trail.length > TRAIL * 2) p.trail.splice(0, 2);
      p.age += dt;
      p.still = slope < 0.08 ? p.still + dt : 0;
      if (p.still > 2.2 || p.age > 14 || Math.abs(p.x) > X * 1.05 || Math.abs(p.y) > 1.05) p.fading = true;
    }
  }

  function drawParticles() {
    const c2d = ctx!;
    c2d.lineWidth = 1.5;
    c2d.lineCap = 'round';
    c2d.strokeStyle = accent;
    c2d.fillStyle = accent;
    for (const p of particles) {
      const n = p.trail.length / 2;
      for (let k = 1; k < n; k++) {
        c2d.globalAlpha = 0.9 * (k / n);
        c2d.beginPath();
        c2d.moveTo(toPxX(p.trail[2 * k - 2]), toPxY(p.trail[2 * k - 1]));
        c2d.lineTo(toPxX(p.trail[2 * k]), toPxY(p.trail[2 * k + 1]));
        c2d.stroke();
      }
      if (!p.fading) {
        c2d.globalAlpha = 1;
        c2d.beginPath();
        c2d.arc(toPxX(p.x), toPxY(p.y), 2.4, 0, Math.PI * 2);
        c2d.fill();
      }
    }
    c2d.globalAlpha = 1;
  }

  function drawStatic() {
    sample(t);
    for (let i = 0; i < 150; i++) stepParticles(t, 1 / 30);
    ctx!.clearRect(0, 0, W, H);
    drawContours();
    drawParticles();
  }

  function frame(now: number) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || now - last < 1000 / 30) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt * 0.45;
    pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.08;
    sample(t);
    ctx!.clearRect(0, 0, W, H);
    drawContours();
    stepParticles(t, dt);
    drawParticles();
  }

  readColors();
  resize();
  new ResizeObserver(resize).observe(canvas);
  new MutationObserver(() => {
    readColors();
    if (reduceMotion) drawStatic();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  if (reduceMotion) return;

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(canvas);
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = toWorldX(e.clientX - rect.left);
    pointer.y = toWorldY(e.clientY - rect.top);
    pointer.active = true;
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.active = false;
  });
  requestAnimationFrame(frame);
}
