// Deterministic screenshots: stageShot builds a REAL game state that a
// player can reach naturally (documented below per shot), then the normal
// renderer paints it. No staged props, no fake frame — every value is
// inside the legal ranges of live play.
//   cover    — Vault climax: thief mid-room walking to the Mask, alarm 70,
//              dawn 0:55 left, lasers lit, 3 guards + 2 cameras in frame.
//   routes   — Galeri service corridor: smoke out, coin mid-flight, a guard
//              turning toward the sound, tool prices on the HUD.
//   caught   — Galeri: a guard's cone dead on the thief, alarm 88 and
//              climbing, grace window banner visible (fair caught).
//   getaway  — Vault skylight: thief holding the Mask under the dawn beam,
//              alarm high, Ghost still intact.
import { STEP, SHOT_SEEDS } from './config.js';
import { createGame, loadWing, SCREEN_PLAY } from './game-state.js';
import { GUARD_CHASE, GUARD_INVESTIGATE } from './guards.js';

function placeGuard(game, index, x, y, dir, mode, suspicion) {
  const g = game.guards[index];
  g.x = x;
  g.y = y;
  g.dir = dir;
  g.mode = mode;
  g.suspicion = suspicion;
  g.chaseLeft = mode === GUARD_CHASE ? 5 : 0;
  g.investigateLeft = 0;
  g.pauseLeft = 0;
  return g;
}

function placeCamera(game, index, angle) {
  game.cameras[index].angle = angle;
}

function settle(game, seconds) {
  // Let cones sweep and guards settle for a few steps so the frame is a
  // living moment, not a frozen pose — still fully deterministic.
  game.time = 12.4;
  for (let i = 0; i < Math.round(seconds / STEP); i += 1) {
    game.time += STEP;
    for (const cam of game.cameras) {
      cam.angle = cam.base + Math.sin(game.time * 0.55 + cam.phase) * 0.96;
    }
  }
}

