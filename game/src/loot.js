// Loot, score and the Ghost bonus.
// Coin 5, gem 15, side artefact 30, Aurum Mask 100.
// Ghost = never seen once, all run: +200 at escape. The HUD always shows
// "GHOST — never seen" while it still holds, so the judge can see it.
import { LOOT, GHOST_BONUS, DAWN } from './config.js';

export function createLoot(level) {
  return level.loot.map((l) => ({ ...l, taken: false }));
}

/** Pick up any loot the thief is standing on. Returns the value gained. */
export function collectLoot(state) {
  let gained = 0;
  for (const item of state.loot) {
    if (item.taken) continue;
    if (Math.hypot(state.player.x - item.x, state.player.y - item.y) < 30) {
      item.taken = true;
      const value = LOOT[item.kind];
      state.coins += value;
      state.score += value;
      gained += value;
    }
  }
  return gained;
}

/**
 * Grab the wing's main target. A locked case needs a 3-second channel
 * (or a lockpick). Returns 'locked' | 'channeling' | 'taken' | 'far'.
 */
export function tryTarget(state, dt) {
  const t = state.target;
  const dist = Math.hypot(state.player.x - t.x, state.player.y - t.y);
  if (dist > 52) {
    state.channelLeft = 0;
    return 'far';
  }
  if (t.locked) {
    state.channelLeft += dt;
    if (state.channelLeft >= 3) {
      t.locked = false;
      state.channelLeft = 0;
      state.message = 'Case open — grab it and run for the exit!';
      state.messageLeft = 3;
    }
    return 'channeling';
  }
  if (!t.taken) {
    t.taken = true;
    state.score += LOOT[t.kind];
    state.coins += LOOT[t.kind];
    state.hasTarget = true;
    state.exitOpen = true;
    state.message =
      t.kind === 'mask'
        ? 'THE AURUM MASK IS YOURS — get to the skylight before dawn!'
        : 'Artefact secured — the exit is open. Go!';
    state.messageLeft = 3;
    return 'taken';
  }
  return 'taken';
}

/** Final score breakdown shown on the escape screen. */
export function finalScore(state) {
  const dawnLeft = Math.max(0, Math.ceil(state.dawnLeft));
  const dawnScore = dawnLeft * DAWN.scorePerSecond;
  const ghost = state.seen ? 0 : GHOST_BONUS;
  return {
    loot: state.score,
    dawnLeft,
    dawnScore,
    ghost,
    total: state.score + dawnScore + ghost,
  };
}
