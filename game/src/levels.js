// The three wings of the Halcyon Museum. Every wing has TWO real routes
// (main hall vs side corridor / service corridor vs vent gap), is solvable
// WITHOUT any tool by a player who reads the cones, and holds exactly the
// guards and cameras the title claims: 2+4+6 = 12 guards, 1+3+4 = 8 cameras.
import { VIEW, HUD_HEIGHT } from './config.js';

export const FLOOR = { x: 48, y: HUD_HEIGHT + 12, w: VIEW.width - 96, h: VIEW.height - HUD_HEIGHT - 36 };

// Border walls around the playfield.
function borderWalls() {
  const { x, y, w, h } = FLOOR;
  const t = 16;
  return [
    { x: x - t, y: y - t, w: w + 2 * t, h: t },
    { x: x - t, y: y + h, w: w + 2 * t, h: t },
    { x: x - t, y: y - t, w: t, h: h + 2 * t },
    { x: x + w, y: y - t, w: t, h: h + 2 * t },
  ];
}

// --- Wing 1: ATRIUM (tutorial) — 2 guards, 1 camera -----------------------
const ATRIUM = {
  name: 'WING 1 · ATRIUM',
  routes: 'Main hall past the big display, or the quiet side corridor left',
  spawn: { x: 96, y: 640 },
  exit: { x: 1184, y: 640, label: 'TO GALLERY' },
  target: { x: 1140, y: 168, kind: 'artefact', locked: true },
  walls: [...borderWalls(), { x: 430, y: 480, w: 190, h: 18 }],
  cases: [
    { x: 560, y: 300, w: 160, h: 120 }, // big central display — splits the room
    { x: 300, y: 180, w: 120, h: 70 },
    { x: 880, y: 420, w: 140, h: 80 },
  ],
  loot: [
    { x: 200, y: 300, kind: 'coin' },
    { x: 320, y: 620, kind: 'coin' },
    { x: 700, y: 620, kind: 'coin' },
    { x: 1000, y: 300, kind: 'coin' },
    { x: 1150, y: 450, kind: 'coin' },
    { x: 500, y: 180, kind: 'coin' },
  ],
  guards: [
    { waypoints: [[400, 300], [400, 600], [900, 600], [900, 300]] },
    { waypoints: [[1050, 250], [1050, 550]] },
  ],
  cameras: [{ x: 640, y: 128, base: Math.PI / 2 }],
  lasers: [],
};

// --- Wing 2: GALERI (Gallery) — 4 guards, 3 cameras -----------------------
const GALERI = {
  name: 'WING 2 · GALERI',
  routes: 'Grand hall through the paintings, or the service corridor + vent gap up top',
  spawn: { x: 96, y: 640 },
  exit: { x: 1184, y: 640, label: 'TO VAULT' },
  target: { x: 1140, y: 168, kind: 'artefact', locked: true },
  walls: [
    ...borderWalls(),
    { x: 300, y: 236, w: 280, h: 16 }, // service-corridor wall, gap in the middle
    { x: 700, y: 236, w: 280, h: 16 }, // ...and a vent gap at x 580-700
  ],
  cases: [
    { x: 400, y: 330, w: 180, h: 90 },
    { x: 700, y: 470, w: 180, h: 90 },
    { x: 220, y: 420, w: 110, h: 70 },
    { x: 980, y: 330, w: 110, h: 70 },
  ],
  loot: [
    { x: 180, y: 180, kind: 'coin' },
    { x: 640, y: 180, kind: 'coin' },
    { x: 1080, y: 180, kind: 'coin' },
    { x: 320, y: 600, kind: 'coin' },
    { x: 700, y: 300, kind: 'coin' },
    { x: 1000, y: 600, kind: 'coin' },
    { x: 480, y: 520, kind: 'gem' },
    { x: 900, y: 180, kind: 'gem' },
  ],
  guards: [
    { waypoints: [[300, 300], [300, 600], [600, 600], [600, 300]] },
    { waypoints: [[900, 300], [900, 600]] },
    { waypoints: [[200, 180], [1100, 180]] }, // service-corridor patrol
    { waypoints: [[640, 420], [640, 620], [1080, 620], [1080, 420]] },
  ],
  cameras: [
    { x: 640, y: 128, base: Math.PI / 2 },
    { x: 200, y: 128, base: Math.PI / 2.6 },
    { x: 1080, y: 128, base: Math.PI / 1.6 },
  ],
  lasers: [],
};

