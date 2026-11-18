// Lumen Drift — tuning and level definitions.
// One lantern moth, six night gardens, ninety embers to gather.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// The moth flies with acceleration and drag, so it feels weighty but answers at once.
export const MOTH_ACCEL = 2400;
export const MOTH_MAX_SPEED = 340;
export const MOTH_DRAG = 3.2;
export const MOTH_RADIUS = 16;

// Dash: a short burst with brief invulnerability, then a cooldown.
export const DASH_SPEED = 920;
export const DASH_TIME = 0.16;
export const DASH_COOLDOWN = 1.2;
export const DASH_INVULN = 0.45;

// Getting hit costs a life, clears the combo and grants a short grace period.
export const HIT_INVULN = 1.6;
export const START_LIVES = 3;

// Embers: 15 per level, 90 in all. A quick chain of pickups raises the multiplier.
export const EMBERS_PER_LEVEL = 15;
export const EMBER_RADIUS = 11;
export const EMBER_POINTS = 10;
export const COMBO_WINDOW = 3.0;
export const COMBO_STEP = 4;
export const COMBO_MAX = 5;

// Hazards grow with the level: more of them, and the wisps get faster.
export const WISP_BASE_SPEED = 55;
export const WISP_SPEED_PER_LEVEL = 14;
export const WISP_RADIUS = 15;
export const SPORE_RADIUS = 12;

// Six gardens. Each level names its sky, its ground, its wind and its hazards.
export const LEVELS = [
  {
    name: 'Dusk Meadow',
    skyTop: '#1b1440',
    skyMid: '#3d2060',
    skyBot: '#7a3b5e',
    hillFar: '#2c1f4e',
    hillNear: '#1c1436',
    moon: '#ffe9b0',
    wisps: 2,
    spores: 3,
    wind: 0,
    hint: 'Gather the embers. WASD or arrows to fly.',
  },
  {
    name: 'Firefly Hollow',
    skyTop: '#0f2038',
    skyMid: '#1d4a4a',
    skyBot: '#3f6b4a',
    hillFar: '#16283a',
    hillNear: '#0e1a28',
    moon: '#e8f7c9',
    wisps: 3,
    spores: 4,
    wind: 0,
    hint: 'Chain embers quickly to raise your combo.',
  },
  {
    name: 'Misty Reeds',
    skyTop: '#241a3d',
    skyMid: '#4a2a55',
    skyBot: '#7d4a68',
    hillFar: '#2e2148',
    hillNear: '#1b1430',
    moon: '#ffd9e8',
    wisps: 4,
    spores: 5,
    wind: 12,
    hint: 'A breeze pushes you sideways. Dash to cut through it.',
  },
  {
    name: 'Ember Falls',
    skyTop: '#33131f',
    skyMid: '#5c2333',
    skyBot: '#8a4a2e',
    hillFar: '#3a1c2c',
    hillNear: '#22101e',
    moon: '#ffc46b',
    wisps: 5,
    spores: 5,
    wind: -18,
    hint: 'The wisps are faster now. Keep your distance.',
  },
  {
    name: 'Moonlit Canopy',
    skyTop: '#0c1a30',
    skyMid: '#1e3a5c',
    skyBot: '#3d6a72',
    hillFar: '#14273d',
    hillNear: '#0b1826',
    moon: '#d9ecff',
    wisps: 6,
    spores: 6,
    wind: 22,
    hint: 'Nearly there. One more garden after this.',
  },
  {
    name: 'Dawn Summit',
    skyTop: '#2a1745',
    skyMid: '#6b2d5e',
    skyBot: '#c96f3f',
    hillFar: '#3d2150',
    hillNear: '#241534',
    moon: '#fff3c4',
    wisps: 7,
    spores: 6,
    wind: -26,
    hint: 'The last fifteen embers. Make them count.',
  },
];

export const TOTAL_EMBERS = LEVELS.length * EMBERS_PER_LEVEL;
export const TOTAL_LEVELS = LEVELS.length;

// Colours for the moth, its glow and the embers.
export const MOTH_BODY = '#f7e8c9';
export const MOTH_WING = '#ffd76a';
export const MOTH_WING_EDGE = '#ff9d45';
export const MOTH_GLOW = 'rgba(255, 214, 106, 0.55)';
export const MOTH_TRAIL = '#ffe9b0';
export const EMBER_CORE = '#fff3b0';
export const EMBER_HALO = 'rgba(255, 183, 77, 0.5)';
export const WISP_CORE = '#b388ff';
export const WISP_HALO = 'rgba(150, 110, 255, 0.45)';
export const SPORE_CORE = '#7ee0a3';
export const SPORE_HALO = 'rgba(110, 220, 160, 0.4)';

// Level-clear bonus: a base, plus a reward per life kept, plus speed.
export const CLEAR_BASE_BONUS = 150;
export const CLEAR_LIFE_BONUS = 50;
export const CLEAR_TIME_BONUS_MAX = 300;
