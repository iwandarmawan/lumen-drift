// WebAudio synthesis only: no audio files, no network. Every sound is a
// small oscillator/noise envelope built on first user gesture (browsers
// require a gesture before AudioContext may start).
export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  unlock() {
    if (!this.context) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.context = new Ctx();
    }
    if (this.context.state === 'suspended') this.context.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    gain.gain.setValueAtTime(vol || 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(this.context.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  pickup(combo) {
    // Pitch climbs with the combo so a streak feels like a melody.
    const base = 520 * Math.pow(1.122, Math.min(combo, 8));
    this.tone(base, 0.14, 'sine', 0.14);
    this.tone(base * 1.5, 0.2, 'sine', 0.07);
  }

  dash() {
    this.tone(320, 0.18, 'sawtooth', 0.05, 900);
  }

  shatter() {
    this.tone(180, 0.16, 'square', 0.09, 60);
    this.tone(740, 0.1, 'triangle', 0.08, 220);
  }

  hurt() {
    this.tone(220, 0.3, 'sawtooth', 0.14, 55);
  }

  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.22, 'triangle', 0.12), i * 90);
    });
  }

  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.35, 'triangle', 0.13), i * 120);
    });
  }

  lose() {
    [392, 330, 262, 196].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.3, 'sine', 0.11), i * 140);
    });
  }

  startMusic() {
    if (!this.context || this.musicTimer) return;
    // A slow, quiet pentatonic drift: one soft note every 0.9 s.
    const scale = [220, 262, 294, 330, 392, 440];
    this.musicTimer = setInterval(() => {
      if (this.muted) return;
      const f = scale[this.musicStep % scale.length];
      this.musicStep += 1;
      this.tone(f, 0.8, 'sine', 0.035);
    }, 900);
  }
}
