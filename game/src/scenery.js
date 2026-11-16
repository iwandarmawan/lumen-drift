// Lumen Drift — the grove scenery: moon, layered parallax trees, mist,
// fireflies, glowing mushrooms and grass. Purely decorative: it never
// changes the rules, and everything is drawn from the world's seeded RNG
// (its own stream, so it never disturbs the simulation's spawns).
import { VIEW } from './config.js';
import { makeRng, pick } from './random.js';

function makeTrees(rng, count, x0, x1, baseY, hMin, hMax, rMin, rMax) {
  const trees = [];
  for (let i = 0; i < count; i++) {
    trees.push({
      x: pick(rng, x0, x1),
      baseY: baseY + pick(rng, -10, 10),
      h: pick(rng, hMin, hMax),
      r: pick(rng, rMin, rMax),
      lean: pick(rng, -0.14, 0.14),
      seed: rng(),
    });
  }
  return trees.sort((a, b) => a.x - b.x);
}

export function buildGrove(seed) {
  const rng = makeRng((seed ^ 0x9e3779b9) >>> 0);
  // The moon, high on the right so it never hides the title panel.
  const moon = { x: 1010, y: 128, r: 62 };
  const craters = [];
  for (let i = 0; i < 7; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * moon.r * 0.55;
    craters.push({
      x: moon.x + Math.cos(a) * d,
      y: moon.y + Math.sin(a) * d,
      r: 5 + rng() * 11,
    });
  }
  const far = makeTrees(rng, 15, -120, 1400, 606, 120, 200, 30, 50);
  const mid = makeTrees(rng, 9, -120, 1400, 646, 140, 220, 36, 58);
  // Near trees frame the scene from the edges only, so they never cover
  // the middle of the playfield.
  const near = makeTrees(rng, 4, -140, 210, 690, 240, 330, 70, 105)
    .concat(makeTrees(rng, 4, 1070, 1420, 690, 240, 330, 70, 105));
  const fireflies = [];
  for (let i = 0; i < 38; i++) {
    fireflies.push({
      x: pick(rng, 40, VIEW.width - 40),
      y: pick(rng, 120, 620),
      r: 1.2 + rng() * 1.8,
      phase: rng() * Math.PI * 2,
      speed: 0.5 + rng() * 1.1,
      drift: 12 + rng() * 26,
      warm: rng() < 0.6,
    });
  }
  const mushrooms = [];
  for (let i = 0; i < 9; i++) {
    mushrooms.push({
      x: pick(rng, 60, VIEW.width - 60),
      y: pick(rng, 656, 706),
      r: 4 + rng() * 5,
      teal: rng() < 0.4,
      phase: rng() * Math.PI * 2,
    });
  }
  const grass = [];
  for (let i = 0; i < 46; i++) {
    grass.push({
      x: pick(rng, 10, VIEW.width - 10),
      y: pick(rng, 648, 716),
      len: 7 + rng() * 10,
      lean: pick(rng, -0.5, 0.5),
    });
  }
  return { moon, craters, far, mid, near, fireflies, mushrooms, grass };
}

