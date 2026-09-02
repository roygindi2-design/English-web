#!/usr/bin/env node
/**
 * THE TEXT-FLOOR GATE — deterministic, zero tokens, runs inside `npm run verify`.
 *
 * WHY IT EXISTS (`plan/35-design-constitution.md § א9`, D-161, Roy's decision 31/08).
 * `docs/design/render_video_B.py:175` drew an equipment-slot label at **9px** in a
 * 375×812 space — 25% below the smallest step the product actually uses (`text-xs`,
 * 12px). § א9 sets a hard, system-wide floor: **no text under 12px, anywhere, ever,
 * including in the arena.** `T-236` is that floor's enforcement — a gate, not a
 * sentence someone has to remember.
 *
 * TWO RULES, EXACTLY AS § א9 SPECIFIES:
 *   ⓐ a Tailwind arbitrary-value class `text-[<n>px]` where `n < 12`, anywhere in
 *     `app/**` or `components/**` (`.tsx`/`.jsx`, source only — `.test.` files are
 *     fixtures, not shipped UI, exactly like the motion gate excludes them);
 *   ⓑ a `font-size` declaration below `12px`/`0.75rem` in `app/globals.css` or
 *     `app/arcade/arcade-tokens.css` — the two sheets § א9 names by name.
 *
 * FROZEN BASELINE — same shape as `scripts/motion-baseline.md` / `check-motion.mjs`,
 * ⛔ deliberately NOT a `SOFT_UNTIL` date window: `D-177` (Roy, 02/09/2026, `F-180`)
 * banned that whole mechanism class outright — "no extending the date, and no new
 * date flag in its place" — after a soft-window's expiry date silently reddened
 * `npm run verify` for every agent with no code change at all. A frozen baseline file
 * doesn't expire; it only shrinks, one row at a time, when the row's own finding
 * closes. Today's known violations are listed in `scripts/text-floor-baseline.md`.
 * From this commit on, any NEW violation fails the build.
 *
 * Usage: node scripts/check-text-floor.mjs [root]      (root defaults to the cwd)
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** ⛔ The one sentence the baseline file may never lose. Enforced below and in the test. */
export const BASELINE_HEADER_RULE =
  '🔴 הוספת שורה לקובץ הזה היא פעולה של PM או של רוי, ⛔ לעולם לא של DEV.';

export const BASELINE_PATH = 'scripts/text-floor-baseline.md';

/** The two sheets § א9 names by name for rule ⓑ. */
const CSS_FLOOR_FILES = new Set(['app/globals.css', 'app/arcade/arcade-tokens.css']);

const FLOOR_PX = 12;

const SCAN_DIRS = ['app', 'components'];

/** Blanks out /* … *\/ comments, keeping newlines so line numbers survive. */
function stripBlockComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/** CSS has only block comments. */
export function cssCode(src) {
  return stripBlockComments(src);
}

