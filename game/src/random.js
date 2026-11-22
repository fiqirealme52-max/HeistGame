// Seeded RNG (mulberry32) — determinism for ?seed=N and the ?shot= frames.
// No Math.random anywhere in game logic, so the same seed always replays the same game.
export function createRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from a seeded rng. */
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick one element from an array using a seeded rng. */
export function randPick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}