// --- Wing 3: VAULT — 6 guards, 4 cameras, laser grid ----------------------
const VAULT = {
  name: 'WING 3 · VAULT',
  routes: 'Main aisle straight at the Mask, or the vent slit behind the cases right',
  spawn: { x: 640, y: 640 },
  exit: { x: 1150, y: 152, label: 'SKYLIGHT' },
  target: { x: 640, y: 208, kind: 'mask', locked: true },
  walls: [...borderWalls()],
  cases: [
    { x: 300, y: 300, w: 130, h: 90 },
    { x: 850, y: 300, w: 130, h: 90 },
    { x: 300, y: 470, w: 130, h: 90 },
    { x: 850, y: 470, w: 130, h: 90 },
  ],
  loot: [
    { x: 200, y: 200, kind: 'coin' },
    { x: 1080, y: 200, kind: 'coin' },
    { x: 200, y: 560, kind: 'coin' },
    { x: 1080, y: 560, kind: 'coin' },
    { x: 640, y: 520, kind: 'coin' },
    { x: 920, y: 620, kind: 'gem' },
  ],
  guards: [
    { waypoints: [[300, 180], [300, 620]] },
    { waypoints: [[980, 180], [980, 620]] },
    // Horizontal sweep BELOW the laser grid — its cone faces sideways, so the
    // Mask case stays a safe pocket a patient thief can channel in.
    { waypoints: [[420, 300], [860, 300]] },
    { waypoints: [[420, 560], [860, 560]] },
    // Vertical patrol offset from the Mask's axis (x 760, not 640).
    { waypoints: [[760, 420], [760, 620]] },
    { waypoints: [[180, 420], [1100, 420]] },
  ],
  cameras: [
    { x: 120, y: 128, base: Math.PI / 2.4 },
    { x: 1160, y: 128, base: Math.PI / 1.6 },
    { x: 120, y: 640, base: -Math.PI / 2.4 },
    { x: 1160, y: 640, base: -Math.PI / 1.6 },
  ],
  // Laser beams guarding the Mask: each beam has a gap to weave through.
  // { y, segments: [[x1,x2], ...] } — touching a lit segment trips the alarm.
  lasers: [
    { y: 300, segments: [[480, 620], [700, 800]] },
    { y: 344, segments: [[480, 560], [640, 800]] },
    { y: 388, segments: [[480, 660], [740, 800]] },
  ],
};

export const LEVELS = [ATRIUM, GALERI, VAULT];
export const TOTAL_GUARDS = LEVELS.reduce((n, l) => n + l.guards.length, 0); // 12
export const TOTAL_CAMERAS = LEVELS.reduce((n, l) => n + l.cameras.length, 0); // 8

// --- Geometry helpers ------------------------------------------------------
export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/** All solid rectangles in a wing: walls + display cases. */
export function solidsOf(level) {
  return [...level.walls, ...level.cases];
}

/** Push a circle (x, y, radius) out of every solid rect. Returns corrected [x, y]. */
export function resolveCircle(x, y, radius, solids) {
  for (const r of solids) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      if (d2 === 0) {
        // Centre inside the rect: push out along the smallest penetration.
        const left = x - r.x;
        const right = r.x + r.w - x;
        const top = y - r.y;
        const bottom = r.y + r.h - y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) x = r.x - radius;
        else if (m === right) x = r.x + r.w + radius;
        else if (m === top) y = r.y - radius;
        else y = r.y + r.h + radius;
      } else {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * radius;
        y = cy + (dy / d) * radius;
      }
    }
  }
  return [x, y];
}

/** True when the segment (x1,y1)-(x2,y2) is blocked by any solid (sampled). */
export function losBlocked(x1, y1, x2, y2, solids) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    for (const r of solids) {
      if (pointInRect(px, py, r)) return true;
    }
  }
  return false;
}

/** True when (x, y) is inside any solid rect. */
export function insideSolid(x, y, solids) {
  for (const r of solids) {
    if (pointInRect(x, y, r)) return true;
  }
  return false;
}