/** TS/TSX: block comments, `//` line comments, and `{/* … *\/}` JSX comments. */
export function tsxCode(src) {
  return stripBlockComments(src)
    .split('\n')
    .map((line) => line.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'))
    .join('\n');
}

const lineOf = (src, index) => src.slice(0, index).split('\n').length;

// ─────────────────────────────────────────────────────────────────────────────
// rule ⓐ — Tailwind arbitrary-value classes in TSX/JSX
// ─────────────────────────────────────────────────────────────────────────────

const TEXT_ARBITRARY_PX = /text-\[(\d+(?:\.\d+)?)px\]/g;

export function violationsInTsx(file, source) {
  const src = tsxCode(source);
  const out = [];
  for (const m of src.matchAll(TEXT_ARBITRARY_PX)) {
    const n = Number(m[1]);
    if (n < FLOOR_PX) {
      out.push({
        file,
        rule: 'A',
        key: `text-[${m[1]}px]`,
        line: lineOf(src, m.index),
        detail: `text-[${m[1]}px] is below the 12px floor (constitution § א9)`,
      });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// rule ⓑ — raw `font-size` in the two named sheets
// ─────────────────────────────────────────────────────────────────────────────

const FONT_SIZE_DECL = /font-size\s*:\s*([\d.]+)(px|rem)\s*[;}]/g;

export function violationsInCss(file, source) {
  if (!CSS_FLOOR_FILES.has(file)) return [];
  const src = cssCode(source);
  const out = [];
  for (const m of src.matchAll(FONT_SIZE_DECL)) {
    const value = Number(m[1]);
    const unit = m[2];
    const px = unit === 'rem' ? value * 16 : value;
    if (px < FLOOR_PX) {
      out.push({
        file,
        rule: 'B',
        key: `font-size:${m[1]}${unit}`,
        line: lineOf(src, m.index),
        detail: `font-size: ${m[1]}${unit} (${px}px) is below the 12px floor (constitution § א9)`,
      });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// scan + baseline
// ─────────────────────────────────────────────────────────────────────────────

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

export function scanRepo(root = '.') {
  const files = [];
  for (const dir of SCAN_DIRS) {
    const abs = join(root, dir);
    if (existsSync(abs)) files.push(...walk(abs));
  }
  const out = [];
  for (const abs of files.sort()) {
    const rel = relative(root, abs).split(sep).join('/');
    if (/\.test\./.test(rel)) continue;
    if (rel.endsWith('.css')) out.push(...violationsInCss(rel, readFileSync(abs, 'utf8')));
    else if (/\.(tsx|jsx)$/.test(rel)) out.push(...violationsInTsx(rel, readFileSync(abs, 'utf8')));
  }
  return out;
}

/** `- <file> · <rule> · <key> · <finding> · <task>` */
export function parseBaseline(text) {
  return text
    .split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => {
      const [file, rule, key, finding, task] = l.slice(2).split(' · ').map((s) => s.trim());
      return { file, rule, key, finding, task, id: `${file} · ${rule} · ${key}` };
    });
}

const idOf = (v) => `${v.file} · ${v.rule} · ${v.key}`;

function main() {
  const root = process.argv[2] ?? '.';
  const baselineFile = join(root, BASELINE_PATH);

  if (!existsSync(baselineFile)) {
    console.error(`text-floor gate: baseline file missing at ${BASELINE_PATH}`);
    process.exit(1);
  }
  const raw = readFileSync(baselineFile, 'utf8');
  if (!raw.includes(BASELINE_HEADER_RULE)) {
    console.error(
      'text-floor gate: the baseline header sentence is missing — the gate refuses to run.\n' +
        `  restore this line verbatim at the top of ${BASELINE_PATH}:\n  ${BASELINE_HEADER_RULE}`,
    );
    process.exit(1);
  }

  const baseline = parseBaseline(raw);
  const known = new Set(baseline.map((b) => b.id));
  const found = scanRepo(root);
  const seen = new Set(found.map(idOf));

  const added = found.filter((v) => !known.has(idOf(v)));
  const stale = baseline.filter((b) => !seen.has(b.id));

  if (added.length) {
    console.error('\ntext-floor gate: NEW sub-12px text (constitution § א9 · D-161):');
    for (const v of added) console.error(`  ${v.file}:${v.line} — [rule ${v.rule}] ${v.detail}`);
    console.error(
      '\n  ⛔ No text under 12px anywhere in the product, including the arena.\n' +
        `  ⛔ Adding a line to ${BASELINE_PATH} is a PM or Roy action, ⛔ never DEV's.\n`,
    );
  }
  if (stale.length) {
    console.error('\ntext-floor gate: baseline rows that match nothing any more — DELETE them:');
    for (const b of stale) console.error(`  ${b.id}  (${b.finding} · ${b.task})`);
    console.error('');
  }
  if (added.length || stale.length) process.exit(1);

  console.log(`text-floor gate: OK — ${found.length} known violation(s) held at the baseline, 0 new.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
