// The three tools, bought with loot coins. Press 1/2/3 to buy AND use —
// the price leaves your purse on the spot, so every use is a decision.
// Each tool has a real tradeoff (see the spec), not just a benefit.
import { TOOLS, ALARM } from './config.js';
import { sendInvestigate } from './guards.js';

export function toolPrice(name) {
  return TOOLS[name].price;
}

/**
 * Try to use a tool. Returns a short message for the HUD.
 * Nothing is charged when the tool cannot be used.
 */
export function useTool(state, name) {
  const tool = TOOLS[name];
  if (!tool) return '';
  if (state.coins < tool.price) {
    state.message = `NEED ${tool.price} COINS for ${tool.name} — grab loot first.`;
    state.messageLeft = 2.5;
    return state.message;
  }

  if (name === 'smoke') {
    state.coins -= tool.price;
    state.smokeActive = true;
    state.smokeLeft = tool.seconds;
    state.smokeX = state.player.x;
    state.smokeY = state.player.y;
    state.smokeRadius = tool.radius;
    state.message = 'SMOKE OUT — 4s blind. You cannot see the cones either!';
    state.messageLeft = 3;
    return state.message;
  }

  if (name === 'emp') {
    state.coins -= tool.price;
    state.empLeft = tool.seconds;
    state.alarm = Math.min(100, state.alarm + ALARM.empNoise);
    state.message = 'EMP BURST — cameras dead 6s, but the buzz raised the alarm +5.';
    state.messageLeft = 3;
    return state.message;
  }

  // lockpick: only useful next to a locked case.
  const target = state.target;
  if (target.locked && Math.hypot(state.player.x - target.x, state.player.y - target.y) < TOOLS.lockpick.radius + 40) {
    state.coins -= tool.price;
    target.locked = false;
    state.message = 'LOCKPICKED — but the click drew the nearest guard to you!';
    state.messageLeft = 3;
    let nearest = null;
    let best = Infinity;
    for (const g of state.guards) {
      const d = Math.hypot(g.x - state.player.x, g.y - state.player.y);
      if (d < best) {
        best = d;
        nearest = g;
      }
    }
    if (nearest) sendInvestigate(nearest, state.player.x, state.player.y);
    return state.message;
  }
  state.message = 'LOCKPICK — stand next to a locked case to use it.';
  state.messageLeft = 2.5;
  return state.message;
}
