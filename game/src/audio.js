// Lumen Drift — tiny synthesised sounds, no audio files.
// Every sound is a few oscillators through one gain node, made on the fly.

let audioCtx = null;
let muted = false;
let masterGain = null;

function ensureCtx() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audioCtx = new AC();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.22;
  masterGain.connect(audioCtx.destination);
  return audioCtx;
}

function tone(freq, dur, type, vol, slideTo, delay) {
  if (muted) return;
  const ctx = ensureCtx();
  if (!ctx || !masterGain) return;
  const t0 = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol || 0.5, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, lowpass) {
  if (muted) return;
  const ctx = ensureCtx();
  if (!ctx || !masterGain) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass || 1200;
  const gain = ctx.createGain();
  gain.gain.value = vol || 0.3;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start();
}

export function unlockAudio() {
  ensureCtx();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

// A bright two-note chime, rising a little with the combo multiplier.
export function playPickup(comboMult) {
  const base = 620 + (comboMult - 1) * 70;
  tone(base, 0.14, 'sine', 0.5);
  tone(base * 1.5, 0.2, 'sine', 0.35, null, 0.05);
}

// A soft airy sweep for the dash.
export function playDash() {
  tone(300, 0.22, 'triangle', 0.4, 900);
  noiseBurst(0.18, 0.18, 2400);
}

// A dull thud plus a falling tone when a hazard hits.
export function playHurt() {
  tone(220, 0.3, 'sawtooth', 0.4, 70);
  noiseBurst(0.2, 0.3, 500);
}

// A soft two-note chime when a new garden opens.
export function playLevelStart() {
  tone(392, 0.2, 'sine', 0.35);
  tone(587, 0.3, 'sine', 0.35, null, 0.08);
}

// A rising arpeggio when a level is cleared.
export function playLevelClear() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', 0.45, null, i * 0.09));
}

// A longer fanfare for winning the whole game.
export function playWin() {
  [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
    tone(f, 0.3, 'triangle', 0.45, null, i * 0.11),
  );
}

// A low descending line for game over.
export function playGameOver() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'sine', 0.4, null, i * 0.14));
}
