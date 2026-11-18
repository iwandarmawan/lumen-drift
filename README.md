# Lumen Drift

[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/iwandarmawan/lumen-drift/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/iwandarmawan/lumen-drift/reward.svg)](https://make.fun/bounty/best-game-01)

A lantern moth arcade game for the [make.fun best game bounty](https://make.fun/bounty/best-game-01).

## The game

You are a lantern moth drifting through six night gardens. Gather **90 embers**
— fifteen in each garden — to reach the Dawn Summit and win. You have **3 lives**.

- **Fly** with WASD or the arrow keys. The moth steers with acceleration and drag,
  so it feels weighty but answers at once.
- **Dash** with Shift, Space, or a click: a short burst with a moment of
  invulnerability, then a cooldown shown on the HUD.
- **Chain embers** to raise your combo multiplier (up to x5). A hit resets it.
- **Dodge** the wisps, which drift toward your light, and the spores swaying
  on their sine paths. A touch costs a life.
- Later gardens add wind, faster wisps, and tighter ember spreads.

## Playing it

Open `game/index.html` in desktop Chrome (or serve `game/` with any static
server). No network request is made; every sound is synthesised in the browser.

- **Enter / click** to start, advance, and restart.
- **P** or **Esc** pauses. **M** mutes. **R** restarts after a win or a loss.

## Handing it in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to `/output` — or to `$MAKEFUN_OUTPUT_DIR` outside the grader — and writes
`/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/index.html` — the page and canvas.
- `game/src/config.js` — tuning and the six level definitions.
- `game/src/audio.js` — synthesised sounds (WebAudio, no files).
- `game/src/world.js` — seeded level layouts: embers, wisps, spores, stars.
- `game/src/moth.js` — the moth: flight, dash, and hits.
- `game/src/hazards.js` — hazard movement, collisions, and particles.
- `game/src/render.js` — all drawing: sky, moth, HUD, and screens.
- `game/src/main.js` — the loop, states, scoring, and input.
- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes
  `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.
- `screenshots/` — four real renders of the game: title, play, level clear, win.

## License

MIT — see [LICENSE](LICENSE).
