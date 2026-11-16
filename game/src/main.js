// Lumen Drift — entry point: the loop, the state machine and the shot
// mode. Everything else (rules, drawing, sound, input) lives in its own
// module; this file only wires them together.
import { VIEW } from './config.js';
import { newWorld, startRun, updateWorld } from './world.js';
import { drawWorld } from './render.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { buildShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const params = new URLSearchParams(window.location.search);
const shotScene = params.get('shot');
const seed = Number(params.get('seed') || 7);

const sounds = new SoundBank();
const input = new Input(canvas);
let world = newWorld(seed);
try {
  world.best = Number(localStorage.getItem('lumen-drift-best') || 0);
} catch {
  world.best = 0;
}

if (shotScene) {
  // Screenshot mode: a fixed scene, no loop, no sound, no input.
  world = buildShotScene(shotScene, seed);
  drawWorld(ctx, world);
  window.__shotReady = true;
} else {
  let last = performance.now();
  let announced = '';

  function announce(text) {
    if (text === announced) return;
    announced = text;
    status.textContent = text;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // --- state keys ---
    if (input.wasPressed('m')) sounds.toggleMute();
    if (input.wasPressed('r') && world.state !== 'title') {
      startRun(world);
      sounds.unlock();
      sounds.startMusic();
    }
    if (input.wasPressed('p') && world.state === 'playing') world.state = 'paused';
    else if (input.wasPressed('p') && world.state === 'paused') world.state = 'playing';
    if (world.state === 'title' && (input.wasPressed('Enter', 'click', ' '))) {
      sounds.unlock();
      sounds.startMusic();
      startRun(world);
    }
    if ((world.state === 'over' || world.state === 'win') && input.wasPressed('Enter', ' ')) {
      startRun(world);
    }

    updateWorld(world, input, dt, sounds);
    drawWorld(ctx, world);
    input.endFrame();

    if (world.best > 0) {
      try { localStorage.setItem('lumen-drift-best', String(Math.max(world.best, world.score))); } catch { /* private mode */ }
    }
    announce(
      world.state === 'playing'
        ? `Score ${world.score}, level ${world.level}, ${world.lives} lives, ${world.embersCollected} of 90 embers.`
        : world.state === 'title'
          ? 'Lumen Drift. Press Enter to begin.'
          : world.state === 'over'
            ? `Game over. Score ${world.score}. Press R to play again.`
            : world.state === 'win'
              ? `You win! Score ${world.score}. Press R to play again.`
              : 'Paused.',
    );
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
