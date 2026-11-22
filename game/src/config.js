// GILDED HOUR — all tuning constants in one place.
// The museum heist: one thief, one mask, one dawn. Dawn is a resource:
// every second saved is score, and a high alarm FREEZES the dawn.
export const VIEW = { width: 1280, height: 720 };
export const HUD_HEIGHT = 104;
export const STEP = 1 / 60;

// Player
export const PLAYER = {
  radius: 13,
  speed: 178,
  sneakSpeed: 96,
  // How much smaller the thief looks to a guard while sneaking.
  sneakVisibility: 0.55,
};

// Guards — patrol, suspicion, chase.
export const GUARD = {
  radius: 14,
  patrolSpeed: 74,
  chaseSpeed: 152,
  investigateSpeed: 110,
  coneRange: 232,
  coneHalfAngle: 0.96, // ~55 degrees each side
  // Suspicion gained per second inside a cone (close / mid / far).
  suspicionClose: 58,
  suspicionMid: 32,
  suspicionFar: 19,
  suspicionDecay: 26,
  chaseSeconds: 5,
  catchDistance: 27,
  investigateSeconds: 4,
};

// Cameras — sweeping green cones.
export const CAMERA = {
  range: 272,
  coneHalfAngle: 0.61, // ~35 degrees each side
  sweepAmplitude: 0.96, // radians either side of the base angle
  sweepSpeed: 0.55, // radians per second
  alarmPerSecond: 14,
};

// Alarm meter 0-100. Lockdown at 100 is a setback, not instant failure.
export const ALARM = {
  max: 100,
  decayPerSecond: 3.5,
  chasePerSecond: 9,
  lockdownSeconds: 8,
  afterLockdown: 55,
  // Dawn freezes while the alarm is at or above this level.
  dawnFreezeAt: 70,
  empNoise: 5,
  laserHit: 20,
};

// Dawn — the whole run's clock. Score = seconds left x 10 at escape.
export const DAWN = { totalSeconds: 360, scorePerSecond: 10 };

// Tools at a cost. Press 1/2/3 to buy AND use (price comes out of loot coins).
// Every tool has a real tradeoff, not just a benefit.
export const TOOLS = {
  smoke: { key: '1', name: 'SMOKE', price: 20, seconds: 4, radius: 96 },
  emp: { key: '2', name: 'EMP', price: 25, seconds: 6 },
  lockpick: { key: '3', name: 'LOCKPICK', price: 15, radius: 78 },
};

// Loot values. A wing's side loot is worth roughly one tool.
export const LOOT = { coin: 5, gem: 15, artefact: 30, mask: 100 };

// Three fair chances. Caught = lose one, respawn at the wing entrance.
export const CHANCES = 3;
export const GRACE_SECONDS = 3;
export const GHOST_BONUS = 200;

// Deterministic shots use these fixed seeds.
export const SHOT_SEEDS = { cover: 7, routes: 11, caught: 13, getaway: 17 };
