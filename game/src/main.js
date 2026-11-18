// Lumen Drift — the game loop and state machine.
// States: title → playing → level-clear → playing … → win, or → game-over.
// Restart any time with R. A ?shot= parameter jumps straight to a screen so the
// maker can photograph it: title, play, clear, over, win.

import {
  VIEW_W,
  VIEW_H,
  EMBERS_PER_LEVEL,
  EMBER_POINTS,
  COMBO_WINDOW,
  COMBO_STEP,
  COMBO_MAX,
  TOTAL_EMBERS,
  TOTAL_LEVELS,
  LEVELS,
  MOTH_TRAIL,
  CLEAR_BASE_BONUS,
  CLEAR_LIFE_BONUS,
  CLEAR_TIME_BONUS_MAX,
} from './config.js';
import { buildLevel, embersLeft } from './world.js';
import { makeMoth, resetMoth, updateMoth, hurtMoth } from './moth.js';
import {
  updateWisps,
  updateSpores,
  hazardHit,
  makeParticles,
  spawnBurst,
  spawnTrail,
  updateParticles,
} from './hazards.js';
import {
  drawWorld,
  drawHud,
  drawTitle,
  drawLevelClear,
  drawGameOver,
  drawWin,
  drawPaused,
} from './render.js';
import {
  unlockAudio,
  toggleMute,
  playPickup,
  playDash,
  playHurt,
  playLevelStart,
  playLevelClear,
  playWin,
  playGameOver,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export const game = {
  state: 'title',
  levelIndex: 0,
  level: null,
  moth: makeMoth(),
  particles: makeParticles(),
  score: 0,
  bestScore: 0,
  comboCount: 0,
  comboMult: 1,
  comboTimer: 0,
  bestComboMult: 1,
  embersRemaining: TOTAL_EMBERS,
  levelBonus: 0,
  nextLevelName: '',
  elapsed: 0,
  levelTime: 0,
  winTime: '',
  paused: false,
  shotMode: null,
};

const keys = {};
let dashQueued = false;

function loadBest() {
  try {
    const v = Number(window.localStorage.getItem('lumen-drift-best'));
    game.bestScore = Number.isFinite(v) ? v : 0;
  } catch (e) {
    game.bestScore = 0;
  }
}

function saveBest() {
  try {
    window.localStorage.setItem('lumen-drift-best', String(game.bestScore));
  } catch (e) {
    // Storage may be unavailable; the score still shows this run.
  }
}

function startLevel(index) {
  game.levelIndex = index;
  game.level = buildLevel(index);
  game.levelTime = 0;
  resetMoth(game.moth);
  game.comboCount = 0;
  game.comboMult = 1;
  game.comboTimer = 0;
  game.state = 'playing';
  playLevelStart();
}

function startGame() {
  game.score = 0;
  game.comboCount = 0;
  game.comboMult = 1;
  game.comboTimer = 0;
  game.bestComboMult = 1;
  game.elapsed = 0;
  game.embersRemaining = TOTAL_EMBERS;
  game.moth = makeMoth();
  startLevel(0);
}

function levelClear() {
  const timeBonus = Math.max(0, CLEAR_TIME_BONUS_MAX - Math.floor(game.levelTime));
  game.levelBonus = CLEAR_BASE_BONUS + game.moth.lives * CLEAR_LIFE_BONUS + timeBonus;
  game.score += game.levelBonus;
  if (game.levelIndex + 1 < TOTAL_LEVELS) {
    game.nextLevelName = LEVELS[game.levelIndex + 1].name;
  }
  game.state = 'clear';
  playLevelClear();
}

function nextLevel() {
  startLevel(game.levelIndex + 1);
}

function gameOver() {
  game.state = 'over';
  if (game.score > game.bestScore) {
    game.bestScore = game.score;
    saveBest();
  }
  playGameOver();
}

function winGame() {
  game.state = 'win';
  const total = Math.floor(game.elapsed);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  game.winTime = `${mm}:${ss}`;
  if (game.score > game.bestScore) {
    game.bestScore = game.score;
    saveBest();
  }
  playWin();
}

function collectEmber(e) {
  e.taken = true;
  game.embersRemaining -= 1;
  game.comboCount += 1;
  game.comboTimer = COMBO_WINDOW;
  game.comboMult = Math.min(COMBO_MAX, 1 + Math.floor(game.comboCount / COMBO_STEP));
  if (game.comboMult > game.bestComboMult) game.bestComboMult = game.comboMult;
  game.score += EMBER_POINTS * game.comboMult;
  spawnBurst(game.particles, e.x, e.y, '#ffd76a', 14, 170);
  playPickup(game.comboMult);
  if (embersLeft(game.level) === 0) {
    if (game.levelIndex + 1 >= TOTAL_LEVELS) {
      winGame();
    } else {
      levelClear();
    }
  }
}

// ---- input, update, render, boot ----

function readInput() {
  let x = 0;
  let y = 0;
  if (keys['arrowleft'] || keys['a']) x -= 1;
  if (keys['arrowright'] || keys['d']) x += 1;
  if (keys['arrowup'] || keys['w']) y -= 1;
  if (keys['arrowdown'] || keys['s']) y += 1;
  if (x !== 0 && y !== 0) {
    const len = Math.hypot(x, y);
    x /= len;
    y /= len;
  }
  return { x, y };
}

function update(dt) {
  if (game.paused) return;
  game.level.time += dt;
  if (game.state === 'playing') {
    game.elapsed += dt;
    game.levelTime += dt;
    const input = readInput();
    const dash = dashQueued;
    dashQueued = false;
    const wasDashing = game.moth.dashTimer > 0;
    updateMoth(game.moth, input, dash, game.level.def.wind, dt);
    if (dash && game.moth.dashTimer > 0 && !wasDashing) playDash();
    if (game.moth.dashTimer > 0) {
      spawnTrail(game.particles, game.moth.x, game.moth.y, MOTH_TRAIL);
    }
    updateWisps(game.level, game.moth, dt);
    updateSpores(game.level, dt);

    for (const e of game.level.embers) {
      if (e.taken) continue;
      const bobY = e.y + Math.sin(game.level.time * 1.6 + e.phase) * e.bob * 0.3;
      const dx = game.moth.x - e.x;
      const dy = game.moth.y - bobY;
      if (dx * dx + dy * dy < (game.moth.radius + 13) * (game.moth.radius + 13)) {
        collectEmber(e);
        if (game.state !== 'playing') break;
      }
    }

    const hit = game.state === 'playing' ? hazardHit(game.level, game.moth) : null;
    if (hit) {
      const wasAlive = game.moth.alive;
      if (hurtMoth(game.moth)) {
        game.comboCount = 0;
        game.comboMult = 1;
        game.comboTimer = 0;
        spawnBurst(game.particles, game.moth.x, game.moth.y, '#ff6b81', 18, 220);
        playHurt();
        if (wasAlive && !game.moth.alive) gameOver();
      }
    }

    if (game.comboTimer > 0) {
      game.comboTimer -= dt;
      if (game.comboTimer <= 0) {
        game.comboCount = 0;
        game.comboMult = 1;
      }
    }
  }
  updateParticles(game.particles, dt);
}

function render() {
  drawWorld(ctx, game.level, game.moth, game.particles, game.level.time);
  if (game.state === 'playing' || game.state === 'clear') drawHud(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'clear') drawLevelClear(ctx, game);
  if (game.state === 'over') drawGameOver(ctx, game);
  if (game.state === 'win') drawWin(ctx, game);
  if (game.paused && game.state === 'playing') drawPaused(ctx);
}

let lastTime = 0;
function loop(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000 || 0.016);
  lastTime = timestamp;
  update(dt);
  render();
  window.requestAnimationFrame(loop);
}

