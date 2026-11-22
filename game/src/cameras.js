// Cameras: fixed mounts sweeping a green cone on a fixed pattern.
// Seen by a camera raises the alarm; an EMP burst switches them off.
import { CAMERA } from './config.js';
import { canSee } from './guards.js';

/** Build the camera objects for a wing definition. */
export function createCameras(level) {
  return level.cameras.map((c, i) => ({
    id: i,
    x: c.x,
    y: c.y,
    base: c.base,
    angle: c.base,
    phase: i * 1.3,
  }));
}

/**
 * Advance one camera one fixed step. Returns true when it currently
 * sees the thief (drives the alarm + the Ghost flag).
 */
export function stepCamera(cam, state, dt, solids) {
  if (state.empLeft > 0) {
    cam.angle = cam.base; // frozen while EMP'd
    return false;
  }
  cam.angle = cam.base + Math.sin(state.time * CAMERA.sweepSpeed + cam.phase) * CAMERA.sweepAmplitude;
  if (state.graceLeft > 0) return false;
  return canSee(cam.x, cam.y, cam.angle, CAMERA.range, CAMERA.coneHalfAngle, state, solids);
}
