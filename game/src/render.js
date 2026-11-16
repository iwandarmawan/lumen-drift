// Lumen Drift — all drawing: the grove, the moth, the HUD and every
// screen. The simulation never draws; this file never changes state.
import { VIEW, COLORS, GAME, EMBERS, PLAYER } from './config.js';
import { drawGroveBack, drawGroveFront } from './scenery.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glow(ctx, x, y, radius, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
}

function drawBackground(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, COLORS.skyTop);
  g.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Twinkling stars.
  for (const s of world.stars) {
    const a = 0.25 + 0.55 * Math.abs(Math.sin(s.twinkle));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#cfd8ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // The moon, far trees and mist hang behind the hills.
  drawGroveBack(ctx, world);
  // Soft hills at the bottom of the grove.
  ctx.fillStyle = '#141033';
  ctx.beginPath();
  ctx.moveTo(0, VIEW.height);
  ctx.lineTo(0, 640);
  ctx.quadraticCurveTo(320, 590, 640, 645);
  ctx.quadraticCurveTo(960, 690, 1280, 625);
  ctx.lineTo(1280, VIEW.height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0e0b26';
  ctx.beginPath();
  ctx.moveTo(0, VIEW.height);
  ctx.lineTo(0, 680);
  ctx.quadraticCurveTo(420, 640, 840, 685);
  ctx.quadraticCurveTo(1080, 705, 1280, 672);
  ctx.lineTo(1280, VIEW.height);
  ctx.closePath();
  ctx.fill();
  // Mid and near trees, mushrooms, grass and fireflies in front.
  drawGroveFront(ctx, world);
}

function drawEmber(ctx, e, time) {
  const pulse = 1 + 0.18 * Math.sin(time * 3 + e.phase);
  const flicker = e.age > e.life - 2 ? (Math.sin(time * 14) > 0 ? 1 : 0.35) : 1;
  ctx.globalAlpha = flicker;
  glow(ctx, e.x, e.y, 42 * pulse, 'rgba(255,201,77,0.55)', 0.8);
  // A thin halo ring that breathes with the ember.
  ctx.globalAlpha = flicker * (0.35 + 0.2 * Math.sin(time * 3 + e.phase));
  ctx.strokeStyle = 'rgba(255,220,130,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(e.x, e.y, (e.r + 7) * pulse, 0, Math.PI * 2);
  ctx.stroke();
  // A little four-point sparkle that slowly turns.
  const sa = time * 0.9 + e.phase;
  const sr = e.r + 15;
  ctx.globalAlpha = flicker * 0.85;
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = sa + (i * Math.PI) / 2;
    const x = e.x + Math.cos(a) * sr;
    const y = e.y + Math.sin(a) * sr;
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + 1.4, y - 1.4);
    ctx.lineTo(x + 4, y);
    ctx.lineTo(x + 1.4, y + 1.4);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x - 1.4, y + 1.4);
    ctx.lineTo(x - 4, y);
    ctx.lineTo(x - 1.4, y - 1.4);
    ctx.closePath();
  }
  ctx.fill();
  // One mote orbiting the ember.
  const oa = time * 2.2 + e.phase * 2;
  ctx.globalAlpha = flicker * 0.9;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(e.x + Math.cos(oa) * 20, e.y + Math.sin(oa) * 14, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = flicker;
  ctx.fillStyle = COLORS.ember;
  ctx.beginPath();
  ctx.arc(e.x, e.y, e.r * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.emberCore;
  ctx.beginPath();
  ctx.arc(e.x - 2, e.y - 2, e.r * 0.45 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawShard(ctx, s, world, time) {
  const p = world.player;
  const d = Math.hypot(p.x - s.x, p.y - s.y);
  const isDart = s.kind === 'dart';
  // Darts burn hotter and redder than drifters, so the two kinds read.
  const aura = isDart ? 'rgba(255,77,140,0.55)' : 'rgba(198,93,240,0.5)';
  glow(ctx, s.x, s.y, 46, aura, 0.7);
  // A dart telegraphs its lunge: a bright glint as it spawns, and a faint
  // aim line while it closes in on Luma.
  if (isDart) {
    if (s.age < 0.9) {
      const ga = 1 - s.age / 0.9;
      ctx.globalAlpha = ga;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      const gr = 10 + (1 - ga) * 8;
      ctx.beginPath();
      ctx.moveTo(s.x - gr, s.y);
      ctx.lineTo(s.x + gr, s.y);
      ctx.moveTo(s.x, s.y - gr);
      ctx.lineTo(s.x, s.y + gr);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (d < 280 && world.state === 'playing') {
      ctx.globalAlpha = 0.22 + 0.1 * Math.sin(time * 10);
      ctx.strokeStyle = '#ff8fb0';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);
  // Dark outline so the crystal reads against the night.
  ctx.strokeStyle = 'rgba(20,6,36,0.85)';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = isDart ? '#e0447c' : COLORS.shard;
  ctx.beginPath();
  const r = s.r;
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.85, -r * 0.3);
  ctx.lineTo(r * 0.6, r * 0.8);
  ctx.lineTo(0, r * 0.5);
  ctx.lineTo(-r * 0.6, r * 0.8);
  ctx.lineTo(-r * 0.85, -r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Facets: lines from the core to the points catch the light.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -r);
  ctx.moveTo(0, 0);
  ctx.lineTo(r * 0.6, r * 0.8);
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.6, r * 0.8);
  ctx.stroke();
  ctx.fillStyle = isDart ? '#ffb3cd' : COLORS.shardCore;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx, world) {
  const p = world.player;
  const speed = Math.hypot(p.vx, p.vy);
  const speedNorm = Math.min(1, speed / 600);
  // A ribbon trail: tapering glow that follows the flight path.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < p.trail.length - 1; i++) {
    const t = p.trail[i];
    const f = 1 - i / p.trail.length;
    const a = Math.max(0, 0.4 * f * (1 - t.age / 0.5));
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#5fd8f2';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 10 * f + 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  const blink = p.invulnerable > 0 && Math.sin(world.time * 22) > 0;
  if (blink) return; // invulnerability flicker
  const dashing = p.dashTimer > 0;
  // Dash shockwave: an expanding ring while the dash is in flight.
  if (dashing) {
    const prog = 1 - p.dashTimer / PLAYER.dashTime;
    const rr = 22 + prog * 95;
    ctx.globalAlpha = 0.75 * (1 - prog);
    ctx.strokeStyle = '#bff6ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.4 * (1 - prog);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rr * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Speed streaks behind the moth while dashing.
    const va = Math.atan2(p.vy, p.vx);
    ctx.strokeStyle = 'rgba(190,246,255,0.7)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const off = (i - 2) * 12;
      const px = Math.cos(va + Math.PI / 2) * off;
      const py = Math.sin(va + Math.PI / 2) * off;
      const bx = p.x - Math.cos(va) * (26 + i * 7) + px;
      const by = p.y - Math.sin(va) * (26 + i * 7) + py;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - Math.cos(va) * 26, by - Math.sin(va) * 26);
      ctx.stroke();
    }
  }
  const flicker = 0.85 + 0.15 * Math.sin(world.time * 23) + 0.07 * Math.sin(world.time * 41);
  glow(ctx, p.x, p.y, dashing ? 110 : 84, 'rgba(142,240,255,0.5)', (dashing ? 0.95 : 0.75) * flicker);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle + Math.PI / 2);
  // Wings: an upper and a lower wing per side, veined, flapping harder
  // the faster Luma flies.
  const flap = Math.sin(world.time * 16) * (0.28 + 0.22 * speedNorm);
  for (const side of [-1, 1]) {
    const grad = ctx.createLinearGradient(0, -14, side * 26, 0);
    grad.addColorStop(0, 'rgba(142,240,255,0.95)');
    grad.addColorStop(1, 'rgba(94,190,235,0.55)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(side * 14, -5, 14, 8 + flap * 7, side * (0.55 + flap), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,220,245,0.7)';
    ctx.beginPath();
    ctx.ellipse(side * 11, 8, 9, 5 + flap * 4, side * (0.9 + flap), 0, Math.PI * 2);
    ctx.fill();
    // Wing veins.
    ctx.strokeStyle = 'rgba(230,252,255,0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(side * 4, -4);
    ctx.lineTo(side * 24, -10 - flap * 6);
    ctx.moveTo(side * 4, 0);
    ctx.lineTo(side * 20, 4 + flap * 4);
    ctx.stroke();
  }
  // Body: a little lantern moth — a warm amber lantern belly with a
  // flickering flame inside, and a cool head.
  const bodyGrad = ctx.createLinearGradient(0, -14, 0, 14);
  bodyGrad.addColorStop(0, '#eafcff');
  bodyGrad.addColorStop(0.45, '#ffe9a8');
  bodyGrad.addColorStop(1, '#ffb84d');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // The flame: a teardrop that flickers with the light.
  ctx.fillStyle = `rgba(255,${Math.round(190 + 40 * flicker)},80,0.95)`;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.quadraticCurveTo(4.5 * flicker, -2, 0, 6);
  ctx.quadraticCurveTo(-4.5 * flicker, -2, 0, -9);
  ctx.closePath();
  ctx.fill();
  // Antennae with glowing tips.
  ctx.strokeStyle = '#8ef0ff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-3, -11);
  ctx.quadraticCurveTo(-7, -20, -11, -24);
  ctx.moveTo(3, -11);
  ctx.quadraticCurveTo(7, -20, 11, -24);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(-11, -24, 2, 0, Math.PI * 2);
  ctx.arc(11, -24, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0b1026';
  ctx.beginPath();
  ctx.arc(-3, -6, 1.8, 0, Math.PI * 2);
  ctx.arc(3, -6, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx, world) {
  for (const pt of world.particles) {
    ctx.globalAlpha = Math.max(0, 1 - pt.age / pt.life);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, 1 - f.age / f.life);
    // A dark outline keeps the popup readable over any background.
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(8,8,26,0.85)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -6, -11, 0, -5);
  ctx.bezierCurveTo(6, -11, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? COLORS.heart : 'rgba(255,107,129,0.25)';
  ctx.fill();
  ctx.restore();
}

function drawHud(ctx, world) {
  // Top bar.
  ctx.fillStyle = 'rgba(8,8,24,0.55)';
  ctx.fillRect(0, 0, VIEW.width, 56);
  ctx.fillStyle = 'rgba(255,201,77,0.35)';
  ctx.fillRect(0, 56, VIEW.width, 2);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${world.score}`, 22, 36);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`BEST  ${Math.max(world.best, world.score)}`, 230, 35);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(`LEVEL ${world.level} / ${GAME.winLevel}`, VIEW.width / 2, 35);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = COLORS.dim;
  // A little glowing ember marks the goal count.
  glow(ctx, VIEW.width / 2 - 78, 47, 12, 'rgba(255,201,77,0.6)', 0.8);
  ctx.fillStyle = COLORS.ember;
  ctx.beginPath();
  ctx.arc(VIEW.width / 2 - 78, 47, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`embers ${world.embersCollected} / ${GAME.emberGoal}`, VIEW.width / 2, 52);
  // Lives.
  for (let i = 0; i < GAME.startLives; i++) {
    heart(ctx, VIEW.width - 130 + i * 34, 28, 22, i < world.lives);
  }
  // Combo.
  if (world.combo > 1) {
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.ember;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`COMBO x${world.combo}`, VIEW.width - 22, 78);
    const w = 130 * Math.max(0, world.comboTimer / EMBERS.comboWindow);
    ctx.fillStyle = 'rgba(255,201,77,0.35)';
    ctx.fillRect(VIEW.width - 152, 86, 130, 6);
    ctx.fillStyle = COLORS.ember;
    ctx.fillRect(VIEW.width - 152, 86, w, 6);
  }
  // Dash cooldown.
  const p = world.player;
  const ready = p.dashCooldown <= 0;
  ctx.textAlign = 'right';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = ready ? COLORS.player : COLORS.dim;
  ctx.fillText(ready ? 'DASH READY  [Space]' : 'DASH …', VIEW.width - 22, 112);
  if (!ready) {
    const w = 130 * (1 - p.dashCooldown / PLAYER.dashCooldown);
    ctx.fillStyle = 'rgba(142,240,255,0.3)';
    ctx.fillRect(VIEW.width - 152, 120, 130, 6);
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(VIEW.width - 152, 120, w, 6);
  }
}

function panel(ctx, title, lines, accent, height) {
  const h = height || 400;
  ctx.fillStyle = 'rgba(8,8,26,0.72)';
  roundRect(ctx, VIEW.width / 2 - 330, 150, 660, h, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px system-ui, sans-serif';
  ctx.fillText(title, VIEW.width / 2, 235);
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW.width / 2, 295 + i * 34);
  });
}

function drawTitle(ctx, world) {
  panel(ctx, 'LUMEN DRIFT', [
    'You are Luma, a lantern moth in a dark grove.',
    'Gather the glowing embers. Dodge the thorn-shards.',
    'Dash through a shard to shatter it — dashing recharges.',
    '',
    'Move: WASD / arrows, or hold the mouse  •  Dash: Space / click',
    'Pause: P  •  Mute: M  •  Restart: R',
    'Collect 90 embers to light the grove and win.',
  ], COLORS.ember, 470);
  ctx.fillStyle = COLORS.ember;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('Press Enter or click to begin', VIEW.width / 2, 545);
  if (world.best > 0) {
    ctx.fillStyle = COLORS.dim;
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(`Best score: ${world.best}`, VIEW.width / 2, 582);
  }
}

function drawOver(ctx, world) {
  panel(ctx, 'THE LIGHT FADES', [
    `Score ${world.score}   •   Embers ${world.embersCollected}   •   Level ${world.level}`,
    `Best score: ${Math.max(world.best, world.score)}`,
    '',
    'The grove is dark again — but Luma can fly once more.',
    '',
    'Press R or Enter to play again',
  ], COLORS.heart);
}

function drawWin(ctx, world) {
  panel(ctx, 'THE GROVE SHINES', [
    '90 embers gathered — every corner of the grove glows.',
    `Score ${world.score}  (includes a +500 lighting bonus)`,
    `Best score: ${Math.max(world.best, world.score)}`,
    '',
    'Luma did it. Thank you for playing.',
    '',
    'Press R or Enter to fly again',
  ], COLORS.ember);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(8,8,26,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('PAUSED', VIEW.width / 2, 340);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('Press P to keep flying', VIEW.width / 2, 390);
}

export function drawWorld(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawBackground(ctx, world);
  for (const e of world.embers) drawEmber(ctx, e, world.time);
  for (const s of world.shards) drawShard(ctx, s, world, world.time);
  if (world.state !== 'title') drawPlayer(ctx, world);
  drawParticles(ctx, world);
  ctx.restore();

  // A gentle vignette pulls the eye to the middle of the grove.
  const vig = ctx.createRadialGradient(
    VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.42,
    VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.95,
  );
  vig.addColorStop(0, 'rgba(5,4,18,0)');
  vig.addColorStop(1, 'rgba(5,4,18,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  if (world.state === 'playing' || world.state === 'paused') drawHud(ctx, world);
  if (world.state === 'title') {
    // The moth hovers over the title.
    drawPlayer(ctx, { ...world, player: { ...world.player, x: VIEW.width / 2, y: 130, vx: 0, vy: 0, angle: -Math.PI / 2, dashTimer: 0, trail: [] } });
    drawTitle(ctx, world);
  }
  if (world.state === 'over') { drawHud(ctx, world); drawOver(ctx, world); }
  if (world.state === 'win') { drawHud(ctx, world); drawWin(ctx, world); }
  if (world.state === 'paused') drawPaused(ctx);
  if (world.banner && world.banner.timer > 0 && (world.state === 'playing')) {
    const a = Math.min(1, world.banner.timer);
    // A soft pill behind the banner and a glowing underline that drains
    // with the banner's remaining time.
    const slide = world.banner.timer > 1.9 ? (world.banner.timer - 1.9) * 60 : 0;
    ctx.globalAlpha = a * 0.55;
    ctx.fillStyle = 'rgba(8,8,26,0.7)';
    roundRect(ctx, VIEW.width / 2 - 260, 128 - slide, 520, 92, 16);
    ctx.fill();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(world.banner.text, VIEW.width / 2, 170 - slide);
    ctx.font = '19px system-ui, sans-serif';
    ctx.fillStyle = COLORS.dim;
    ctx.fillText(world.banner.sub, VIEW.width / 2, 204 - slide);
    const bw = 300 * Math.min(1, world.banner.timer / 2.2);
    ctx.fillStyle = COLORS.ember;
    ctx.fillRect(VIEW.width / 2 - bw / 2, 214 - slide, bw, 3);
    ctx.globalAlpha = 1;
  }
}
