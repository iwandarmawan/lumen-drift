// Keyboard + mouse input. The player steers with WASD or arrow keys and
// the mouse: holding the mouse button steers toward the cursor, Space or
// a click dashes. P pauses, M mutes, R restarts, Enter starts.
import { VIEW } from './config.js';

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false, inside: false };
    this.pressed = new Set(); // edge-triggered keys, consumed each frame

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!e.repeat) this.pressed.add(key);
      this.keys.add(key);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    });
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * VIEW.width;
      this.mouse.y = ((e.clientY - rect.top) / rect.height) * VIEW.height;
      this.mouse.inside = true;
    });
    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.mouse.down = true;
      this.pressed.add('click');
    });
    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  down(...names) {
    return names.some((n) => this.keys.has(n));
  }

  wasPressed(...names) {
    return names.some((n) => this.pressed.has(n));
  }

  // Movement vector from keys (-1..1 on each axis), normalised.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down('a', 'ArrowLeft')) x -= 1;
    if (this.down('d', 'ArrowRight')) x += 1;
    if (this.down('w', 'ArrowUp')) y -= 1;
    if (this.down('s', 'ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  endFrame() {
    this.pressed.clear();
  }
}
