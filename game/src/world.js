// Lumen Drift — the simulation: player, embers, shards, particles,
// levels and scoring. Rendering never touches this state directly except
// to draw it; all rules live here.
import { VIEW, PLAYER, EMBERS, SHARDS, GAME } from './config.js';
import { makeRng, pick, pickAngle } from './random.js';

export function newWorld(seed) {
  const rng = makeRng(seed);
  const stars = [];
  for (let i = 0; i < 110; i++) {
    stars.push({
      x: rng() * VIEW.width,
      y: rng() * VIEW.height,
      r: 0.6 + rng() * 1.6,
      twinkle: rng() * Math.PI * 2,
      speed: 0.4 + rng() * 1.2,
    });
  }
  return {
    rng,
    seed,
    time: 0,
    state: 'title', // title | playing | paused | over | win
    score: 0,
    best: 0,
    embersCollected: 0,
    level: 1,
    lives: GAME.startLives,
    combo: 0,
    comboTimer: 0,
    shake: 0,
    banner: null, // {text, sub, timer}
    shardTimer: 1.2,
    player: {
      x: VIEW.width / 2,
      y: VIEW.height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      dashTimer: 0,
      dashCooldown: 0,
      invulnerable: 0,
      trail: [],
    },
    embers: [],
    shards: [],
    particles: [],
    floaters: [], // floating "+10" score popups
    stars,
  };
}

export function levelFor(embersCollected) {
  return Math.min(GAME.winLevel, Math.floor(embersCollected / GAME.embersPerLevel) + 1);
}

function spawnEmber(world) {
  const { rng } = world;
  const margin = 60;
  world.embers.push({
    x: pick(rng, margin, VIEW.width - margin),
    y: pick(rng, 90, VIEW.height - margin),
    r: EMBERS.radius,
    age: 0,
    life: EMBERS.life * (0.8 + rng() * 0.5),
    phase: rng() * Math.PI * 2,
    vx: pick(rng, -14, 14),
    vy: pick(rng, -10, 10),
  });
}

function spawnShard(world) {
  const { rng } = world;
  const edge = Math.floor(rng() * 4);
  let x;
  let y;
  if (edge === 0) { x = pick(rng, 0, VIEW.width); y = -24; }
  else if (edge === 1) { x = VIEW.width + 24; y = pick(rng, 0, VIEW.height); }
  else if (edge === 2) { x = pick(rng, 0, VIEW.width); y = VIEW.height + 24; }
  else { x = -24; y = pick(rng, 0, VIEW.height); }
  const speed = Math.min(
    SHARDS.maxSpeed,
    SHARDS.baseSpeed + SHARDS.speedPerLevel * (world.level - 1) + rng() * 30,
  );
  const kind = rng() < 0.22 ? 'dart' : 'drift';
  world.shards.push({
    x, y,
    r: SHARDS.radius * (kind === 'dart' ? 0.8 : 1),
    speed: kind === 'dart' ? speed * 1.4 : speed,
    kind,
    angle: pickAngle(rng),
    spin: pick(rng, -2.4, 2.4),
    wobble: rng() * Math.PI * 2,
    age: 0,
    life: 16, // seconds before a shard dissolves on its own
  });
}

export function burst(world, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const a = world.rng() * Math.PI * 2;
    const s = speed * (0.3 + world.rng() * 0.7);
    world.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.5 + world.rng() * 0.5,
      age: 0,
      r: 2 + world.rng() * 3,
      color,
    });
  }
}

export function floater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, age: 0, life: 1.1 });
}

export function startRun(world) {
  const fresh = newWorld(world.seed);
  fresh.best = world.best;
  fresh.state = 'playing';
  Object.assign(world, fresh);
  world.state = 'playing';
  for (let i = 0; i < EMBERS.target; i++) spawnEmber(world);
  world.banner = { text: 'LEVEL 1', sub: 'Collect the embers — dodge the shards', timer: 2.4 };
}

function applyHit(world, shard, sounds) {
  if (world.player.invulnerable > 0 || world.player.dashTimer > 0) return;
  world.lives -= 1;
  world.combo = 0;
  world.comboTimer = 0;
  world.player.invulnerable = PLAYER.invulnerableTime;
  world.shake = 14;
  burst(world, world.player.x, world.player.y, '#ff6b81', 26, 260);
  sounds.hurt();
  if (world.lives <= 0) {
    world.state = 'over';
    world.best = Math.max(world.best, world.score);
    sounds.lose();
  }
}

