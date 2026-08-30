#!/usr/bin/env node
/**
 * THE MOTION GATE — deterministic, zero tokens, runs inside `npm run verify`.
 *
 * WHY IT EXISTS (C-0372, Roy's manual instruction, 30/08). A manual PM run on 30/08
 * loaded the `apple-design` skill and found four real performance defects (T-230…T-233).
 * A `grep` over plan/35-design-constitution.md for `transform|opacity|compositor|
 * box-shadow` returned ZERO hits in that same tick: the constitution never covered this
 * slot, and its § ב6 regulates DURATION only. A skill catches a violation only when a
 * model happens to load it and happens to read the right file; a gate catches it on
 * every tick, forever, for free. Hence a gate, ⛔ not a skill and ⛔ not an agent rule.
 *
 * TWO RULES, AND DELIBERATELY ⛔ NOT A THIRD:
 *   ⓐ an `@keyframes` block or a `transition:` declaration that touches a property that
 *     is neither `transform` nor `opacity` (i.e. a property the compositor cannot run,
 *     so the browser lays out or paints on every frame);
 *   ⓑ an inline percentage width — `style={{ width: `${x}%` }}` — inside a component
 *     that runs a `requestAnimationFrame` loop, which is layout + paint per frame.
 *
 * FROZEN BASELINE. Everything the repo violates TODAY is listed in
 * scripts/motion-baseline.md, each row citing the finding and the task that will close
 * it. From this commit on, any NEW violation fails the build. The baseline goes DOWN
 * when a finding closes; it ⛔ never goes up on DEV's initiative — see the header
 * sentence inside the baseline file, which this script refuses to run without.
 *
 * Usage: node scripts/check-motion.mjs [root]      (root defaults to the cwd)
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** ⛔ The one sentence the baseline file may never lose. Enforced below and in the test. */
export const BASELINE_HEADER_RULE =
  '🔴 הוספת שורה לקובץ הזה היא פעולה של PM או של רוי, ⛔ לעולם לא של DEV.';

export const BASELINE_PATH = 'scripts/motion-baseline.md';

/** The only two properties a browser can animate on the compositor. */
const COMPOSITOR_ONLY = new Set(['transform', 'opacity']);

/** Values of `transition:` that animate nothing and are therefore always fine. */
const INERT_TRANSITION_VALUES = new Set(['none', 'initial', 'inherit', 'unset', 'revert']);

const SCAN_DIRS = ['app', 'components'];

// ─────────────────────────────────────────────────────────────────────────────
// source hygiene: a guard that cannot tell a violation from the comment that
// explains it fails on its own documentation (same reasoning as
// scripts/check-core-purity.mjs and scripts/radius-hygiene.test.ts).
// ─────────────────────────────────────────────────────────────────────────────

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
// rule ⓐ — CSS
// ─────────────────────────────────────────────────────────────────────────────

/** The body of the balanced `{ … }` block that starts at `open`. */
function balancedBlock(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return { body: src.slice(open + 1, i), end: i };
    }
  }
  return { body: src.slice(open + 1), end: src.length };
}

/** Every `property:` name declared anywhere inside a chunk of CSS. */
function declaredProperties(body) {
  return [...body.matchAll(/(^|[{;\s])([-a-zA-Z]+)\s*:/g)].map((m) => m[2].toLowerCase());
}

export function violationsInCss(file, source) {
  const src = cssCode(source);
  const out = [];

  // ⓐ.1 — @keyframes blocks.
  for (const m of src.matchAll(/@keyframes\s+([-\w]+)\s*\{/g)) {
    const open = m.index + m[0].length - 1;
    const { body } = balancedBlock(src, open);
    const bad = [...new Set(declaredProperties(body))].filter((p) => !COMPOSITOR_ONLY.has(p));
    if (bad.length) {
      out.push({
        file,
        rule: 'A',
        key: m[1],
        line: lineOf(src, m.index),
        detail: `@keyframes ${m[1]} animates ${bad.join(', ')} — not a compositor property`,
      });
    }
  }

  // ⓐ.2 — `transition:` shorthand declarations. `transition-duration` and friends are
  // longhands that STOP motion (the prefers-reduced-motion block) and are not animations.
  for (const m of src.matchAll(/(^|[{;\s])transition\s*:\s*([^;}]+)/g)) {
    const value = m[2].trim();
    const props = value
      .split(',')
      .map((part) => part.trim().split(/\s+/)[0]?.toLowerCase())
      .filter(Boolean);
    const bad = props.filter((p) => !COMPOSITOR_ONLY.has(p) && !INERT_TRANSITION_VALUES.has(p));
    if (bad.length) {
      out.push({
        file,
        rule: 'A',
        key: `transition:${value.replace(/\s+/g, ' ')}`,
        line: lineOf(src, m.index),
        detail: `transition on ${bad.join(', ')} — not a compositor property`,
      });
    }
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// rule ⓑ — TSX
// ─────────────────────────────────────────────────────────────────────────────

/** `width: <template|quoted string ending in %>` inside an inline style object. */
const INLINE_PCT_WIDTH = /width\s*:\s*(?:`([^`]*?%)`|'([^']*?%)'|"([^"]*?%)")/g;

export function violationsInTsx(file, source) {
  const src = tsxCode(source);
  // "driven by requestAnimationFrame" — measured on the file's CODE, never on its prose.
  if (!/\brequestAnimationFrame\b/.test(src)) return [];

  const out = [];
  for (const m of src.matchAll(INLINE_PCT_WIDTH)) {
    const raw = m[1] ?? m[2] ?? m[3];
    // The key is the EXPRESSION, not the line number: a line number moves with every
    // edit above it, and a baseline keyed on line numbers rots in a week.
    const key = raw.replace(/^\$\{/, '').replace(/\}%$/, '').replace(/%$/, '').replace(/\s+/g, ' ').trim();
    out.push({
      file,
      rule: 'B',
      key,
      line: lineOf(src, m.index),
      detail: `inline percentage width \`${raw}\` inside a requestAnimationFrame component — layout + paint every frame`,
    });
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
    console.error(`motion gate: baseline file missing at ${BASELINE_PATH}`);
    process.exit(1);
  }
  const raw = readFileSync(baselineFile, 'utf8');
  if (!raw.includes(BASELINE_HEADER_RULE)) {
    console.error(
      'motion gate: the baseline header sentence is missing — the gate refuses to run.\n' +
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
    console.error('\nmotion gate: NEW motion violations (constitution layer B · T-230/T-231 · D-158):');
    for (const v of added) console.error(`  ${v.file}:${v.line} — [rule ${v.rule}] ${v.detail}`);
    console.error(
      '\n  Animate `transform` and `opacity` only. A percentage width inside a rAF loop\n' +
        '  becomes `transform: scaleX()` on a full-width element.\n' +
        `  ⛔ Adding a line to ${BASELINE_PATH} is a PM or Roy action, ⛔ never DEV's.\n`,
    );
  }
  if (stale.length) {
    console.error('\nmotion gate: baseline rows that match nothing any more — DELETE them:');
    for (const b of stale) console.error(`  ${b.id}  (${b.finding} · ${b.task})`);
    console.error('');
  }
  if (added.length || stale.length) process.exit(1);

  console.log(`motion gate: OK — ${found.length} known violation(s) held at the baseline, 0 new.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
