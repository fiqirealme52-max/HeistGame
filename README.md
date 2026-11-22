[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/fiqirealme52-max/HeistGame/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/fiqirealme52-max/HeistGame/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# GILDED HOUR: one thief, one mask, one dawn — 3 wings, 12 guards, 8 cameras, 3 tools

A top-down stealth heist game for the [make.fun "Make the best heist game" bounty](https://make.fun/bounty/best-heist-game-20261122-0559). One night in the Halcyon Museum: steal the **Aurum Mask** from the Vault and reach the skylight before dawn breaks.

## The hook — dawn is a resource

The dawn timer is not just a countdown. Every second you save is **+10 score** — and a high alarm **FREEZES the dawn** (alarm ≥ 70, a chase, or a lockdown stops the clock). Being seen costs you time as well as safety. The HUD always shows the dawn bar, the dawn score rule, and the Ghost indicator, so the tradeoff is visible in every frame.

## How to play

- **WASD / arrows** — move. **Shift** — sneak (slower, harder to see).
- **Click** — throw a distraction coin; nearby guards investigate the sound.
- **1 / 2 / 3** — buy and use a tool with loot coins (price leaves your purse):
  - **Smoke Pellet (20)** — 4 s of cover, but it blinds you too: you cannot see the cones inside the smoke.
  - **EMP Burst (25)** — cameras dead for 6 s, but the buzz raises the alarm +5.
  - **Lockpick (15)** — opens a locked case instantly, but the click draws the nearest guard to you.
- **Stand still next to a locked case** for 3 s to pick it by hand, grab the target, then reach the exit. Three chances: getting caught costs one and respawns you at the wing entrance with the alarm halved and 3 s of grace — never an instant fail.

## The three wings

| Wing | Guards | Cameras | Target | Two routes |
|---|---|---|---|---|
| 1 · Atrium | 2 | 1 | Side artefact (30) | Main hall past the big display, or the quiet side corridor |
| 2 · Galeri | 4 | 3 | Side artefact (30) | Grand hall, or the service corridor + vent gap |
| 3 · Vault | 6 | 4 | **Aurum Mask (100)** behind a laser grid | Main aisle, or the vent slit behind the cases |

Loot: coin 5, gem 15, side artefact 30. A wing's side loot is worth roughly one tool, so every tool is a real decision. Every wing is solvable without any tool by reading the cones. Score = loot + dawn seconds left × 10 + **Ghost bonus 200** if you were never seen.

## Screenshots (deterministic)

Run `node serve.ts`, then open `http://localhost:8080/?shot=cover&seed=7` (and `routes`, `caught`, `getaway` with seeds 11, 13, 17). The same seed always renders the same frame — verified byte-identical across runs.

1. `1-cover.png` — Vault climax: the thief mid-room, the Aurum Mask, laser grid, alarm 70%, dawn 0:55.
2. `2-routes.png` — Galeri service corridor: smoke out, coin mid-flight, a guard turning to the sound.
3. `3-caught.png` — Spotted: a guard's cone dead on the thief, alarm 88%, grace window shown.
4. `4-getaway.png` — The skylight: thief holding the Mask under the dawn beam, Ghost intact.

## Structure

```
game/
  index.html            # canvas + HUD, loads src/main.js
  src/
    main.js             # boot + fixed-step loop + screen machine + ?shot=
    config.js           # every tuning constant (speeds, cones, prices, alarm)
    input.js            # keyboard + mouse (click throws a coin)
    random.js           # seeded RNG — determinism
    levels.js           # the 3 wings: walls, cases, routes, loot, lasers
    guards.js           # patrol + vision cone + suspicion + chase + investigate
    cameras.js          # sweeping green cones
    alarm.js            # alarm meter, lockdown, dawn-freeze rule
    tools.js            # smoke / EMP / lockpick + the coin economy
    loot.js             # targets + side loot + score + Ghost bonus
    game-state.js       # title/playing/paused/caught/escaped/over + dawn clock
    render.js           # canvas: marble floor, cases, cones, HUD, screens
    deterministic-shots.js  # stageShot: real, reachable game states per shot
main.ts                 # copies game/ + screenshots/ to /output, writes dossier.json
serve.ts                # local static server (node serve.ts → :8080)
```

No libraries, no network, no audio — pure canvas, Node 22 stdlib only.

## Run it

```sh
node serve.ts            # http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
