// Alarm meter 0-100 + lockdown + the dawn-freeze rule.
// The alarm is a setback, never an instant fail: at 100 the museum locks
// down for a few seconds (doors shut, guards converge), then it eases off.
import { ALARM } from './config.js';
import { GUARD_CHASE, GUARD_INVESTIGATE } from './guards.js';

/**
 * Advance the alarm one fixed step.
 * `seen` — a guard or camera currently sees the thief.
 * `chasing` — any guard is in chase mode.
 */
export function stepAlarm(state, dt, seen, chasing) {
  if (state.lockdownLeft > 0) {
    state.lockdownLeft -= dt;
    if (state.lockdownLeft <= 0) {
      state.alarm = ALARM.afterLockdown;
      state.message = 'LOCKDOWN LIFTED — move, quietly.';
      state.messageLeft = 3;
    }
    return;
  }
  if (seen) state.alarm = Math.min(ALARM.max, state.alarm + (chasing ? ALARM.chasePerSecond : 6) * dt);
  else if (!chasing) state.alarm = Math.max(0, state.alarm - ALARM.decayPerSecond * dt);

  if (state.alarm >= ALARM.max) {
    state.alarm = ALARM.max;
    state.lockdownLeft = ALARM.lockdownSeconds;
    state.message = 'LOCKDOWN! Doors sealed — guards converge!';
    state.messageLeft = 3;
    // Every guard converges on the thief's position.
    for (const g of state.guards) {
      if (g.mode !== GUARD_CHASE) {
        g.mode = GUARD_INVESTIGATE;
        g.targetX = state.player.x;
        g.targetY = state.player.y;
        g.investigateLeft = ALARM.lockdownSeconds;
      }
    }
  }
}

/** True while the dawn timer is frozen (alarm too high or a chase is on). */
export function dawnFrozen(state, chasing) {
  return state.alarm >= ALARM.dawnFreezeAt || chasing || state.lockdownLeft > 0;
}
