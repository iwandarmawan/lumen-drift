// Lumen Drift — configuration: every tunable number lives here so the
// game can be balanced without touching the simulation or the renderer.
export const VIEW = { width: 1280, height: 720 };

export const PLAYER = {
  radius: 16,
  speed: 340, // pixels per second
  dashSpeed: 980,
  dashTime: 0.16, // seconds of dash
  dashCooldown: 2.2, // seconds before the next dash
  invulnerableTime: 1.6, // seconds of safety after a hit
  accel: 2600,
  friction: 6.5,
};

export const EMBERS = {
  target: 7, // embers kept on the field at once
  radius: 9,
  score: 10,
  comboWindow: 3.0, // seconds to keep the combo alive
  comboMax: 5,
  life: 9, // seconds before an ember fades away
};

export const SHARDS = {
  radius: 15,
  baseSpeed: 48,
  speedPerLevel: 10,
  maxSpeed: 175,
  spawnInterval: 3.0, // seconds at level 1
  spawnIntervalMin: 1.2,
  shatterScore: 25,
};

export const GAME = {
  startLives: 3,
  embersPerLevel: 15, // embers collected to rise one level
  winLevel: 6, // reaching this level wins the run
  levelTime: 0, // no timer: levels come from collecting
  emberGoal: 90, // embers to collect to win (6 levels x 15)
};

export const COLORS = {
  skyTop: '#0b1026',
  skyBottom: '#1b1440',
  ember: '#ffc94d',
  emberCore: '#fff3c4',
  shard: '#c65df0',
  shardCore: '#f0a6ff',
  player: '#8ef0ff',
  playerCore: '#eafcff',
  heart: '#ff6b81',
  text: '#f2ecff',
  dim: '#a99fd6',
};
