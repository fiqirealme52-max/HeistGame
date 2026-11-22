// Keyboard + mouse input.
// WASD / arrows move, Shift sneaks, 1/2/3 buy & use tools, Space confirms,
// P pauses, click throws a distraction coin toward the click.
import { useTool } from './tools.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

export function createInput(canvas, game) {
  const keys = new Set();
  let actions = 0;
  let click = null;

  function keyOf(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyOf(e);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (e.repeat) return;
    keys.add(k);
    if (k === ' ' || k === 'enter') actions |= ACTION_CONFIRM;
    if (k === 'p' || k === 'P') actions |= ACTION_PAUSE;
    if (k === '1' || k === '2' || k === '3') {
      const name = k === '1' ? 'smoke' : k === '2' ? 'emp' : 'lockpick';
      if (game.screen === 'play') useTool(game, name);
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(keyOf(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    click = { x, y };
    actions |= ACTION_CONFIRM; // click also starts the game from a menu
  });

  return {
    /** Movement vector for this frame: { dx, dy, sneak }. */
    direction() {
      let dx = 0;
      let dy = 0;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;
      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      return { dx, dy, sneak: keys.has('shift') };
    },
    /** One-shot actions since the last read. */
    takeActions() {
      const a = actions;
      actions = 0;
      return a;
    },
    /** The last click (canvas coords), if any, since the last read. */
    takeClick() {
      const c = click;
      click = null;
      return c;
    },
  };
}
