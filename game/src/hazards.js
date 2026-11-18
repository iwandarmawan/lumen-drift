// Lumen Drift — hazards and the little bursts of light they leave behind.
// Wisps drift toward the moth and wobble as they close in; spores sway on fixed
// sine paths. Both cost a life on touch. Particles carry the game's feedback.

import { VIEW_W, VIEW_H, WISP_RADIUS, SPORE_RADIUS } from './config.js';

export function updateWisps(level, moth, dt) {
  for (const w of level.wisps) {
    const dx = moth.x - w.x;
    const dy = moth.y - w.y;
    const dist = Math.hypot(dx, dy) || 1;
    w.phase += dt * 2.2;
    const wobX = Math.cos(w.phase * w.wobble) * 26;
    const wobY = Math.sin(w.phase * w.wobble * 1.3) * 26;
    const tx = (dx / dist) * w.speed + wobX;
    const ty = (dy / dist) * w.speed + wobY;
    w.vx += (tx - w.vx) * Math.min(1, dt * 1.6);
    w.vy += (ty - w.vy) * Math.min(1, dt * 1.6);
    w.x += w.vx * dt;
    w.y += w.vy * dt;
    if (w.x < 20) w.x = 20;
    if (w.x > VIEW_W - 20) w.x = VIEW_W - 20;
    if (w.y < 20) w.y = 20;
    if (w.y > VIEW_H - 20) w.y = VIEW_H - 20;
  }
}

export function updateSpores(level, dt) {
  for (const s of level.spores) {
    s.phase += dt * s.freq;
    s.x += s.drift * dt;
    s.y = s.baseY + Math.sin(s.phase) * s.amp;
    if (s.x < 30) {
      s.x = 30;
      s.drift = Math.abs(s.drift);
    }
    if (s.x > VIEW_W - 30) {
      s.x = VIEW_W - 30;
      s.drift = -Math.abs(s.drift);
    }
  }
}

function touches(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy < r * r;
}

export function hazardHit(level, moth) {
  if (moth.invuln > 0 || !moth.alive) return null;
  for (const w of level.wisps) {
    if (touches(moth.x, moth.y, moth.radius - 2, w.x, w.y, WISP_RADIUS - 2)) return 'wisp';
  }
  for (const s of level.spores) {
    if (touches(moth.x, moth.y, moth.radius - 2, s.x, s.y, SPORE_RADIUS - 2)) return 'spore';
  }
  return null;
}

export function makeParticles() {
  return [];
}

export function spawnBurst(particles, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.3 + Math.random() * 0.7);
    particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.45 + Math.random() * 0.4,
      maxLife: 0.85,
      size: 2 + Math.random() * 3.5,
      color,
    });
  }
}

export function spawnTrail(particles, x, y, color) {
  particles.push({
    x: x + (Math.random() - 0.5) * 10,
    y: y + (Math.random() - 0.5) * 10,
    vx: (Math.random() - 0.5) * 30,
    vy: (Math.random() - 0.5) * 30,
    life: 0.35 + Math.random() * 0.2,
    maxLife: 0.55,
    size: 2.5 + Math.random() * 3,
    color,
  });
}

export function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.exp(-2.4 * dt);
    p.vy *= Math.exp(-2.4 * dt);
  }
  // Cap the trail so a long dash chain can never grow the array without bound.
  if (particles.length > 400) particles.splice(0, particles.length - 400);
}
