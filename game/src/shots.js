// Deterministic screenshot scenes: ?shot=<scene>&seed=<n> builds a fixed
// world (seeded RNG, fixed simulated time) so every screenshot is a real
// render of the game's own code, never edited or composited.
import { VIEW } from './config.js';
import { newWorld, startRun, updateWorld, burst } from './world.js';
import { SoundBank } from './audio.js';

const SILENT = { pickup: () => {}, dash: () => {}, shatter: () => {}, hurt: () => {}, levelUp: () => {}, win: () => {}, lose: () => {} };
const NO_INPUT = {
  moveVector: () => ({ x: 0, y: 0 }),
  mouse: { down: false, inside: false, x: 0, y: 0 },
  wasPressed: () => false,
};

function settle(world, seconds) {
  const step = 1 / 60;
  for (let t = 0; t < seconds; t += step) updateWorld(world, NO_INPUT, step, SILENT);
}

export function buildShotScene(scene, seed) {
  const world = newWorld(seed);
  world.best = 1240;
  if (scene === 'start') {
    world.state = 'title';
    world.time = 3.2;
    return world;
  }
  startRun(world);
  if (scene === 'play') {
    // A busy mid-game moment: some embers eaten, shards closing in.
    world.score = 480;
    world.embersCollected = 32;
    world.level = 3;
    world.combo = 3;
    world.comboTimer = 2.1;
    world.player.x = 620;
    world.player.y = 380;
    world.player.vx = 120;
    world.player.vy = -40;
    settle(world, 6);
    world.banner = null;
    // Re-light the combo after the settle so the shot shows it live.
    world.combo = 4;
    world.comboTimer = 2.4;
    world.player.dashTimer = 0.1;
    burst(world, world.player.x + 40, world.player.y - 20, '#ffc94d', 10, 160);
    return world;
  }
  if (scene === 'level') {
    world.score = 760;
    world.embersCollected = 45;
    world.level = 4;
    world.player.x = 560;
    world.player.y = 340;
    settle(world, 8);
    world.banner = { text: 'LEVEL 4', sub: 'The grove grows darker — and faster', timer: 2.2 };
    return world;
  }
  if (scene === 'win') {
    world.score = 1980;
    world.embersCollected = 90;
    world.level = 6;
    world.state = 'win';
    world.best = 1980;
    world.time = 12;
    return world;
  }
  // Default: game over.
  world.score = 640;
  world.embersCollected = 28;
  world.level = 2;
  world.lives = 0;
  world.state = 'over';
  world.time = 9;
  return world;
}

export function applyShotToCanvas(world) {
  // The canvas is 1280x720 in the page; the renderer draws at VIEW size.
  void world;
  window.__shotReady = true;
}

export { SoundBank, VIEW };
