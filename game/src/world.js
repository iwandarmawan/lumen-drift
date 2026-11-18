// Lumen Drift — level building.
// Each garden is laid out from a seeded shuffle so a level always looks the same:
// embers spread across the sky, wisps near the middle, spores drifting low.

import {
  VIEW_W,
  VIEW_H,
  LEVELS,
  EMBERS_PER_LEVEL,
  WISP_BASE_SPEED,
  WISP_SPEED_PER_LEVEL,
} from './config.js';

// A small deterministic shuffle: same level, same garden, every run.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function farEnough(x, y, placed, minDist) {
  for (const p of placed) {
    const dx = p.x - x;
    const dy = p.y - y;
    if (dx * dx + dy * dy < minDist * minDist) return false;
  }
  return true;
}

export function buildLevel(levelIndex) {
  const def = LEVELS[levelIndex];
  const rand = mulberry32(0x9e3779b9 + levelIndex * 7919);
  const embers = [];
  // Keep the moth's spawn point clear so the first ember is earned, not given.
  const spawnClear = [{ x: VIEW_W / 2, y: VIEW_H / 2 + 80 }];
  let guard = 0;
  while (embers.length < EMBERS_PER_LEVEL && guard < 4000) {
    guard++;
    const x = 70 + rand() * (VIEW_W - 140);
    const y = 90 + rand() * (VIEW_H - 240);
    if (!farEnough(x, y, embers, 95)) continue;
    if (!farEnough(x, y, spawnClear, 110)) continue;
    embers.push({ x, y, taken: false, phase: rand() * Math.PI * 2, bob: 6 + rand() * 10 });
  }
  // Fallback: if the spread rule starved a slot, fill the rest on a loose grid.
  let gx = 120;
  let gy = 130;
  while (embers.length < EMBERS_PER_LEVEL) {
    embers.push({ x: gx, y: gy, taken: false, phase: rand() * Math.PI * 2, bob: 8 });
    gx += 170;
    if (gx > VIEW_W - 100) {
      gx = 120;
      gy += 150;
    }
  }

  const wisps = [];
  for (let i = 0; i < def.wisps; i++) {
    wisps.push({
      x: VIEW_W * (0.25 + 0.5 * rand()),
      y: VIEW_H * (0.3 + 0.4 * rand()),
      vx: 0,
      vy: 0,
      speed: WISP_BASE_SPEED + WISP_SPEED_PER_LEVEL * levelIndex,
      phase: rand() * Math.PI * 2,
      wobble: 0.6 + rand() * 0.9,
    });
  }

  const spores = [];
  for (let i = 0; i < def.spores; i++) {
    spores.push({
      x: 80 + rand() * (VIEW_W - 160),
      y: VIEW_H * (0.55 + 0.35 * rand()),
      baseY: 0,
      amp: 30 + rand() * 55,
      freq: 0.4 + rand() * 0.7,
      phase: rand() * Math.PI * 2,
      drift: (rand() - 0.5) * 36,
    });
    spores[i].baseY = spores[i].y;
  }

  const stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: rand() * VIEW_W,
      y: rand() * VIEW_H * 0.62,
      r: 0.6 + rand() * 1.6,
      twinkle: rand() * Math.PI * 2,
      speed: 0.5 + rand() * 1.5,
    });
  }

  const fireflies = [];
  for (let i = 0; i < 14; i++) {
    fireflies.push({
      x: rand() * VIEW_W,
      y: VIEW_H * 0.35 + rand() * VIEW_H * 0.55,
      phase: rand() * Math.PI * 2,
      speed: 0.3 + rand() * 0.6,
      range: 20 + rand() * 45,
    });
  }

  return { def, embers, wisps, spores, stars, fireflies, time: 0 };
}

export function embersLeft(level) {
  let n = 0;
  for (const e of level.embers) if (!e.taken) n++;
  return n;
}
