[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/iwandarmawan/lumen-drift/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/iwandarmawan/lumen-drift/reward.svg)](https://make.fun/bounty/best-game-01)

# Lumen Drift

An original arcade game for [make.fun](https://make.fun/bounty/best-game-01)'s **best-game-01** bounty ($1,000, top 10 share it).

You are **Luma**, a lantern moth drifting through a dark grove. Gather the
glowing embers, dodge the thorn-shards, and dash through a shard to shatter
it — dashing takes a moment to recharge. Collect **90 embers** to light the
whole grove and win; lose all 3 lives and the light fades.

## How to play

- **Move:** WASD / arrow keys, or hold the mouse button to steer toward the cursor
- **Dash:** Space or click — brief invulnerability, shatters any shard in your path
- **Pause:** P • **Mute:** M • **Restart:** R • **Start:** Enter or click
- **Score:** embers are worth 10 × your combo (up to ×5 for quick streaks);
  shattering a shard is worth 25. Each 15 embers raises the level, and the
  grove gets faster and darker. Every 30 embers restores one life.

## What is in this repo

- `game/` — the whole game as static files: `index.html` plus ES modules
  under `game/src/` (config, seeded RNG, WebAudio synth sounds, keyboard +
  mouse input, the simulation, the renderer, the layered parallax grove
  scenery, deterministic screenshot scenes, and the main loop). No
  libraries, no build step, no network requests — open `game/index.html`
  from any static server and play. The grove itself is drawn in code: a
  cratered moon, three parallax tree lines, drifting mist, fireflies,
  glowing mushrooms and grass, all from the run's seed.
- `screenshots/` — 4 real renders of the game's own code: title, gameplay,
  level-up, and the victory screen (the first by name is the cover).
- `main.ts` — the entry program (Node 22, standard library only): copies
  `game/` and `screenshots/` to `/output` and writes `dossier.json` with
  the kit's `vendor/makefun-game.ts`.
- `serve.ts` — a tiny local static server (`node serve.ts`, then
  http://localhost:8080) for play-testing.

## Play locally

```sh
node serve.ts
# open http://localhost:8080 in desktop Chrome
```

Or build the submission output:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