export function updateWorld(world, input, dt, sounds) {
  world.time += dt;
  const p = world.player;

  if (world.state !== 'playing') {
    // The grove keeps drifting behind menus.
    for (const s of world.stars) {
      s.twinkle += dt * s.speed;
    }
    updateParticles(world, dt);
    if (world.banner) world.banner.timer -= dt;
    return;
  }

  // --- movement: keys, or steer toward the mouse while held ---
  const mv = input.moveVector();
  let ax = mv.x;
  let ay = mv.y;
  if (ax === 0 && ay === 0 && input.mouse.down && input.mouse.inside) {
    const dx = input.mouse.x - p.x;
    const dy = input.mouse.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 8) { ax = dx / d; ay = dy / d; }
  }
  const dashing = p.dashTimer > 0;
  const speed = dashing ? PLAYER.dashSpeed : PLAYER.speed;
  p.vx += ax * PLAYER.accel * dt;
  p.vy += ay * PLAYER.accel * dt;
  // Friction, lighter while dashing so the dash carries.
  const drag = Math.exp(-(dashing ? 1.2 : PLAYER.friction) * dt);
  p.vx *= drag;
  p.vy *= drag;
  const v = Math.hypot(p.vx, p.vy);
  const cap = speed * 1.35;
  if (v > cap) { p.vx = (p.vx / v) * cap; p.vy = (p.vy / v) * cap; }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.x = Math.max(24, Math.min(VIEW.width - 24, p.x));
  p.y = Math.max(64, Math.min(VIEW.height - 24, p.y));
  if (v > 20) p.angle = Math.atan2(p.vy, p.vx);

  // Trail for the glow.
  p.trail.unshift({ x: p.x, y: p.y, age: 0 });
  if (p.trail.length > 14) p.trail.pop();
  for (const t of p.trail) t.age += dt;

  // --- dash ---
  if (p.dashCooldown > 0) p.dashCooldown -= dt;
  if (p.dashTimer > 0) p.dashTimer -= dt;
  if ((input.wasPressed(' ', 'click') || input.wasPressed('Shift')) && p.dashCooldown <= 0 && (ax !== 0 || ay !== 0 || v > 30)) {
    p.dashTimer = PLAYER.dashTime;
    p.dashCooldown = PLAYER.dashCooldown;
    const da = v > 30 ? Math.atan2(p.vy, p.vx) : Math.atan2(ay, ax);
    p.vx = Math.cos(da) * PLAYER.dashSpeed;
    p.vy = Math.sin(da) * PLAYER.dashSpeed;
    burst(world, p.x, p.y, '#8ef0ff', 12, 180);
    sounds.dash();
  }
  if (p.invulnerable > 0) p.invulnerable -= dt;

  // --- combo decay ---
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  // --- embers: drift, age, collect ---
  for (let i = world.embers.length - 1; i >= 0; i--) {
    const e = world.embers[i];
    e.age += dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    if (e.x < 40 || e.x > VIEW.width - 40) e.vx *= -1;
    if (e.y < 80 || e.y > VIEW.height - 40) e.vy *= -1;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < e.r + PLAYER.radius + 6) {
      world.embers.splice(i, 1);
      world.combo = Math.min(EMBERS.comboMax, world.combo + 1);
      world.comboTimer = EMBERS.comboWindow;
      const gained = EMBERS.score * world.combo;
      world.score += gained;
      world.embersCollected += 1;
      burst(world, e.x, e.y, '#ffc94d', 14, 200);
      floater(world, e.x, e.y - 12, `+${gained}`, '#ffe9a8');
      sounds.pickup(world.combo);
      // Every 30 embers the grove gives a life back (never above the start).
      if (world.embersCollected % 30 === 0 && world.lives < GAME.startLives) {
        world.lives += 1;
        floater(world, p.x, p.y - 30, '+1 LIFE', '#ff6b81');
      }
      const newLevel = levelFor(world.embersCollected);
      if (newLevel > world.level) {
        world.level = newLevel;
        if (world.level >= GAME.winLevel) {
          world.state = 'win';
          world.best = Math.max(world.best, world.score);
          world.score += 500;
          sounds.win();
        } else {
          world.banner = { text: `LEVEL ${world.level}`, sub: 'The grove grows darker — and faster', timer: 2.2 };
          sounds.levelUp();
        }
      }
    } else if (e.age > e.life) {
      world.embers.splice(i, 1);
    }
  }
  while (world.embers.length < EMBERS.target && world.state === 'playing') spawnEmber(world);

  // --- shards: chase, shatter on dash, hurt on touch ---
  world.shardTimer -= dt;
  const interval = Math.max(
    SHARDS.spawnIntervalMin,
    SHARDS.spawnInterval - (world.level - 1) * 0.32,
  );
  if (world.shardTimer <= 0) {
    spawnShard(world);
    world.shardTimer = interval * (0.8 + world.rng() * 0.4);
  }
  for (let i = world.shards.length - 1; i >= 0; i--) {
    const s = world.shards[i];
    s.age += dt;
    if (s.age > s.life) { world.shards.splice(i, 1); continue; }
    const dx = p.x - s.x;
    const dy = p.y - s.y;
    const d = Math.hypot(dx, dy) || 1;
    // Drifters chase loosely, darts lock on with a wobble.
    const steer = s.kind === 'dart' ? 1 : 0.35;
    s.x += ((dx / d) * s.speed * steer + Math.cos(s.wobble) * 26) * dt;
    s.y += ((dy / d) * s.speed * steer + Math.sin(s.wobble) * 26) * dt;
    s.wobble += dt * 1.7;
    s.angle += s.spin * dt;
    if (s.x < -60 || s.x > VIEW.width + 60 || s.y < -60 || s.y > VIEW.height + 60) {
      world.shards.splice(i, 1);
      continue;
    }
    if (d < s.r + PLAYER.radius) {
      if (dashing) {
        world.shards.splice(i, 1);
        world.score += SHARDS.shatterScore;
        burst(world, s.x, s.y, '#c65df0', 20, 260);
        floater(world, s.x, s.y - 12, `+${SHARDS.shatterScore}`, '#f0a6ff');
        sounds.shatter();
      } else {
        applyHit(world, s, sounds);
        world.shards.splice(i, 1);
        if (world.state !== 'playing') return;
      }
    }
  }

  if (world.banner) world.banner.timer -= dt;
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 40);
  updateParticles(world, dt);
}

function updateParticles(world, dt) {
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const pt = world.particles[i];
    pt.age += dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= Math.exp(-2 * dt);
    pt.vy *= Math.exp(-2 * dt);
    if (pt.age >= pt.life) world.particles.splice(i, 1);
  }
  for (let i = world.floaters.length - 1; i >= 0; i--) {
    const f = world.floaters[i];
    f.age += dt;
    f.y -= 34 * dt;
    if (f.age >= f.life) world.floaters.splice(i, 1);
  }
}