function drawTree(ctx, t, trunkColor, canopyColor, parallax) {
  const x = t.x + parallax;
  const topX = x + t.lean * t.h;
  const topY = t.baseY - t.h;
  // Trunk: a tapered, slightly leaning shape.
  ctx.fillStyle = trunkColor;
  ctx.beginPath();
  ctx.moveTo(x - 7, t.baseY + 6);
  ctx.quadraticCurveTo(x - 4, t.baseY - t.h * 0.55, topX - 2, topY + 6);
  ctx.lineTo(topX + 2, topY + 6);
  ctx.quadraticCurveTo(x + 4, t.baseY - t.h * 0.55, x + 7, t.baseY + 6);
  ctx.closePath();
  ctx.fill();
  // Canopy: a cluster of three overlapping crowns, lighter than the trunk.
  ctx.fillStyle = canopyColor;
  for (const [dx, dy, rr] of [[0, 0, 1], [-0.62, 0.22, 0.68], [0.62, 0.24, 0.7]]) {
    ctx.beginPath();
    ctx.arc(topX + dx * t.r, topY + dy * t.r * 0.7, rr * t.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // A few leaves catch the moonlight on the canopy rim.
  ctx.fillStyle = 'rgba(255,233,176,0.06)';
  ctx.beginPath();
  ctx.arc(topX + t.r * 0.35, topY - t.r * 0.45, t.r * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrees(ctx, trees, trunk, canopy, parallax) {
  for (const t of trees) drawTree(ctx, t, trunk, canopy, parallax);
}

function softDisc(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

// The moon, the far tree line and the drifting mist: drawn behind the
// hills, so the grove has a sky worth looking at.
export function drawGroveBack(ctx, world) {
  const { grove } = world;
  const time = world.time;
  const px = world.player.x - VIEW.width / 2;
  // Moon halo and disc.
  softDisc(ctx, grove.moon.x, grove.moon.y, 190, 'rgba(255,233,176,0.28)', 0.9);
  softDisc(ctx, grove.moon.x, grove.moon.y, 110, 'rgba(255,244,214,0.5)', 0.9);
  ctx.fillStyle = '#ffedb8';
  ctx.beginPath();
  ctx.arc(grove.moon.x, grove.moon.y, grove.moon.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(214,186,132,0.55)';
  for (const c of grove.craters) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Far tree line, drifting almost imperceptibly with the player.
  drawTrees(ctx, grove.far, '#171233', '#221a4e', -px * 0.02);
  // Low mist bands, sliding slowly across the grove.
  for (let i = 0; i < 3; i++) {
    const y = 300 + i * 150;
    const x = VIEW.width / 2 + Math.sin(time * 0.07 + i * 2.1) * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 420);
    g.addColorStop(0, 'rgba(158,146,255,0.07)');
    g.addColorStop(1, 'rgba(158,146,255,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.6, 0.32);
    ctx.beginPath();
    ctx.arc(0, 0, 420, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Mid and near trees, mushrooms, grass and fireflies: drawn in front of
// the hills, so the foreground has depth.
export function drawGroveFront(ctx, world) {
  const { grove } = world;
  const time = world.time;
  const px = world.player.x - VIEW.width / 2;
  drawTrees(ctx, grove.mid, '#120e2c', '#181238', -px * 0.05);
  drawTrees(ctx, grove.near, '#0c0920', '#151036', -px * 0.1);
  // Grass tufts along the front hill.
  ctx.strokeStyle = '#22335c';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const tuft of grove.grass) {
    ctx.beginPath();
    ctx.moveTo(tuft.x, tuft.y);
    ctx.quadraticCurveTo(tuft.x + tuft.lean * 6, tuft.y - tuft.len * 0.6, tuft.x + tuft.lean * 10, tuft.y - tuft.len);
    ctx.moveTo(tuft.x + 4, tuft.y);
    ctx.quadraticCurveTo(tuft.x + 4 - tuft.lean * 4, tuft.y - tuft.len * 0.5, tuft.x + 6, tuft.y - tuft.len * 0.8);
    ctx.stroke();
  }
  // Glowing mushrooms, gently pulsing.
  for (const m of grove.mushrooms) {
    const pulse = 0.75 + 0.25 * Math.sin(time * 1.6 + m.phase);
    const cap = m.teal ? '110,242,200' : '255,201,77';
    softDisc(ctx, m.x, m.y - 6, m.r * 3.2, `rgba(${cap},0.35)`, 0.8 * pulse);
    ctx.fillStyle = '#d8d2f0';
    ctx.fillRect(m.x - 1.5, m.y - 7, 3, 8);
    ctx.fillStyle = m.teal ? '#6ef2c8' : '#ffc94d';
    ctx.beginPath();
    ctx.arc(m.x, m.y - 7, m.r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(m.x - m.r * 0.35, m.y - 7 - m.r * 0.4, 1.2, 0, Math.PI * 2);
    ctx.arc(m.x + m.r * 0.3, m.y - 7 - m.r * 0.2, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  // Fireflies, drifting and blinking in front of everything.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const f of grove.fireflies) {
    const a = 0.2 + 0.6 * Math.abs(Math.sin(time * f.speed + f.phase));
    const x = f.x + Math.sin(time * 0.3 + f.phase) * f.drift;
    const y = f.y + Math.cos(time * 0.23 + f.phase * 1.7) * f.drift * 0.6;
    ctx.globalAlpha = a;
    ctx.fillStyle = f.warm ? '#ffd98a' : '#a5f2d8';
    ctx.beginPath();
    ctx.arc(x, y, f.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = a * 0.35;
    ctx.beginPath();
    ctx.arc(x, y, f.r * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
