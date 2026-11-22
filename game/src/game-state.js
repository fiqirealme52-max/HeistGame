// Game state machine: title / playing / paused / caught / escaped / over.
// Owns the fixed-step update: player movement, guards, cameras, alarm,
// dawn-as-a-resource, loot, the wing target, the exit and the fair caught
// rule (3 chances, respawn at the wing entrance, alarm kept at half).
import {
  PLAYER,
  GUARD,
  CAMERA,
  ALARM,
  CHANCES,
  GRACE_SECONDS,
  DAWN,
  STEP,
} from './config.js';
import { createRandom } from './random.js';
import { LEVELS, solidsOf, resolveCircle, pointInRect } from './levels.js';
import { createGuards, stepGuard, sendInvestigate, GUARD_CHASE, GUARD_PATROL } from './guards.js';
import { createCameras, stepCamera } from './cameras.js';
import { stepAlarm, dawnFrozen } from './alarm.js';
import { createLoot, collectLoot, tryTarget } from './loot.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';
export const SCREEN_OVER = 'over';

export function createGame(seed) {
  const rng = createRandom(seed);
  const game = {
    seed,
    rng,
    screen: SCREEN_TITLE,
    wingIndex: 0,
    time: 0,
    dawnLeft: DAWN.totalSeconds,
    score: 0,
    coins: 0,
    chances: CHANCES,
    seen: false, // Ghost flag: true the first time any guard/camera sees the thief
    alarm: 0,
    lockdownLeft: 0,
    graceLeft: 0,
    smokeActive: false,
    smokeLeft: 0,
    smokeX: 0,
    smokeY: 0,
    smokeRadius: 0,
    empLeft: 0,
    channelLeft: 0,
    hasTarget: false,
    exitOpen: false,
    message: '',
    messageLeft: 0,
    caughtFlash: 0,
    laserCooldown: 0,
    player: { x: 0, y: 0, dir: 0, sneaking: false },
    playerMoving: false,
    thrownCoin: null,
    laserHits: 0,
  };
  loadWing(game, 0);
  return game;
}

export function loadWing(game, index) {
  const level = LEVELS[index];
  game.level = level;
  game.solids = solidsOf(level);
  game.wingIndex = index;
  game.player.x = level.spawn.x;
  game.player.y = level.spawn.y;
  game.player.dir = -Math.PI / 2;
  game.guards = createGuards(level, game.rng);
  game.cameras = createCameras(level);
  game.loot = createLoot(level);
  game.target = { ...level.target, taken: false };
  game.hasTarget = false;
  game.exitOpen = false;
  game.channelLeft = 0;
  game.smokeActive = false;
  game.smokeLeft = 0;
  game.empLeft = 0;
  game.thrownCoin = null;
  game.message = index === 0
    ? 'WASD move · SHIFT sneak · CLICK throw a coin · 1/2/3 tools · reach the artefact, then the exit.'
    : index === 1
      ? 'WING 2 — the Galeri. Two routes: grand hall or service corridor.'
      : 'WING 3 — the VAULT. The Aurum Mask waits behind the laser grid.';
  game.messageLeft = 5;
}

/** Throw a distraction coin toward (x, y): nearest guards go investigate. */
export function throwCoin(game, x, y) {
  if (game.screen !== SCREEN_PLAY) return;
  if (game.coins < 1) {
    game.message = 'No coins to throw — grab loot first.';
    game.messageLeft = 2;
    return;
  }
  game.coins -= 1;
  game.thrownCoin = { x, y, left: 1.2, startX: game.player.x, startY: game.player.y };
  for (const g of game.guards) {
    if (Math.hypot(g.x - x, g.y - y) < 260) sendInvestigate(g, x, y);
  }
  game.message = 'CLINK — a guard turns toward the coin.';
  game.messageLeft = 2;
}

function movePlayer(game, dx, dy, dt) {
  const p = game.player;
  const speed = p.sneaking ? PLAYER.sneakSpeed : PLAYER.speed;
  const len = Math.hypot(dx, dy);
  if (len < 0.01) {
    game.playerMoving = false;
    return;
  }
  game.playerMoving = true;
  const nx = p.x + (dx / len) * speed * dt;
  const ny = p.y + (dy / len) * speed * dt;
  const [rx, ry] = resolveCircle(nx, ny, PLAYER.radius, game.solids);
  p.x = rx;
  p.y = ry;
  p.dir = Math.atan2(dy, dx);
}

