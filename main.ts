// Lumen Drift — the entry program.
// Copies game/ and screenshots/ into the output directory and writes
// /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function repoRoot() {
  return dirname(fileURLToPath(import.meta.url));
}

function outputDir() {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return '/output';
}

function copyTree(src, dest) {
  if (!existsSync(src)) {
    throw new Error(`missing input directory: ${src}`);
  }
  cpSync(src, dest, { recursive: true, dereference: false });
}

function main() {
  const root = repoRoot();
  const out = outputDir();
  mkdirSync(out, { recursive: true });

  // Start clean so a stale file from an earlier run can never leak in.
  for (const name of ['game', 'screenshots', 'dossier.json']) {
    const target = join(out, name);
    if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  }

  copyTree(join(root, 'game'), join(out, 'game'));
  copyTree(join(root, 'screenshots'), join(out, 'screenshots'));
  const gameFiles = readdirSync(join(out, 'game'), { recursive: true }).length;
  const shotFiles = readdirSync(join(out, 'screenshots')).length;
  console.log(`copied ${gameFiles} game entries and ${shotFiles} screenshots to ${out}`);

  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(out, 'dossier.json'), dossier);
  console.log(`wrote ${join(out, 'dossier.json')} (${dossier.length} bytes)`);
}

main();
