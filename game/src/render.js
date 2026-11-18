// Lumen Drift — everything the player sees.
// Canvas-drawn art only: gradient night skies, a glowing moon, hill silhouettes,
// pulsing embers, the flapping lantern moth, and the HUD and menus on top.

import {
  VIEW_W,
  VIEW_H,
  MOTH_BODY,
  MOTH_WING,
  MOTH_WING_EDGE,
  MOTH_GLOW,
  EMBER_CORE,
  EMBER_HALO,
  WISP_CORE,
  WISP_HALO,
  SPORE_CORE,
  SPORE_HALO,
  EMBERS_PER_LEVEL,
  TOTAL_EMBERS,
  COMBO_WINDOW,
} from './config.js';
import { dashFraction, isDashing } from './moth.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hillPath(ctx, baseY, amp, phase, steps) {
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * VIEW_W;
    const y = baseY + Math.sin(i * 0.9 + phase) * amp + Math.sin(i * 2.3 + phase * 2) * amp * 0.4;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.closePath();
}

export function drawBackground(ctx, level) {
  const def = level.def;
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, def.skyTop);
  g.addColorStop(0.55, def.skyMid);
  g.addColorStop(1, def.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  for (const s of level.stars) {
    const tw = 0.45 + 0.55 * Math.abs(Math.sin(level.time * s.speed + s.twinkle));
    ctx.globalAlpha = tw;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const moonX = VIEW_W - 220;
  const moonY = 178;
  const mg = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 90);
  mg.addColorStop(0, 'rgba(255, 240, 200, 0.5)');
  mg.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.moon;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.arc(moonX - 14, moonY - 8, 9, 0, Math.PI * 2);
  ctx.arc(moonX + 12, moonY + 14, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = def.hillFar;
  hillPath(ctx, VIEW_H - 150, 26, 1.7, 24);
  ctx.fill();
  ctx.fillStyle = def.hillNear;
  hillPath(ctx, VIEW_H - 70, 34, 4.2, 24);
  ctx.fill();

  for (const f of level.fireflies) {
    const fx = f.x + Math.sin(level.time * f.speed + f.phase) * f.range;
    const fy = f.y + Math.cos(level.time * f.speed * 0.8 + f.phase) * f.range * 0.5;
    const glow = 0.35 + 0.65 * Math.abs(Math.sin(level.time * 1.4 + f.phase));
    ctx.globalAlpha = glow * 0.9;
    ctx.fillStyle = '#ffe9a3';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawEmber(ctx, e, time) {
  if (e.taken) return;
  const bobY = e.y + Math.sin(time * 1.6 + e.phase) * e.bob * 0.3;
  const pulse = 1 + 0.18 * Math.sin(time * 3 + e.phase);
  const halo = ctx.createRadialGradient(e.x, bobY, 1, e.x, bobY, 34 * pulse);
  halo.addColorStop(0, EMBER_HALO);
  halo.addColorStop(1, 'rgba(255, 183, 77, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(e.x, bobY, 34 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = EMBER_CORE;
  ctx.beginPath();
  ctx.arc(e.x, bobY, 6.5 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(e.x - 2, bobY - 2, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawWisp(ctx, w, time) {
  const halo = ctx.createRadialGradient(w.x, w.y, 2, w.x, w.y, 40);
  halo.addColorStop(0, WISP_HALO);
  halo.addColorStop(1, 'rgba(150, 110, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(w.x, w.y, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WISP_CORE;
  ctx.beginPath();
  ctx.arc(w.x, w.y, 11 + 2 * Math.sin(time * 4 + w.phase), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#efe6ff';
  ctx.beginPath();
  ctx.arc(w.x - 3.5, w.y - 3, 3, 0, Math.PI * 2);
  ctx.arc(w.x + 4, w.y - 2, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(179, 136, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w.x - 9, w.y + 8);
  ctx.quadraticCurveTo(w.x, w.y + 20 + 4 * Math.sin(time * 3 + w.phase), w.x + 9, w.y + 8);
  ctx.stroke();
}

function drawSpore(ctx, s, time) {
  const halo = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 30);
  halo.addColorStop(0, SPORE_HALO);
  halo.addColorStop(1, 'rgba(110, 220, 160, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SPORE_CORE;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 8 + 1.5 * Math.sin(time * 2.5 + s.phase), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(s.x - 2.5, s.y - 2.5, 2, 0, Math.PI * 2);
  ctx.fill();
}

// ---- moth, particles, HUD and screens ----

export function drawMoth(ctx, moth, time) {
  if (!moth.alive) return;
  const blink = moth.invuln > 0 && Math.floor(time * 14) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  const glowR = isDashing(moth) ? 70 : 46;
  const glow = ctx.createRadialGradient(moth.x, moth.y, 4, moth.x, moth.y, glowR);
  glow.addColorStop(0, MOTH_GLOW);
  glow.addColorStop(1, 'rgba(255, 214, 106, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(moth.x, moth.y, glowR, 0, Math.PI * 2);
  ctx.fill();

  const flap = Math.sin(moth.wingPhase);
  const wingLen = 26;
  const wingWid = 13 + flap * 5;
  ctx.save();
  ctx.translate(moth.x, moth.y);
  ctx.scale(moth.face, 1);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * (0.5 + flap * 0.45));
    ctx.fillStyle = MOTH_WING;
    ctx.beginPath();
    ctx.ellipse(-4, side * wingWid * 0.55, wingLen * 0.62, wingWid * 0.5, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = MOTH_WING_EDGE;
    ctx.beginPath();
    ctx.ellipse(-16, side * wingWid * 0.55, wingLen * 0.3, wingWid * 0.32, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = MOTH_BODY;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a6b3a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(13, -3);
  ctx.quadraticCurveTo(24, -12, 27, -18);
  ctx.moveTo(13, 3);
  ctx.quadraticCurveTo(24, 12, 27, 18);
  ctx.stroke();
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(9, -3, 1.8, 0, Math.PI * 2);
  ctx.arc(9, 3, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawWorld(ctx, level, moth, particles, time) {
  drawBackground(ctx, level);
  for (const e of level.embers) drawEmber(ctx, e, time);
  for (const s of level.spores) drawSpore(ctx, s, time);
  for (const w of level.wisps) drawWisp(ctx, w, time);
  drawParticles(ctx, particles);
  drawMoth(ctx, moth, time);
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
  ctx.fillStyle = filled ? '#ff6b81' : 'rgba(255,255,255,0.18)';
  ctx.fill();
  ctx.restore();
}

export function drawHud(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 8, 28, 0.55)';
  roundRect(ctx, 14, 12, 300, 86, 12);
  ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Score ${game.score}`, 28, 22);
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = '#d9c9ff';
  ctx.fillText(`${game.level.def.name}  ·  Level ${game.levelIndex + 1}/6`, 28, 54);
  const embersGot = TOTAL_EMBERS - game.embersRemaining;
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(`Embers ${embersGot}/${TOTAL_EMBERS}`, 28, 74);

  ctx.fillStyle = 'rgba(10, 8, 28, 0.55)';
  roundRect(ctx, VIEW_W - 314, 12, 300, 86, 12);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    heart(ctx, VIEW_W - 288 + i * 30, 44, 22, i < game.moth.lives);
  }
  const comboText = game.comboCount > 1 ? `Combo x${game.comboMult} (${game.comboCount})` : 'Combo —';
  ctx.fillStyle = game.comboCount > 1 ? '#ffb347' : '#d9c9ff';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(comboText, VIEW_W - 28, 30);
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = '#d9c9ff';
  const dashF = dashFraction(game.moth);
  ctx.fillText(dashF >= 1 ? 'Dash ready  [Shift / Space]' : 'Dash recharging…', VIEW_W - 28, 56);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, VIEW_W - 288, 76, 260, 8, 4);
  ctx.fill();
  ctx.fillStyle = dashF >= 1 ? '#ffd76a' : '#9d8cff';
  roundRect(ctx, VIEW_W - 288, 76, 260 * dashF, 8, 4);
  ctx.fill();
  ctx.textAlign = 'left';

  if (game.comboCount > 1 && game.comboTimer > 0) {
    const frac = game.comboTimer / COMBO_WINDOW;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, 28, 106, 120, 6, 3);
    ctx.fill();
    ctx.fillStyle = '#ffb347';
    roundRect(ctx, 28, 106, 120 * frac, 6, 3);
    ctx.fill();
  }

  if (game.level.def.wind !== 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.level.def.wind > 0 ? 'Wind →' : '← Wind', VIEW_W / 2, 22);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(8, 6, 22, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function bigTitle(ctx, text, y, size, color) {
  ctx.font = `bold ${size}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(255, 190, 80, 0.6)';
  ctx.shadowBlur = 26;
  ctx.fillText(text, VIEW_W / 2, y);
  ctx.shadowBlur = 0;
}

function menuLine(ctx, text, y, size, color) {
  ctx.font = `${size}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_W / 2, y);
}

export function drawTitle(ctx, game) {
  overlay(ctx, 0.45);
  bigTitle(ctx, 'LUMEN DRIFT', 190, 84, '#ffe9b0');
  menuLine(ctx, 'A lantern moth. Six night gardens. Ninety embers.', 268, 24, '#e8dcff');
  menuLine(ctx, 'WASD or arrows to fly  ·  Shift or Space to dash  ·  P to pause  ·  M to mute', 320, 19, '#c9b8ef');
  menuLine(ctx, 'Dodge the wisps and spores. Chain embers to raise your combo.', 352, 19, '#c9b8ef');
  menuLine(ctx, 'Collect 15 embers in each garden to reach the Dawn Summit.', 384, 19, '#c9b8ef');
  ctx.fillStyle = '#ffd76a';
  roundRect(ctx, VIEW_W / 2 - 190, 430, 380, 62, 14);
  ctx.fill();
  ctx.fillStyle = '#3a2a10';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Press Enter or click to fly', VIEW_W / 2, 462);
  menuLine(ctx, `Best score: ${game.bestScore}`, 540, 18, '#d9c9ff');
  menuLine(ctx, '3 lives  ·  6 levels  ·  90 embers  ·  dash to escape', 572, 17, '#a99ac9');
}

export function drawLevelClear(ctx, game) {
  overlay(ctx, 0.4);
  bigTitle(ctx, `${game.level.def.name} clear!`, 250, 56, '#ffe9b0');
  menuLine(ctx, `Level bonus +${game.levelBonus}  ·  Score ${game.score}`, 330, 24, '#e8dcff');
  if (game.levelIndex + 1 < 6) {
    menuLine(ctx, `Next: ${game.nextLevelName}`, 380, 22, '#ffd76a');
  }
  menuLine(ctx, 'Press Enter to keep flying', 450, 20, '#c9b8ef');
}

export function drawGameOver(ctx, game) {
  overlay(ctx, 0.55);
  bigTitle(ctx, 'The light fades…', 240, 60, '#ff9d9d');
  menuLine(ctx, `Score ${game.score}  ·  Embers ${TOTAL_EMBERS - game.embersRemaining}/${TOTAL_EMBERS}`, 330, 24, '#e8dcff');
  menuLine(ctx, `Best score: ${game.bestScore}`, 372, 20, '#d9c9ff');
  menuLine(ctx, 'Press Enter or R to try again', 440, 20, '#c9b8ef');
}

export function drawWin(ctx, game) {
  overlay(ctx, 0.4);
  bigTitle(ctx, 'DAWN BREAKS', 200, 72, '#ffe9b0');
  menuLine(ctx, 'Ninety embers gathered. The summit glows with your light.', 280, 24, '#e8dcff');
  menuLine(ctx, `Final score ${game.score}  ·  Best combo x${game.bestComboMult}  ·  Time ${game.winTime}`, 330, 22, '#ffd76a');
  menuLine(ctx, `Best score: ${game.bestScore}`, 372, 20, '#d9c9ff');
  menuLine(ctx, 'Press Enter or R to fly again', 440, 20, '#c9b8ef');
}

export function drawPaused(ctx) {
  overlay(ctx, 0.5);
  bigTitle(ctx, 'Paused', 320, 56, '#ffe9b0');
  menuLine(ctx, 'Press P or Esc to keep flying', 400, 20, '#c9b8ef');
}