function checkLasers(game) {
  const p = game.player;
  for (const beam of game.level.lasers) {
    if (Math.abs(p.y - beam.y) > 7) continue;
    for (const [x1, x2] of beam.segments) {
      if (p.x > x1 - 4 && p.x < x2 + 4) {
        if (game.laserCooldown > 0) return;
        game.laserCooldown = 1.5;
        game.alarm = Math.min(100, game.alarm + ALARM.laserHit);
        game.seen = true;
        game.laserHits += 1;
        game.message = 'LASER TRIPPED! Alarm +20 — weave through the gaps.';
        game.messageLeft = 2.5;
        return;
      }
    }
  }
}

/** One fixed 1/60 s step of live play. Returns an event string or ''. */
export function stepGame(game, input, dt = STEP) {
  if (game.screen !== SCREEN_PLAY) return '';
  game.time += dt;
  if (game.laserCooldown > 0) game.laserCooldown -= dt;
  if (game.graceLeft > 0) game.graceLeft -= dt;
  if (game.messageLeft > 0) game.messageLeft -= dt;
  if (game.caughtFlash > 0) game.caughtFlash -= dt;
  if (game.smokeLeft > 0) {
    game.smokeLeft -= dt;
    if (game.smokeLeft <= 0) game.smokeActive = false;
  }
  if (game.empLeft > 0) game.empLeft -= dt;

  // Thrown coin arc (visual + the guards already turned when thrown).
  if (game.thrownCoin) {
    game.thrownCoin.left -= dt;
    if (game.thrownCoin.left <= 0) game.thrownCoin = null;
  }

  movePlayer(game, input.dx, input.dy, dt);
  game.player.sneaking = input.sneak;

  // Dawn ticks only while the museum is calm — alarm freezes it.
  let chasing = false;
  for (const g of game.guards) if (g.mode === GUARD_CHASE) chasing = true;
  if (!dawnFrozen(game, chasing)) {
    game.dawnLeft -= dt;
    if (game.dawnLeft <= 0) {
      game.dawnLeft = 0;
      game.screen = SCREEN_OVER;
      game.message = 'DAWN BROKE — the museum wakes. The Mask stays.';
      return 'dawn';
    }
  }

  // Guards + cameras.
  let seen = false;
  let caught = false;
  for (const g of game.guards) {
    const result = stepGuard(g, game, dt, game.solids);
    if (result === 'caught') caught = true;
    else if (result) seen = true;
  }
  for (const cam of game.cameras) {
    if (stepCamera(cam, game, dt, game.solids)) seen = true;
  }
  if (seen) game.seen = true;
  chasing = false;
  for (const g of game.guards) if (g.mode === GUARD_CHASE) chasing = true;

  stepAlarm(game, dt, seen, chasing);
  checkLasers(game);

  // Loot, target, exit.
  collectLoot(game);
  tryTarget(game, dt);
  const exit = game.level.exit;
  if (game.exitOpen && Math.hypot(game.player.x - exit.x, game.player.y - exit.y) < 42) {
    if (game.wingIndex < LEVELS.length - 1) {
      loadWing(game, game.wingIndex + 1);
      return 'wing';
    }
    game.screen = SCREEN_ESCAPED;
    return 'escaped';
  }

  if (caught) {
    game.chances -= 1;
    game.caughtFlash = 1.2;
    if (game.chances <= 0) {
      game.screen = SCREEN_OVER;
      game.message = 'Caught three times — the museum wins this dawn.';
      return 'over';
    }
    // Fair caught: respawn at the wing entrance, alarm kept at half,
    // 3 seconds of grace to get moving again.
    game.player.x = game.level.spawn.x;
    game.player.y = game.level.spawn.y;
    game.alarm = Math.floor(game.alarm / 2);
    game.graceLeft = GRACE_SECONDS;
    for (const g of game.guards) {
      g.mode = GUARD_PATROL;
      g.suspicion = 0;
      g.chaseLeft = 0;
    }
    game.message = `CAUGHT! Chance ${game.chances} of ${CHANCES} left — back at the entrance. Grace: 3s.`;
    game.messageLeft = 3.5;
    game.screen = SCREEN_CAUGHT;
    return 'caught';
  }
  return '';
}

/** After the caught screen, return to play (Space / click). */
export function resumeAfterCaught(game) {
  if (game.screen === SCREEN_CAUGHT) game.screen = SCREEN_PLAY;
}

export function startGame(game) {
  game.screen = SCREEN_PLAY;
  game.time = 0;
}

export function resetGame(game) {
  const seed = game.seed;
  const fresh = createGame(seed);
  Object.keys(game).forEach((k) => delete game[k]);
  Object.assign(game, fresh);
}

export { GUARD, CAMERA };
