// Lumen Drift — the lantern moth.
// Flies with acceleration and drag, dashes on command, and flashes briefly
// invulnerable after a dash or a hit.

import {
  VIEW_W,
  VIEW_H,
  MOTH_ACCEL,
  MOTH_MAX_SPEED,
  MOTH_DRAG,
  MOTH_RADIUS,
  DASH_SPEED,
  DASH_TIME,
  DASH_COOLDOWN,
  DASH_INVULN,
  HIT_INVULN,
  START_LIVES,
} from './config.js';

export function makeMoth() {
  return {
    x: VIEW_W / 2,
    y: VIEW_H / 2 + 80,
    vx: 0,
    vy: 0,
    radius: MOTH_RADIUS,
    face: 1,
    wingPhase: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashDirX: 1,
    dashDirY: 0,
    invuln: 0,
    lives: START_LIVES,
    alive: true,
  };
}

// The moth always restarts from the same garden gate, briefly shielded.
export function resetMoth(moth) {
  moth.x = VIEW_W / 2;
  moth.y = VIEW_H / 2 + 80;
  moth.vx = 0;
  moth.vy = 0;
  moth.dashTimer = 0;
  moth.dashCooldown = 0;
  moth.invuln = 1.0;
  moth.alive = true;
}

// input: {x, y} unit-ish direction from keys; dashPressed: edge-triggered.
export function updateMoth(moth, input, dashPressed, wind, dt) {
  if (!moth.alive) return;
  moth.wingPhase += dt * (10 + Math.min(14, Math.hypot(moth.vx, moth.vy) / 28));
  if (moth.invuln > 0) moth.invuln -= dt;
  if (moth.dashCooldown > 0) moth.dashCooldown -= dt;

  if (dashPressed && moth.dashCooldown <= 0 && moth.dashTimer <= 0) {
    let dx = input.x;
    let dy = input.y;
    if (dx === 0 && dy === 0) {
      dx = moth.face;
      dy = 0;
    }
    const len = Math.hypot(dx, dy) || 1;
    moth.dashDirX = dx / len;
    moth.dashDirY = dy / len;
    moth.dashTimer = DASH_TIME;
    moth.dashCooldown = DASH_COOLDOWN;
    moth.invuln = Math.max(moth.invuln, DASH_INVULN);
  }

  if (moth.dashTimer > 0) {
    moth.dashTimer -= dt;
    moth.vx = moth.dashDirX * DASH_SPEED;
    moth.vy = moth.dashDirY * DASH_SPEED;
  } else {
    moth.vx += input.x * MOTH_ACCEL * dt;
    moth.vy += input.y * MOTH_ACCEL * dt;
    moth.vx += wind * dt;
    const drag = Math.exp(-MOTH_DRAG * dt);
    moth.vx *= drag;
    moth.vy *= drag;
    const speed = Math.hypot(moth.vx, moth.vy);
    if (speed > MOTH_MAX_SPEED) {
      moth.vx = (moth.vx / speed) * MOTH_MAX_SPEED;
      moth.vy = (moth.vy / speed) * MOTH_MAX_SPEED;
    }
  }

  moth.x += moth.vx * dt;
  moth.y += moth.vy * dt;
  const m = moth.radius + 6;
  if (moth.x < m) {
    moth.x = m;
    moth.vx = Math.max(0, moth.vx);
  }
  if (moth.x > VIEW_W - m) {
    moth.x = VIEW_W - m;
    moth.vx = Math.min(0, moth.vx);
  }
  if (moth.y < m) {
    moth.y = m;
    moth.vy = Math.max(0, moth.vy);
  }
  if (moth.y > VIEW_H - m) {
    moth.y = VIEW_H - m;
    moth.vy = Math.min(0, moth.vy);
  }
  if (Math.abs(moth.vx) > 12) moth.face = moth.vx > 0 ? 1 : -1;
}

export function hurtMoth(moth) {
  if (moth.invuln > 0 || !moth.alive) return false;
  moth.lives -= 1;
  moth.invuln = HIT_INVULN;
  moth.vx = -moth.face * 260;
  moth.vy = -180;
  if (moth.lives <= 0) moth.alive = false;
  return true;
}

export function isDashing(moth) {
  return moth.dashTimer > 0;
}

export function dashFraction(moth) {
  if (moth.dashCooldown <= 0) return 1;
  return 1 - moth.dashCooldown / DASH_COOLDOWN;
}
