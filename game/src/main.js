// GILDED HOUR — boot + fixed-step loop + screen machine + ?shot= handling.
//
// Play: open game/index.html (or `node serve.ts` → http://localhost:8080).
// ?seed=N fixes the RNG. ?shot=cover|routes|caught|getaway&seed=N stages that
// scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot — the frame is a real game state.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createGame,
  startGame,
  resetGame,
  stepGame,
  resumeAfterCaught,
  throwCoin,
  SCREEN_TITLE,
  SCREEN_PLAY,
  SCREEN_PAUSED,
  SCREEN_CAUGHT,
  SCREEN_ESCAPED,
  SCREEN_OVER,
} from './game-state.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './deterministic-shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = createGame(seed);
const renderer = createRenderer(canvas);
// Debug/test hook: lets a playtest read live state (wing, alarm, chances).
window.__game = game;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem('gilded-hour-best') ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem('gilded-hour-best', String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function runShot(name) {
  stageShot(name, game);
  let painted = 0;
  function paint() {
    renderer.draw(game, SCREEN_PLAY, 0);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, game);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function begin() {
    resetGame(game);
    startGame(game);
    screen = SCREEN_PLAY;
    announce('Playing. Three chances. Steal the artefact, then reach the exit.');
  }

  function handleActions() {
    const actions = input.takeActions();
    const click = input.takeClick();
    if (screen === SCREEN_TITLE && (actions & ACTION_CONFIRM)) begin();
    else if (screen === SCREEN_OVER && (actions & ACTION_CONFIRM)) begin();
    else if (screen === SCREEN_ESCAPED && (actions & ACTION_CONFIRM)) begin();
    else if (screen === SCREEN_CAUGHT && (actions & ACTION_CONFIRM)) {
      resumeAfterCaught(game);
      screen = SCREEN_PLAY;
    } else if (screen === SCREEN_PLAY && (actions & ACTION_PAUSE)) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (screen === SCREEN_PAUSED && (actions & (ACTION_PAUSE | ACTION_CONFIRM))) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    // A click during play throws a distraction coin at that spot.
    if (screen === SCREEN_PLAY && click) throwCoin(game, click.x, click.y);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY || screen === SCREEN_CAUGHT) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        const event = stepGame(game, input.direction(), STEP);
        if (event === 'escaped') {
          screen = SCREEN_ESCAPED;
          const total = game.score + Math.ceil(game.dawnLeft) * 10 + (game.seen ? 0 : 200);
          if (total > best) {
            best = total;
            saveBest(best);
          }
          announce(`Clean getaway. Score ${total}. Best ${best}.`);
        } else if (event === 'over' || event === 'dawn') {
          screen = SCREEN_OVER;
          announce(`The heist fails. ${game.message}`);
        } else if (event === 'caught') {
          screen = SCREEN_CAUGHT;
          announce(game.message);
        }
        accumulator -= STEP;
      }
      if (screen === SCREEN_CAUGHT) accumulator = 0;
    } else {
      accumulator = 0;
    }
    game.screen = screen;
    renderer.draw(game, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gilded Hour. Press Space or click to begin the heist.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
