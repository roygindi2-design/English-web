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

/**
 * T-234 · D-201 · constitution § ב6 — THE ONE DECLARED EXCEPTION TO RULE ⓐ, BY NAME.
 *
 * `arena-impact-a` / `arena-impact-b` animate `color` — a paint property — for the
 * arena's hit-stop flash. Why it is ⛔ not a softening of the rule: the ban on `color`
 * exists against a REPAINT ON EVERY FRAME, and `steps(1, end)` does ⛔ not interpolate at
 * all ⇒ one discrete value, one repaint, identical to toggling a class. Converting to
 * `opacity` was measured MORE expensive (D-201 § ב׳): the silhouette is an SVG that
 * inherits `currentColor`, so `opacity` fades it instead of tinting it, and equivalence
 * would need a full second copy of the figure in the DOM.
 *
 * The five fences of § ב6, and the gate enforces the ones a scanner can see:
 *   ⓐ the arena stage area only — the FILE is pinned, ⛔ not a glob;
 *   ⓑ `steps(1, end)` and iteration `1` only — every `animation:` that names the
 *      keyframes must match that timing, and ANY interpolating function is a violation;
 *   ⓒ it accompanies the hit-stop, ⛔ never a motion channel of its own (spec, `37 § 6`);
 *   ⓓ `prefers-reduced-motion` removes it (layer A · א7 — the CSS block after it);
 *   ⓔ the exception is enforced for THESE TWO NAMES ONLY. ⛔ A third flash does not enter
 *      quietly: a new `@keyframes` on `color` in the same file is a violation like any
 *      other, and adding a name here is a PM or Roy action (same rule as the baseline).
 */
export const DECLARED_KEYFRAME_EXCEPTIONS = Object.freeze([
  Object.freeze({
    file: 'app/arcade/arcade-tokens.css',
    keyframes: 'arena-impact-a',
    property: 'color',
    rule: 'D-201 · 35 § ב6 — one-frame hit-stop flash, steps(1, end) × 1',
  }),
  Object.freeze({
    file: 'app/arcade/arcade-tokens.css',
    keyframes: 'arena-impact-b',
    property: 'color',
    rule: 'D-201 · 35 § ב6 — one-frame hit-stop flash, steps(1, end) × 1',
  }),
]);

/** Fence ⓑ, as a regex over the `animation:` shorthand value: `steps(1, end)` and exactly one iteration. */
const ONE_FRAME_ONCE = /\bsteps\(\s*1\s*,\s*end\s*\)\s+1(?:\s|$)/;

/**
 * Every `animation:` shorthand value in `src` that names `keyframes`. ⛔ Longhands
 * (`animation-name:` + `animation-timing-function:`) are not matched on purpose: the
 * repo declares the two flashes as shorthands, and a longhand form would be a NEW shape
 * the scanner cannot vouch for ⇒ it falls through to "no usage found" ⇒ a violation.
 */
function animationUsages(src, keyframes) {
  const out = [];
  for (const m of src.matchAll(/(^|[{;\s])animation\s*:\s*([^;}]+)/g)) {
    const value = m[2].trim();
    const names = value.split(',').map((part) => part.trim().split(/\s+/)).flat();
    if (names.includes(keyframes)) out.push({ value: value.replace(/\s+/g, ' '), line: lineOf(src, m.index) });
  }
  return out;
}

/**
 * `null` when the block is covered by a declared exception AND every fence a scanner can
 * measure holds; otherwise the reason it is ⛔ not covered (which becomes the violation's
 * detail). The exception is matched on file + name + the exact property set — a block that
 * animates `color` AND anything else is ⛔ not the declared flash.
 */
function exceptionGap(file, keyframes, badProps, src) {
  const ex = DECLARED_KEYFRAME_EXCEPTIONS.find((e) => e.file === file && e.keyframes === keyframes);
  if (ex === undefined) return undefined;
  if (badProps.length !== 1 || badProps[0] !== ex.property) {
    return `declared exception covers \`${ex.property}\` only, block animates ${badProps.join(', ')}`;
  }
  const usages = animationUsages(src, keyframes);
  if (usages.length === 0) return `declared exception requires an \`animation:\` shorthand with steps(1, end) 1 — none found`;
  const broken = usages.filter((u) => !ONE_FRAME_ONCE.test(u.value));
  if (broken.length) {
    return `declared exception requires \`steps(1, end) 1\` (35 § ב6 fence ⓑ) — line ${broken[0].line} has \`animation: ${broken[0].value}\``;
  }
  return null;
}

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
      // T-234 · D-201 — a block named in DECLARED_KEYFRAME_EXCEPTIONS passes only while
      // every measurable fence of 35 § ב6 holds; a fence that breaks is reported as the
      // violation's detail, under the same key, so the baseline cannot absorb it either.
      const gap = exceptionGap(file, m[1], bad, src);
      if (gap === null) continue;
      out.push({
        file,
        rule: 'A',
        key: m[1],
        line: lineOf(src, m.index),
        detail:
          gap === undefined
            ? `@keyframes ${m[1]} animates ${bad.join(', ')} — not a compositor property`
            : `@keyframes ${m[1]} animates ${bad.join(', ')} — ${gap}`,
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
