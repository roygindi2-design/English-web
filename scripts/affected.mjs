#!/usr/bin/env node
/**
 * ⛔ **WHAT WOULD BREAK IF I CHANGE THIS FILE** — reverse traversal of the dependency
 * map, so a tick can see its blast radius **before** it pushes, ⛔ not after the gate
 * goes red. ⟦NEW 14/09 · Roy's throughput review⟧
 *
 * 🔬 **WHY THIS IS TEN LINES AND ⛔ NOT A DEPENDENCY, AND IT WAS MEASURED.**
 * Roy asked whether `graphify` (PyPI: `graphifyy`, ⛔ **not** `graphify-ai`, which does
 * ⛔ not exist) should be adopted for exactly this. It was installed and run against a
 * copy of this repo on 14/09:
 *
 *   graphify affected "CardDeck" --depth 2   ⇒  384ms · 515 bytes · 5 files
 *   this script, over the map we already have ⇒   23ms · 130 bytes · **the same 5 files**
 *
 * ⇒ identical answer, ~17× faster, from a 42KB file that `npm run generate-map`
 * already produces and git already carries. What adopting it would have cost:
 * a **9.06MB** `graph.json` that ⛔ cannot be committed, **10.4s** on every rebuild
 * (measured three consecutive no-change runs — the cache ⛔ never engaged), a 216MB
 * Python venv in a Node repo, and a `query` command that answered «where is the
 * promotion brake enforced» with `lib/core/flashcard.ts` — ⛔ **wrong**, at 4,134
 * tokens. ⛔ The idea was right; the implementation was already in the building.
 *
 * ⛔ **AND THE MAP IS THE SOURCE OF TRUTH, ⛔ NEVER A SECOND COPY OF IT.** If the map
 * is stale this is stale — that is deliberate. ⇒ regenerate with `npm run generate-map`
 * (DEV's closing sequence already does, `T-306`) rather than teaching this file to
 * parse imports on its own, which is exactly how two answers start disagreeing.
 *
 * Usage:
 *   npm run affected -- components/CardDeck.tsx           # depth 2 (default)
 *   npm run affected -- lib/core/swipeGrade.ts --depth 3
 *   npm run affected -- components/Flashcard.tsx --json
 *
 * Exit codes: 0 = answered (⛔ including «nothing imports it» — that is an answer) ·
 * 1 = the target is ⛔ not in the map, or the map is missing/unreadable.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MAP_PATH =
  process.env.AFFECTED_MAP ??
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'architecture-map.json');

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const depthFlag = argv.indexOf('--depth');
const depth = depthFlag === -1 ? 2 : Number(argv[depthFlag + 1]);
// ⛔ **The depth VALUE is skipped by INDEX, ⛔ never by comparing to the value.** With no
// `--depth`, `indexOf` is -1 and `argv[-1 + 1]` is `argv[0]` — the target itself — so a
// value-based filter silently swallowed it and every bare call printed the usage banner.
// ⛔ Measured on the first run of this script, ⛔ not reasoned about afterwards.
const skip = depthFlag === -1 ? -1 : depthFlag + 1;
const target = argv.find((a, i) => !a.startsWith('--') && i !== skip);

if (target === undefined || !Number.isFinite(depth) || depth < 1) {
  console.error('שימוש: npm run affected -- <נתיב הקובץ> [--depth N] [--json]');
  console.error('דוגמה: npm run affected -- components/CardDeck.tsx --depth 3');
  process.exit(1);
}

if (!existsSync(MAP_PATH)) {
  console.error(`⛔ ${path.relative('.', MAP_PATH)} ⛔ אינו קיים — הרץ \`npm run generate-map\`.`);
  process.exit(1);
}

/** @type {Record<string, string[]>} */
let map;
try {
  map = JSON.parse(readFileSync(MAP_PATH, 'utf8'));
} catch (e) {
  console.error(`⛔ ${path.relative('.', MAP_PATH)} ⛔ אינו JSON תקין: ${e.message}`);
  process.exit(1);
}

/**
 * ⛔ **The reverse index is built per run, ⛔ never cached to disk.** The forward map is
 * 42KB and this takes ~20ms — a cached reverse copy would be a second artefact to keep
 * in sync with the first, which is the drift `T-235` removed in the first place.
 */
const reverse = new Map();
for (const [importer, imports] of Object.entries(map)) {
  for (const imported of imports) {
    if (!reverse.has(imported)) reverse.set(imported, []);
    reverse.get(imported).push(importer);
  }
}

// ⛔ «⛔ not in the map» and «⛔ nothing imports it» are DIFFERENT answers, and collapsing
// them is how a typo reads as «safe to change».
const known = Object.prototype.hasOwnProperty.call(map, target) || reverse.has(target);
if (!known) {
  console.error(`⛔ \`${target}\` ⛔ אינו במפה. ⛔ זה ⛔ אינו «אף אחד לא מייבא אותו» —`);
  console.error('   זה קובץ שהמפה ⛔ אינה מכירה: בדוק את הנתיב, או הרץ `npm run generate-map`.');
  process.exit(1);
}

/** Reverse BFS, recording the hop at which each file was first reached. */
const seen = new Map();
let frontier = [target];
for (let hop = 1; hop <= depth && frontier.length > 0; hop += 1) {
  const next = [];
  for (const node of frontier) {
    for (const importer of reverse.get(node) ?? []) {
      if (seen.has(importer) || importer === target) continue;
      seen.set(importer, hop);
      next.push(importer);
    }
  }
  frontier = next;
}

const rows = [...seen.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));

if (asJson) {
  console.log(JSON.stringify({ target, depth, affected: rows.map(([file, hop]) => ({ file, hop })) }, null, 1));
  process.exit(0);
}

if (rows.length === 0) {
  console.log(`✓ \`${target}\` — ⛔ אף קובץ ⛔ אינו מייבא אותו (עומק ${depth}).`);
  console.log('⚠️ ⛔ ואין לקרוא את זה כ«בטוח לשנות»: המפה מודדת **ייבוא**, ⛔ ולא התנהגות.');
  process.exit(0);
}

console.log(`⚠️ שינוי ב-\`${target}\` עלול להשפיע על ${rows.length} קבצים (עומק ${depth}):`);
let shown = 0;
for (const [file, hop] of rows) {
  console.log(`  ${hop === 1 ? '→' : ' '.repeat(hop - 1) + '↳'} ${file}${hop > 1 ? `  ⟨${hop} קפיצות⟩` : ''}`);
  shown += 1;
}
console.log(
  `⛔ ובדיקות: ${rows.filter(([f]) => /\.test\.tsx?$/.test(f)).length} מתוך ${shown} הם קובצי בדיקה.`,
);
