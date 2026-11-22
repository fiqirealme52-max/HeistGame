// Guard AI: waypoint patrol, vision cone, suspicion, chase, investigate.
// A guard never sees through walls or display cases, and never sees through
// smoke. Suspicion is fair: it rises only while the thief is inside the cone.
import { GUARD, PLAYER } from './config.js';
import { losBlocked, resolveCircle } from './levels.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICION = 'suspicion';
export const GUARD_CHASE = 'chase';
export const GUARD_INVESTIGATE = 'investigate';

/** Build the guard objects for a wing definition. */
export function createGuards(level, rng) {
  return level.guards.map((g, i) => {
    const [sx, sy] = g.waypoints[0];
    const [tx, ty] = g.waypoints[1 % g.waypoints.length];
    return {
      id: i,
      x: sx,
      y: sy,
      dir: Math.atan2(ty - sy, tx - sx),
      waypoints: g.waypoints,
      wp: 1 % g.waypoints.length,
      mode: GUARD_PATROL,
      suspicion: 0,
      chaseLeft: 0,
      investigateLeft: 0,
      targetX: sx,
      targetY: sy,
      pauseLeft: rng() * 0.6,
      seenPlayer: false,
    };
  });
}

/**
 * Can `observer` at (ox,oy) facing `angle` see the player?
 * Range + cone + line of sight + smoke + sneak all count.
 */
export function canSee(ox, oy, angle, range, halfAngle, state, solids) {
  const p = state.player;
  const dx = p.x - ox;
  const dy = p.y - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 18) return !state.smokeActive; // point blank: seen unless in smoke
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > halfAngle) return false;
  if (losBlocked(ox, oy, p.x, p.y, solids)) return false;
  if (state.smokeActive && insideSmoke(p.x, p.y, state)) return false;
  return true;
}

function insideSmoke(x, y, state) {
  if (!state.smokeActive) return false;
  return Math.hypot(x - state.smokeX, y - state.smokeY) < state.smokeRadius;
}

function moveToward(g, tx, ty, speed, dt, solids) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  let nx = g.x + (dx / d) * step;
  let ny = g.y + (dy / d) * step;
  [nx, ny] = resolveCircle(nx, ny, GUARD.radius, solids);
  g.x = nx;
  g.y = ny;
  g.dir = Math.atan2(dy, dx);
  return d - step < 2;
}

/**
 * Advance one guard one fixed step. Returns true when this guard is
 * currently looking at the thief (drives the alarm + the Ghost flag).
 */
export function stepGuard(g, state, dt, solids) {
  const p = state.player;
  const sees = state.graceLeft <= 0 && canSee(g.x, g.y, g.dir, GUARD.coneRange, GUARD.coneHalfAngle, state, solids);
  g.seenPlayer = sees;

  if (sees) {
    const dist = Math.hypot(p.x - g.x, p.y - g.y);
    const rate = dist < 90 ? GUARD.suspicionClose : dist < 160 ? GUARD.suspicionMid : GUARD.suspicionFar;
    const moving = state.playerMoving ? 1.35 : 1;
    const sneak = p.sneaking ? PLAYER.sneakVisibility : 1;
    g.suspicion = Math.min(100, g.suspicion + rate * moving * sneak * dt);
    if (g.suspicion >= 100 && g.mode !== GUARD_CHASE) {
      g.mode = GUARD_CHASE;
      g.chaseLeft = GUARD.chaseSeconds;
      state.alarm = Math.min(100, state.alarm + 12);
    }
  } else {
    g.suspicion = Math.max(0, g.suspicion - GUARD.suspicionDecay * dt);
  }

  if (g.mode === GUARD_CHASE) {
    g.chaseLeft -= dt;
    moveToward(g, p.x, p.y, GUARD.chaseSpeed, dt, solids);
    if (Math.hypot(p.x - g.x, p.y - g.y) < GUARD.catchDistance && state.graceLeft <= 0) {
      return 'caught';
    }
    if (g.chaseLeft <= 0 && !sees) {
      g.mode = GUARD_SUSPICION;
      g.suspicion = 55;
    }
    return sees;
  }

  if (g.mode === GUARD_INVESTIGATE) {
    g.investigateLeft -= dt;
    const arrived = moveToward(g, g.targetX, g.targetY, GUARD.investigateSpeed, dt, solids);
    if (arrived || g.investigateLeft <= 0) {
      g.mode = GUARD_SUSPICION;
      g.suspicion = Math.max(g.suspicion, 30);
    }
    return sees;
  }

  // Patrol / suspicion: walk the waypoints, pausing briefly at each one.
  if (g.suspicion > 35 && g.mode === GUARD_PATROL) g.mode = GUARD_SUSPICION;
  if (g.mode === GUARD_SUSPICION && g.suspicion < 10) g.mode = GUARD_PATROL;
  if (g.pauseLeft > 0) {
    g.pauseLeft -= dt;
    // Look around while paused: sweep the cone slowly.
    g.dir += Math.sin(state.time * 1.7 + g.id * 2.1) * 0.9 * dt;
    return sees;
  }
  const [wx, wy] = g.waypoints[g.wp];
  const arrived = moveToward(g, wx, wy, GUARD.patrolSpeed, dt, solids);
  if (arrived) {
    g.wp = (g.wp + 1) % g.waypoints.length;
    g.pauseLeft = 0.7;
  }
  return sees;
}

/** Send a guard to investigate a noise (thrown coin, lockpick). */
export function sendInvestigate(g, x, y) {
  if (g.mode === GUARD_CHASE) return;
  g.mode = GUARD_INVESTIGATE;
  g.targetX = x;
  g.targetY = y;
  g.investigateLeft = GUARD.investigateSeconds;
  g.suspicion = Math.max(g.suspicion, 40);
}