function advance() {
  if (game.state === 'title') {
    unlockAudio();
    startGame();
  } else if (game.state === 'clear') {
    nextLevel();
  } else if (game.state === 'over' || game.state === 'win') {
    startGame();
  }
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    e.preventDefault();
  }
  if (e.repeat) return;
  keys[k] = true;
  if (k === 'shift' || k === ' ') dashQueued = true;
  if (k === 'enter') advance();
  if (k === 'r' && (game.state === 'over' || game.state === 'win')) startGame();
  if (k === 'm') toggleMute();
  if ((k === 'p' || k === 'escape') && game.state === 'playing') {
    game.paused = !game.paused;
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('pointerdown', () => {
  unlockAudio();
  if (game.state !== 'playing') {
    advance();
  } else {
    dashQueued = true;
  }
});

// Screenshot hook: ?shot=title|play|clear|over|win jumps straight to that screen
// with a lived-in game behind it, so the maker can photograph real renders.
function applyShotMode() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return;
  game.shotMode = shot;
  startGame();
  if (shot === 'title') {
    game.state = 'title';
    return;
  }
  if (shot === 'play') {
    // A mid-level scene: some embers already gathered, combo running.
    game.score = 1240;
    game.comboCount = 9;
    game.comboMult = 3;
    game.comboTimer = 2.2;
    game.bestComboMult = 3;
    let n = 0;
    for (const e of game.level.embers) {
      if (n < 6) {
        e.taken = true;
        n++;
      }
    }
    game.embersRemaining -= 6;
    game.moth.x = 640;
    game.moth.y = 380;
    game.moth.vx = 180;
    return;
  }
  if (shot === 'clear') {
    game.levelBonus = 250;
    game.score = 1980;
    game.nextLevelName = LEVELS[1].name;
    let n = 0;
    for (const e of game.level.embers) {
      if (n < 15) {
        e.taken = true;
        n++;
      }
    }
    game.embersRemaining -= 15;
    game.state = 'clear';
    return;
  }
  if (shot === 'over') {
    game.score = 860;
    game.moth.lives = 0;
    game.moth.alive = false;
    game.embersRemaining = 71;
    game.state = 'over';
    return;
  }
  if (shot === 'win') {
    game.score = 4860;
    game.bestComboMult = 5;
    game.winTime = '07:42';
    game.embersRemaining = 0;
    game.state = 'win';
  }
}

loadBest();
game.level = buildLevel(0);
applyShotMode();
window.requestAnimationFrame(loop);
window.__lumenDrift = game;
