// Lumen Drift — all drawing: the grove, the moth, the HUD and every
// screen. The simulation never draws; this file never changes state.
import { VIEW, COLORS, GAME, EMBERS, PLAYER } from './config.js';

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
}

function drawEmber(ctx, e, time) {
  const pulse = 1 + 0.18 * Math.sin(time * 3 + e.phase);
  const flicker = e.age > e.life - 2 ? (Math.sin(time * 14) > 0 ? 1 : 0.35) : 1;
  ctx.globalAlpha = flicker;
  glow(ctx, e.x, e.y, 42 * pulse, 'rgba(255,201,77,0.55)', 0.8);
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

function drawShard(ctx, s, time) {
  glow(ctx, s.x, s.y, 46, 'rgba(198,93,240,0.5)', 0.7);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);
  ctx.fillStyle = COLORS.shard;
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
  ctx.fillStyle = COLORS.shardCore;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx, world) {
  const p = world.player;
  // Fading trail.
  for (let i = p.trail.length - 1; i >= 0; i--) {
    const t = p.trail[i];
    const a = Math.max(0, 0.35 * (1 - t.age / 0.5) * (1 - i / p.trail.length));
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 9 * (1 - i / p.trail.length), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const blink = p.invulnerable > 0 && Math.sin(world.time * 22) > 0;
  if (blink) return; // invulnerability flicker
  const dashing = p.dashTimer > 0;
  glow(ctx, p.x, p.y, dashing ? 110 : 84, 'rgba(142,240,255,0.5)', dashing ? 0.95 : 0.75);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle + Math.PI / 2);
  // Wings.
  const flap = Math.sin(world.time * 16) * 0.35;
  ctx.fillStyle = 'rgba(142,240,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(-13, -4, 13, 7 + flap * 6, -0.5 - flap, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(13, -4, 13, 7 + flap * 6, 0.5 + flap, 0, Math.PI * 2);
  ctx.fill();
  // Body: a little lantern moth.
  ctx.fillStyle = COLORS.playerCore;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 13, 0, 0, Math.PI * 2);
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
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, 1 - f.age / f.life);
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
  for (const s of world.shards) drawShard(ctx, s, world.time);
  if (world.state !== 'title') drawPlayer(ctx, world);
  drawParticles(ctx, world);
  ctx.restore();

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
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(world.banner.text, VIEW.width / 2, 170);
    ctx.font = '19px system-ui, sans-serif';
    ctx.fillStyle = COLORS.dim;
    ctx.fillText(world.banner.sub, VIEW.width / 2, 204);
    ctx.globalAlpha = 1;
  }
}