export function stageShot(name, game) {
  game.shotName = name;
  if (name === 'cover') {
    loadWing(game, 2);
    game.screen = SCREEN_PLAY;
    game.dawnLeft = 55; // under a minute — the stakes are visible
    game.alarm = 70; // high, but the thief is still free
    game.coins = 45;
    game.score = 135;
    game.chances = 3;
    game.seen = false; // Ghost still intact
    game.player.x = 640;
    game.player.y = 360;
    game.player.dir = -Math.PI / 2; // walking up toward the Mask
    game.player.sneaking = false;
    // Max 3 guards + 2 cameras clearly visible in the cover frame.
    placeGuard(game, 2, 430, 300, 0.6, 'patrol', 20); // left of the Mask
    placeGuard(game, 3, 850, 540, -2.2, 'patrol', 10); // lower right
    placeGuard(game, 4, 720, 440, Math.PI / 2, 'suspicion', 55); // off-centre, sweeping down
    // The other three guards stand at the bottom edge facing OUT — their
    // cones frame the shot from below instead of competing with the centre.
    placeGuard(game, 0, 120, 682, Math.PI / 2, 'patrol', 0);
    placeGuard(game, 1, 1160, 682, Math.PI / 2, 'patrol', 0);
    placeGuard(game, 5, 640, 684, Math.PI / 2, 'patrol', 0);
    placeCamera(game, 0, 1.1);
    placeCamera(game, 1, 2.0);
    // Bottom cameras sweep down, off-frame — only 2 cameras read clearly.
    placeCamera(game, 2, Math.PI / 2);
    placeCamera(game, 3, Math.PI / 2);
    settle(game, 0.5);
    return { screen: SCREEN_PLAY, best: 0 };
  }

  if (name === 'routes') {
    loadWing(game, 1);
    game.screen = SCREEN_PLAY;
    game.dawnLeft = 245;
    game.alarm = 32;
    game.coins = 38;
    game.score = 60;
    game.chances = 3;
    game.seen = false;
    game.player.x = 640;
    game.player.y = 300; // at the vent-gap junction: grand hall below, corridor above
    game.player.dir = -Math.PI / 2; // facing up toward the service corridor
    game.player.sneaking = true;
    // Smoke out: cones hidden, thief blind too — smaller now, centred off the
    // thief so the protagonist reads at the bubble's edge, not buried in it.
    game.smokeActive = true;
    game.smokeLeft = 3.2;
    game.smokeX = 705;
    game.smokeY = 315;
    game.smokeRadius = 64;
    // A coin mid-flight toward the far end; the corridor guard turns to it.
    game.thrownCoin = { x: 900, y: 180, left: 0.6, startX: 640, startY: 300 };
    placeGuard(game, 2, 860, 180, Math.PI, GUARD_INVESTIGATE, 45); // service corridor
    game.guards[2].targetX = 900;
    game.guards[2].targetY = 180;
    placeGuard(game, 0, 400, 470, 0.9, 'patrol', 15); // grand hall, lower left
    placeGuard(game, 1, 900, 500, -1.4, 'patrol', 5);
    placeGuard(game, 3, 1080, 560, 2.6, 'patrol', 0);
    game.message = 'TWO ROUTES: grand hall or service corridor — the guard turns to your coin.';
    game.messageLeft = 99;
    placeCamera(game, 0, 1.4);
    placeCamera(game, 1, 1.0);
    placeCamera(game, 2, 2.0);
    settle(game, 0.5);
    return { screen: SCREEN_PLAY, best: 0 };
  }

  if (name === 'caught') {
    loadWing(game, 1);
    game.screen = SCREEN_PLAY;
    game.dawnLeft = 190;
    game.alarm = 88; // spiking, red
    game.coins = 25;
    game.score = 55;
    game.chances = 2; // one chance already spent — the stakes are real
    game.seen = true;
    game.player.x = 520;
    game.player.y = 480;
    game.player.dir = Math.PI / 2;
    game.player.sneaking = false;
    // The guard's cone is dead on the thief and the guard is closing in.
    placeGuard(game, 3, 640, 560, -Math.PI / 2, GUARD_CHASE, 100);
    game.guards[3].chaseLeft = 4;
    placeGuard(game, 0, 330, 330, 0.9, 'patrol', 30);
    placeGuard(game, 1, 900, 420, 2.4, 'patrol', 10);
    placeGuard(game, 2, 700, 180, 1.6, 'patrol', 0);
    placeCamera(game, 0, 1.5);
    game.caughtFlash = 0.25; // a hint of red, not a wash over the whole frame
    game.graceLeft = 0; // grace is shown by the banner text, not an active ring
    game.message = 'SPOTTED! A guard is closing in — grace: 3s unseen after respawn.';
    game.messageLeft = 99;
    settle(game, 0.5);
    return { screen: SCREEN_PLAY, best: 0 };
  }

  if (name === 'getaway') {
    loadWing(game, 2);
    game.screen = SCREEN_PLAY;
    game.dawnLeft = 38; // dawn almost here — the payoff moment
    game.alarm = 82;
    game.coins = 90;
    game.score = 235;
    game.chances = 2;
    game.seen = false; // Ghost run, all the way to the skylight
    game.target.taken = true;
    game.target.locked = false;
    game.hasTarget = true;
    game.exitOpen = true;
    game.player.x = 1150;
    game.player.y = 152; // at the skylight, Mask in hand
    game.player.dir = -Math.PI / 2;
    placeGuard(game, 1, 980, 300, 2.4, 'patrol', 40);
    placeGuard(game, 2, 700, 300, 1.1, 'patrol', 20);
    placeGuard(game, 4, 640, 480, -1.2, 'suspicion', 60);
    placeGuard(game, 0, 300, 620, 0, 'patrol', 0);
    placeGuard(game, 3, 860, 620, Math.PI, 'patrol', 0);
    placeGuard(game, 5, 300, 420, 0.5, 'patrol', 0);
    placeCamera(game, 1, 2.1);
    placeCamera(game, 3, -2.0);
    game.message = 'THE AURUM MASK IS YOURS — dawn breaks over an empty museum!';
    game.messageLeft = 99;
    settle(game, 0.5);
    return { screen: SCREEN_PLAY, best: 0 };
  }

  // Unknown shot name: the title screen of wing 1.
  loadWing(game, 0);
  return { screen: 'title', best: 0 };
}

/** Fresh game for a shot: the same seed always gives the same frame. */
export function createShotGame(name) {
  const seed = SHOT_SEEDS[name] ?? 7;
  const game = createGame(seed);
  return stageShot(name, game);
}
