#!/usr/bin/env node
/**
 * ⛔ READ-ONLY. Writes nothing into the repo — it only reports.
 *
 * WHY THIS FILE EXISTS, precisely: on 24/08 five channels in the loop were found
 * open at one end. ⛔ Not one of them was found by the loop. They were found
 * because a human sat down and wrote five commands by hand. Every check below is
 * one of those commands, made permanent.
 *
 *   1 · a commission pointing at a brief nobody wrote  → CONTENT silently fell
 *       through to routine work on the channel's first live test.
 *   2 · a finding pointing at a deleted file           → cannot be closed, ever.
 *   3 · `נבדק:` — a rule in RULES § 0.21 with 0 occurrences in the file.
 *   4 · Roy's three taps — instructed in the QA prompt, never once written, so
 *       his verification loop never closes.
 *   6 · an orphan plan → gets rewritten from scratch by the next PM.
 *
 * ⚠️ ADVISORY BY DESIGN. It exits 1 so a script can branch on it, but per the
 * plan's gate split it ⛔ MUST NOT block a merge: an orphan plan does not mean
 * the code is broken, and a good merge blocked for a bad reason teaches every
 * agent to ignore the gate. Failures here become findings.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hookState } from './install-hooks.mjs';

/**
 * ⛔ Every path resolves through ROOT, and that is not decoration: without it the
 * eight checks can only ever run against the live repo, which means the only way
 * to test them is to break the real registers. With it, each check gets a fixture
 * and can be proved to FAIL on the defect it exists to catch — which is the only
 * proof that matters for a checker.
 */
const ROOT = process.env.LOOP_HEALTH_ROOT ?? '.';
const at = (...parts) => join(ROOT, ...parts);
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const rows = (text, prefix) =>
  text.split('\n').filter((l) => new RegExp(`^\\| *${prefix}-\\d+ *\\|`).test(l));
const idOf = (line) => /^\| *([A-Z]-\d+)/.exec(line)?.[1] ?? '?';
/**
 * ⛔ THE `u` FLAG IS LOAD-BEARING. Without it, `🚫` (U+1F6AB) is split into its
 * two surrogate halves inside the character class, so the class silently becomes
 * "✅, or anything starting with \uD83D" — which matches 🔴, 🟣 and 🔵.
 * Measured: `/[✅🚫]/.test('🔴')` is TRUE and `/[✅🚫]/u.test('🔴')` is false.
 * ⇒ the un-flagged version treated every 🔴 CRITICAL finding as CLOSED, i.e. the
 * checker skipped exactly the rows it exists to protect.
 */
const CLOSED_GLYPH = /[✅🚫]/u;
const isClosed = (line) => CLOSED_GLYPH.test(line.split('|').slice(-3).join('|'));

/** A path claim is a token with a directory in it. ⛔ A bare `route.ts` is prose. */
const REAL_PATH = /`((?:[a-z][\w.\-]*\/)+[\w.\-]*\.(?:ts|tsx|mjs|md|sql|json|js|csv|jsonl))`/g;
const claimedPaths = (line) =>
  [...line.matchAll(REAL_PATH)].map((m) => m[1]).filter((p) => !/[{*]|00XX/.test(p));

/**
 * ⛔ **ONE CELL OF A MARKDOWN ROW, ⛔ not the whole line.**  ⟦NEW 13/09 · `T-299`⟧
 *
 * Mirrors `splitRow` in `lib/core/planTable.ts` on the two things that decide where a
 * cell ends, so the two parsers ⛔ cannot disagree about an index:
 *   ⓐ `\|` and `\\` are the only escapes — any other backslash is content, so a regex
 *      or a Windows path inside a cell survives;
 *   ⓑ a `|` inside a backtick code span is CONTENT — `grep x | wc -l` is one cell, and
 *      an unescaped pipe there is exactly what `T-315` measures on the task register.
 * ⚠️ It is ⛔ not imported from `planTable.ts`: this file is plain `.mjs` and runs with
 * ⛔ no TypeScript loader (it is executed by `node` directly, and by the hook).
 */
const cellsOf = (line) => {
  const cells = [];
  let current = '';
  let inCode = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\' && (line[i + 1] === '|' || line[i + 1] === '\\')) {
      current += line[i + 1];
      i += 1;
      continue;
    }
    if (ch === '`') {
      inCode = !inCode;
      current += ch;
      continue;
    }
    if (ch === '|' && !inCode) {
      cells.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current);
  // A well-formed row opens and closes with `|` ⇒ the first and last fragments sit
  // outside the table. Dropped by POSITION, ⛔ never by emptiness.
  return cells.slice(1, -1);
};

/** `plan/60-findings.md`: `#` · `חומרה` · **`קובץ:שורה`** — a fixed third column. */
const FINDING_FILE_CELL = 2;

const results = [];
/**
 * ⚠️ **A NEW CHECK IS BORN AS A WARNING.**  ⟦added 30/08, wave 2⟧
 * Roy's own lesson from phase 7, quoted: «להפוך אותו לחוסם מוקדם מדי הוא הדרך ללמד
 * כל סוכן להתעלם ממנו». A check that goes red on the day it lands, against a
 * backlog that predates it, teaches every agent that red is the normal colour.
 * ⇒ a check may declare `softUntil`. Until that date it PRINTS its verdict in
 * full — the items, the numbers, everything — and ⛔ does NOT count toward the
 * exit code. On the date, it starts counting, with ⛔ no further edit.
 * ⛔ **Soft is ⛔ NOT silent, and that distinction is the whole design:** a check
 * nobody can see is a check nobody will fix before it bites.
 */
/**
 * 🔴 ⛔ **AND A THIRD STATE, ⛔ BECAUSE TWO WERE ⛔ NOT ENOUGH.**  ⟦added 08/09 · `F-206`⟧
 *
 * `ok:false` used to mean two unrelated things at once: «I measured, and it is broken»
 * and «⛔ I could ⛔ not measure at all». Check 17 printed the ⛔ same shape of line for a
 * missing `roster.json`, an unfetched ref, and an agent that had genuinely gone dark —
 * ⛔ and the third is the reason the check exists.
 * ⇒ a check may return `notMeasured: true`. It prints ` n/m `, its detail is shown in
 * full, and it ⛔ NEVER counts toward the exit code — ⛔ regardless of any soft date,
 * because a checker that ⛔ could not run has ⛔ found nothing, and «found nothing» is
 * ⛔ not «found it clean». ⛔ A gap that reports itself is ⛔ not the same as a defect.
 */
const TODAY = new Date().toISOString().slice(0, 10);
const check = (id, title, fn, softUntil = null) => {
  const soft = softUntil !== null && TODAY < softUntil;
  try {
    const { ok, detail, items = [], notMeasured = false } = fn();
    results.push({ id, title, ok, detail, items, soft, softUntil, notMeasured });
  } catch (e) {
    results.push({
      id,
      title,
      ok: false,
      detail: `⛔ הבדיקה עצמה נפלה: ${e.message}`,
      items: [],
      soft,
      softUntil,
    });
  }
};

/**
 * ⛔ The build order of `36 § 13` is read from the GENERATED balance table, ⛔ never
 * hard-coded here: the table already prints the workstreams in the spec's own order
 * with their open counts, and a second copy of that order in this file is a second
 * thing to keep in sync — which is exactly the class of defect check 8 exists for.
 */
const balance = () => {
  const idx = read(at('docs', 'plan-open.md'));
  const out = [];
  for (const m of idx.matchAll(/^\|\s*(\d+)\.\s*`([a-z]+)`\s*\|([^|]*)\|([^|]*)\|/gm)) {
    out.push({ order: Number(m[1]), name: m[2], open: Number((m[4] ?? '').trim()) });
  }
  /**
   * ⛔ **AND THE ROWS THAT SIT OUTSIDE THE SEQUENCE — `loop` · `base` · `general`.**
   * They were invisible to every check here, and that invisibility is the defect
   * `D-174` closes: measured 31/08, **28 open rows** lived in them and ⛔ no DEV tick
   * could reach one. `order` is `null` on purpose — they have ⛔ no place in `36 § 13`,
   * and a fake number here would be a lie the build-order checks would then act on.
   */
  for (const m of idx.matchAll(/^\|\s*·\s*`([a-z]+)`\s*\(מחוץ לרצף\)\s*\|([^|]*)\|([^|]*)\|/gm)) {
    out.push({ order: null, name: m[1], open: Number((m[3] ?? '').trim()) });
  }
  return out;
};

/** `36 § 13` holds ⛔ none of these. Mirrors `CROSS_CUTTING` in `lib/core/planTable.ts`. */
const CROSS_CUTTING = new Set(['general', 'loop', 'base']);

/**
 * ⛔ **WHERE THE LOOP CAME FROM WHEN THE FOCUS IS CROSS-CUTTING.**
 * `ACTIVE_WORKSTREAM: general` has ⛔ no position in the build order, so checks 13 and 14
 * — both of which ask «what has the sequence already passed?» — have ⛔ nothing to measure
 * against. ⇒ the answer is **written down, ⛔ not guessed**: `PREV_WORKSTREAM` in
 * `plan/00-control.md` carries the feature workstream the focus stepped away from.
 * ⛔ Empty while the focus is cross-cutting is a **FAIL**, ⛔ not a pass — an unmeasurable
 * check that reports green is the exact lie this file exists against.
 */
const prevWorkstream = () =>
  (/^PREV_WORKSTREAM:\s*"?([^"\s#]*)"?/m.exec(read(at('plan', '00-control.md')))?.[1] ?? '').trim();

/** The row checks 13/14 measure «what the sequence passed» from. */
const sequenceAnchor = (table, active) => {
  if (!CROSS_CUTTING.has(active)) return { row: table.find((w) => w.name === active) };
  const prev = prevWorkstream();
  if (prev === '') return { row: undefined, why: '⛔ PREV_WORKSTREAM ריק בעוד המוקד חוצה-מערכת' };
  const row = table.find((w) => w.name === prev);
  return row === undefined
    ? { row: undefined, why: `⛔ PREV_WORKSTREAM \`${prev}\` ⛔ אינו בטבלת המאזן` }
    : { row };
};
/**
 * ⛔ **A TASK ROW'S STATUS IS COLUMN 5 OF 8, ⛔ NOT «somewhere near the end».**
 * `isClosed` above reads the LAST THREE cells, which is right for a finding
 * (`FINDING_STATUS_INDEX` 6 of 8) and ⛔ WRONG for a task (`TASK_STATUS_INDEX` 4 of
 * 8, with the file list and the skill column after it). Measured while writing
 * check 12: reusing `isClosed` on `plan/50-tasks.md` reported **226 open rows out
 * of 226** — every closed task counted as open, silently. ⇒ tasks get their own
 * reader, and the indices are the ones `lib/core/planTable.ts` already declares.
 */
const TASK_STATUS_INDEX = 4;
// ⛔ בדיקה 22 קוראת גם שורות ממצא, ותא הסטטוס שלהן הוא **6**, ⛔ לא 4 — ההערה
// שמעל כבר אומרת זאת, והמספר עצמו פשוט ⛔ לא היה בקובץ.
const FINDING_STATUS_INDEX = 6;
const TASK_MILESTONE_INDEX = 1;
/**
 * ⛔ **THE SPLITTER IS A PORT OF `lib/core/planTable.ts::splitRow`, ⛔ NOT
 * `line.split('|')`.** The registers escape a literal pipe as `\|` and carry pipes
 * inside code spans (a regex alternation in a cell). Measured while writing check
 * 12: a naive split put four rows' status in the wrong column — `T-206` `T-213`
 * `T-217` `T-224` — and reported them as having ⛔ no status at all, i.e. it lost
 * exactly the rows whose prose is richest. ⇒ same rules, same indices, so this file
 * and the generated index can ⛔ never disagree about what is open.
 */
const codeSpans = (line) => {
  const runs = [];
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\') {
      const next = line[i + 1];
      if (next === '|' || next === '\\' || next === '`') i += 1;
      continue;
    }
    if (ch !== '`') continue;
    const start = i;
    while (line[i + 1] === '`') i += 1;
    runs.push({ start, length: i + 1 - start });
  }
  const spans = [];
  for (let a = 0; a < runs.length; a += 1) {
    const open = runs[a];
    for (let b = a + 1; b < runs.length; b += 1) {
      if (runs[b].length !== open.length) continue;
      spans.push([open.start, runs[b].start + runs[b].length]);
      a = b;
      break;
    }
  }
  return spans;
};
const splitRow = (line) => {
  const spans = codeSpans(line);
  const inside = (at) => spans.some(([s, e]) => at >= s && at < e);
  const cells = [];
  let cur = '';
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\') {
      const next = line[i + 1];
      if (next === '|' || next === '\\') {
        cur += next;
        i += 1;
        continue;
      }
      cur += ch;
      continue;
    }
    if (ch === '|' && !inside(i)) {
      cells.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur);
  return cells.slice(1, -1).map((c) => c.trim());
};
const taskCell = (line, i) => splitRow(line)[i] ?? '';
/**
 * ⛔ **FIRST GLYPH WINS, exactly as `lib/core/planTable.ts::classifyStatus` decides
 * it.** A status cell is allowed to argue its case — «⬜ פנויה … הועברה מ-✅» — and a
 * `contains` test would read that as closed. Measured while writing this: `contains`
 * reported **170 closed of 226** against the generated index's **164**, i.e. six open
 * rows vanished. ⇒ the glyph that appears EARLIEST in the cell is the state.
 */
const STATE_GLYPHS = ['✅', '🚫', '⬜', '⛔', '🟣', '🔵'];
const taskState = (line) => {
  const cell = taskCell(line, TASK_STATUS_INDEX);
  let best = null;
  let bestAt = Number.POSITIVE_INFINITY;
  for (const g of STATE_GLYPHS) {
    const at = cell.indexOf(g);
    if (at !== -1 && at < bestAt) {
      bestAt = at;
      best = g;
    }
  }
  return best;
};
const taskOpen = (line) => {
  const s = taskState(line);
  return s !== '✅' && s !== '🚫';
};
const taskBlocked = (line) => taskState(line) === '⛔';
const activeWorkstream = () =>
  /^ACTIVE_WORKSTREAM:\s*(\S+)/m.exec(read(at('plan', '00-control.md')))?.[1];

/* 1 — a commission's brief and gate are INPUTS. ⛔ They must exist before the row
 * goes ⬜, or CONTENT reads the row, finds nothing, and falls through in silence.
 * ⚠️ Contrast with a task row, whose files are OUTPUTS and are absent on purpose. */
/**
 * ⛔ A BLOCKED commission is checked DIFFERENTLY, and that is not a loophole —
 * it is the register's own rule 2: «אין מקור ואין שער ⇒ ההזמנה אינה נכתבת», and
 * «חסימה היא תוצאה מוצלחת». Demanding a brief from a row that is blocked BECAUSE
 * it has no brief is a check that can only be satisfied by writing the file the
 * block exists to prevent — i.e. the check would push an agent to produce exactly
 * the thing the register forbids.
 * ⇒ so a ⛔ row is not exempt, it trades one obligation for another: it must NAME
 * the block (`F-NNN` or `T-NNN`), so the block is traceable to a finding or a task
 * and ⛔ cannot be used as a quiet place to park work.
 */
const BLOCKED_STATE = /⛔/u;
const BLOCK_REFERENCE = /\b[FT]-\d+\b/;
const isBlocked = (line) => BLOCKED_STATE.test(line.split('|').slice(-3).join('|'));

check('1', 'תדריך ושער של כל הזמנה פתוחה — קיימים', () => {
  const missing = [];
  for (const line of rows(read(at('plan', '25-content-commissions.md')), 'K')) {
    if (isClosed(line)) continue;
    if (isBlocked(line)) {
      if (!BLOCK_REFERENCE.test(line)) missing.push(`${idOf(line)} → ⛔ חסומה ⛔ בלי ממצא או משימה`);
      continue;
    }
    for (const p of claimedPaths(line)) if (!existsSync(at(p))) missing.push(`${idOf(line)} → ${p}`);
  }
  return { ok: missing.length === 0, detail: `${missing.length} חסרים`, items: missing };
});

/**
 * 2 — a finding names where the defect IS. That file must exist.
 *
 * 🔴 ⛔ **AND IT READS THE `קובץ` CELL, ⛔ NOT THE WHOLE ROW.**  ⟦FIXED 13/09 · `T-299`
 * · closes `F-225` and `F-228`, the same defect opened twice⟧
 *
 * 🔬 **Measured live in `C-0535`, ⛔ not argued:** `npm run loop:health` ⇒ `FAIL 2. … 2
 * מתים`, and both dead paths were the SAME one —
 * `app/api/amirnet/practice/route.ts` — named in the FREE BODY of `F-222` and `F-225`
 * as the route that has ⛔ not been built yet. ⇒ the check was red on two **correct**
 * rows, and a finding whose whole content is «⛔ this path does not exist» could
 * ⛔ never be written without reddening it. That is the same class as `F-199`.
 *
 * ⚠️ **⛔ And the check is ⛔ NOT softened** — the `קובץ` cell is a fixed third column,
 * and a dead path sitting THERE still goes red. `F-166` is the precedent the task row
 * names: a number nobody enforces becomes «the normal red», and a check that is red
 * every tick is ⛔ not a gate — it is noise.
 */
check('2', 'קובץ:שורה של כל ממצא פתוח — קיים', () => {
  const missing = [];
  for (const line of rows(read(at('plan', '60-findings.md')), 'F')) {
    if (isClosed(line)) continue;
    const fileCell = cellsOf(line)[FINDING_FILE_CELL] ?? '';
    for (const p of claimedPaths(fileCell)) if (!existsSync(at(p))) missing.push(`${idOf(line)} → ${p}`);
  }
  return { ok: missing.length === 0, detail: `${missing.length} מתים`, items: missing };
});

/**
 * 3 — `RULES § 0.21`, and ⛔ **it measures MOVEMENT now, ⛔ not a stamp.**
 * ⟦REWRITTEN 09/09 · Roy's explicit instruction · שלב 5⟧
 *
 * 🔬 **Why the stamp stopped working, measured.** The old rule was «every open item
 * carries a `נבדק:` stamp from this week», and it is trivially satisfiable **without
 * touching the problem**: `C-0478` refreshed six items in one tick and wrote «⛔ אין
 * שינוי» on every one of them. ⇒ the check rewarded the one action that costs nothing
 * and changes nothing, and the pile grew underneath a wall of fresh dates.
 *
 * ⇒ **the question is now «did this row MOVE», and git is the only honest answer.**
 * `git log -G'^\| <id> \|' -- plan/03-for-roy.md` finds the last commit whose diff
 * actually touched that row. A stamp refresh DOES count as movement — it is a real
 * edit — but it can no longer be repeated for free: **30 days**, ⛔ not seven, so a
 * row that only ever gets its date bumped still has 29 days to become work or leave.
 *
 * 🔴 ⛔ **AND IT REPORTS «⛔ לא נמדד» WHEN GIT CANNOT ANSWER**, ⛔ never «passed» — a
 * shallow clone, a missing file or a git failure is ⛔ not evidence that a row moved.
 */
const STAMP = /נבדק:\s*(\d{4}-\d{2}-\d{2})/;
const ROY_ITEM_STALE_DAYS = 30;
check('3', `כל פריט פתוח לרוי זז ב-${ROY_ITEM_STALE_DAYS} הימים האחרונים`, () => {
  const file = at('plan', '03-for-roy.md');
  const text = read(file);
  if (text === '') return { ok: false, notMeasured: true, detail: '⛔ לא נמדד — ⛔ אין 03-for-roy.md' };

  const git = (...args) => {
    try {
      // ⛔ `cwd: ROOT` ⛔ ואינו ברירת המחדל — הבודק רץ מהריפו החי בעוד הפיקסצ׳ר
      // יושב ב-`LOOP_HEALTH_ROOT`. בלי זה, בדיקה של פיקסצ׳ר הייתה מודדת את הריפו
      // האמיתי ועוברת תמיד — בודק שאפשר לראות רק עובר ⛔ לא נבדק.
      return execFileSync('./scripts/g', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return null;
    }
  };
  if (git('rev-parse', '--git-dir') === null) {
    return { ok: false, notMeasured: true, detail: '⛔ לא נמדד — git ⛔ אינו זמין כאן' };
  }

  const cutoff = Date.now() - ROY_ITEM_STALE_DAYS * 864e5;
  const stale = [];
  const unmeasured = [];
  for (const line of text.split('\n')) {
    if (!/^\| *\d+ *\| *(PM|DEV|CRITIC|CONTENT|QA|OPERATOR|סשן)/.test(line)) continue;
    if (isClosed(line)) continue;
    const id = /^\| *(\d+)/.exec(line)?.[1];
    if (id === undefined) continue;
    const when = git('log', '-1', '--format=%cI', `-G^\\| ${id} \\|`, '--', 'plan/03-for-roy.md');
    if (when === null || when === '') {
      // ⛔ «⛔ לא נמדד» ⛔ אינו «עבר», ⇒ ניפול חזרה לחותמת ⛔ ורק כדי לומר מה כן ידוע.
      const m = STAMP.exec(line);
      unmeasured.push(`פריט ${id} — ⛔ git ⛔ לא החזיר תאריך${m === null ? '' : ` (חותמת: ${m[1]})`}`);
      continue;
    }
    const days = Math.floor((Date.now() - Date.parse(when)) / 864e5);
    if (Date.parse(when) < cutoff) stale.push(`פריט ${id} — ⛔ לא זז ${days} ימים (אחרון: ${when.slice(0, 10)})`);
  }
  if (unmeasured.length > 0 && stale.length === 0) {
    return { ok: false, notMeasured: true, detail: `⛔ לא נמדד — ${unmeasured.length} פריטים`, items: unmeasured };
  }
  return {
    ok: stale.length === 0,
    detail: `${stale.length} ⛔ לא זזו ${ROY_ITEM_STALE_DAYS} יום`,
    items: [...stale, ...unmeasured],
  };
});

/* 3.5 — ⛔ THE OPEN TABLE HOLDS ⛔ ONLY WHAT IS OPEN.
 *
 * 🔬 Measured 09/09 and it is the reason Roy stopped reading the file: the `## פתוח`
 * table carried **71 rows, of which 44 already bore ✅ / ⏸️ / ↪️**. ⇒ anyone opening it
 * to see what was waiting for them read 71 rows to find 27, and most of the 71 asked
 * for nothing. `RULES § 0.21` already obliges PM to sweep that table every tick — the
 * obligation existed, the enforcement did not, and 44 rows is what that costs.
 *
 * ⛔ This check does ⛔ not care whether a row is stale in CONTENT — check 3 owns that.
 * It asks one thing: is a row marked closed still sitting under `## פתוח`?
 */
check('3.5', '⛔ אף שורה סגורה ⛔ אינה יושבת בטבלת «פתוח» של רוי', () => {
  const text = read(at('plan', '03-for-roy.md'));
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith('## פתוח'));
  if (start < 0) return { ok: true, detail: '⛔ לא נמדד — ⛔ אין כותרת «פתוח»' };
  /** The sweep's own holding area ends the live table; so does the closed table. */
  const stop = lines.findIndex(
    (l, i) => i > start && (l.startsWith('## נסגר') || l.startsWith('### ✅ שורות שכבר נסגרו')),
  );
  const misplaced = [];
  for (const line of lines.slice(start, stop < 0 ? lines.length : stop)) {
    if (!/^\| *\d+ *\|/.test(line)) continue;
    if (isClosed(line)) misplaced.push(`פריט ${/^\| *(\d+)/.exec(line)?.[1]}`);
  }
  return {
    ok: misplaced.length === 0,
    detail: `${misplaced.length} סגורות בטבלת «פתוח»`,
    items: misplaced,
  };
});

/**
 * 19 — 📇 **`plan/05-departments.md` הוא נטו, ⛔ ולא לוג.**  ⟦NEW 09/09 · דרישת רוי⟧
 *
 * ⛔ **מה הקובץ הזה, ו⛔ למה תקרה:** הוא הערוץ מ-PM אל DEV ואל רוי — אילו מחלקות
 * קיימות, אילו יעדים פתוחים בכל אחת, ומי בעבודה. **PM ו-DEV קוראים אותו בכל טיק**
 * ⇒ ~15 קריאות ביום, וגודלו הוא מס שמשולם בכל אחת.
 * 🔴 **והכשל שהתקרה מונעת נמדד כבר פעמיים במאגר הזה:** `plan/03-for-roy.md` הגיע
 * ל-206KB עם 53 שורות סגורות בטבלת «פתוח», ו-`plan/00-control.md` נמדד 661 בתים
 * מעל התקרה שלו ⛔ בלי ששום דבר שמר עליה. ⇒ «נטו» ⛔ אינו נשמר בכוונה טובה.
 *
 * 🆕 **⟦15/09 · `C-0621` · הוראת רוי⟧ התקרה עלתה 4,096 ⇒ 8,192, ו⛔ ה«נטו» ⛔ לא רוכך.**
 * רוי ביקש **יעד לכל מחלקה** («שכל המחלקות יהיו לנו עם יעדים»), כדי ש-PM יפתח פרוסות
 * לתוך מבנה קיים במקום להמציא אותו בכל טיק. עשרה יעדים עם **מדד סיום** לכל אחד ⛔ אינם
 * נכנסים ב-4,096 בתים של עברית (2 בתים לתו) — הקובץ נמדד **6,198**.
 * ⚖️ **והמחיר נמדד, ⛔ ולא הונח:** ~15 קריאות ביום × 2,102 בתים נוספים ≈ **31KB ביום**,
 * כלומר כ-**1.5K טוקנים ביום** על פני שישה סוכנים. ⇒ זול מול מחלקה שנראית «גמורה»
 * מפני ש⛔ אין בה שורות ו⛔ איש ⛔ לא בדק. 🔬 **נמדד באותו יום:** `nav` · `studies` ·
 * `arena` נשאו ⬜=0 **ויעד שלא הושג** — שלושתן נקראו כגמורות ו⛔ לא היו.
 * ⛔ **ומה שהתקרה ⛔ עדיין אוסרת ⛔ לא זז:** שורה שהושגה **נמחקת**, ⛔ ואינה מסומנת ✅.
 */
check('19', '`plan/05-departments.md` מתחת לתקרת 8KB — נטו, ⛔ לא לוג', () => {
  const text = read(at('plan', '05-departments.md'));
  if (text === '') {
    return { ok: false, notMeasured: true, detail: '⛔ לא נמדד — הקובץ ⛔ אינו בקלון' };
  }
  const bytes = Buffer.byteLength(text, 'utf8');
  const CEILING = 8192;
  return {
    ok: bytes <= CEILING,
    detail: `${bytes} בתים מתוך ${CEILING}`,
    items: bytes > CEILING ? ['⇒ יעד שהושג נמחק, ⛔ ולא מסומן ✅. ההיסטוריה חיה ב-git log וברגיסטר.'] : [],
  };
});

/**
 * 21 — 🔒 **נעילה יתומה — הלופ ⛔ לא ידע לראות אותה, ונמדד חי 09/09.**  ⟦NEW 09/09⟧
 *
 * 🔬 **מה נמדד, ⛔ לא הונח.** טיק QA מלא נורה חי ב-18:51:40Z, רץ 21.4 דקות, שרף
 * 237,150 טוקנים, ⛔ **לא דחף דבר לשום מקום** — ענף התוצאה `claude/nice-ride-bit6a7`
 * ⛔ **מעולם לא נוצר על origin** — ויצא `IDLE` **בעודו מחזיק את הנעילה**.
 * ⇒ מאותו רגע: DEV · PM · CONTENT ⛔ אינם יכולים לדחוף קוד (שער ה-`pre-push`),
 * ו-QA עצמה ⛔ אינה ממזגת ל-`dev` — `QA.md:406` מורה «נעילה ⛔ לא ריקה ⇒ ⛔ אין מיזוג
 * בטיק הזה». **הנעילה המתה של QA חוסמת את QA.**
 *
 * 🔴 **ולמה זה ⛔ לא נראה:** `git grep LOCK_HELD_BY -- scripts/` החזיר את שער ה-`pre-push`
 * בלבד. ⛔ **אף בדיקה ⛔ לא קראה את הנעילה.** בדיקה 17 הייתה מאדימה בסוף — אבל רק
 * אחרי **24 שעות**, ועל התסמין (שתיקת סוכן), ⛔ לא על הסיבה.
 *
 * ⚠️ **הסף נגזר ממדידה, ⛔ לא מניחוש:** 212 מדגמי «נעילה ⇢ הקומיט הבא של אותו סוכן»
 * ב-21 יום ⇒ חציון **15.7 דק'**, והטיק החי שנצפה מקצה לקצה ⇒ **21.4 דק'**. הזנב הארוך
 * ⛔ אינו טיקים ארוכים — הוא בדיוק התקלה הזאת. ⇒ **90 דקות** הן ~4× הטיק האמיתי הארוך.
 *
 * 🔴 **ושתי הפסקאות ביחד, ⛔ לא הזמן לבדו:** נעילה בת 90 דק' שבעליה **כן** דחף מאז
 * שלקח אותה היא סוכן שעובד לאט, ⛔ ולא סוכן מת. ⇒ הבדיקה מאדימה רק כששניהם מתקיימים.
 */
check('21', 'נעילה חיה, ⛔ או יתומה — ⛔ לא נעילה שאיש ⛔ אינו קורא', () => {
  const control = read(at('plan', '00-control.md'));
  const holder = (control.match(/^LOCK_HELD_BY:\s*"?([A-Za-z]*)/m) || [])[1] || '';
  if (holder === '') return { ok: true, detail: 'הנעילה ריקה' };
  const atRaw = (control.match(/^LOCK_AT:\s*"?([0-9T:\-]+Z)/m) || [])[1];
  if (!atRaw) {
    return { ok: false, detail: holder + ' מחזיק, ו-LOCK_AT ⛔ אינו קריא ⇒ ⛔ אי אפשר למדוד גיל' };
  }
  const ageMin = (Date.now() - new Date(atRaw).getTime()) / 60000;
  const CEILING_MIN = 90;
  if (ageMin <= CEILING_MIN) {
    return { ok: true, detail: holder + ' מחזיק ' + ageMin.toFixed(0) + " דק' מתוך " + CEILING_MIN };
  }
  // ⛔ **הפסקה השנייה, ו⛔ לא הזמן לבדו:** האם בעל הנעילה דחף **עבודה** מאז שלקח אותה?
  const git = (...args) => {
    try {
      return execFileSync('./scripts/g', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return '';
    }
  };
  // ⛔ `QA` ו-`CRITIC` הם אותו סוכן בשתי איותים שהרגיסטר עדיין נושא.
  const grep = holder === 'QA' ? '^loop\\((QA|CRITIC)\\)' : '^loop\\(' + holder + '\\)';
  // 🔴 **וקומיט הנעילה עצמו ⛔ אינו ראיה לחיים.** הוא נושא את אותה חותמת זמן כמו
  // `LOCK_AT` ⇒ `--since` תמיד תופסת אותו, ובלי הסינון הזה כל נעילה יתומה הייתה
  // מדווחת «⇒ חי» ברגע שהיא חוצה את התקרה. ⇒ נספרים רק קומיטים שנגעו במשהו
  // **מלבד** `plan/00-control.md` — אותו מבחן שבדיקה 17 עושה, ומאותה סיבה.
  const raw = git('log', '--since=' + atRaw, '--format=%x00%s', '--name-only', '-E', '--grep=' + grep, 'HEAD');
  const moved = raw
    .split('\x00')
    .filter((c) => c.trim() !== '')
    .filter((c) => {
      const files = c.split('\n').slice(1).filter((f) => f.trim() !== '');
      return files.some((f) => f !== 'plan/00-control.md');
    }).length;
  if (moved > 0) {
    return {
      ok: true,
      detail: holder + ' מחזיק ' + ageMin.toFixed(0) + " דק', ⛔ אך דחף " + moved + ' קומיטים מאז ⇒ חי',
    };
  }
  return {
    ok: false,
    detail:
      holder + ' מחזיק ' + ageMin.toFixed(0) + " דק' (תקרה " + CEILING_MIN + ') ⛔ ואפס קומיטים מאז ' + atRaw,
    items: [
      '⇒ נעילה יתומה: הסוכן שלקח אותה מת בלי לשחרר.',
      '⇒ הלופ תקוע — DEV/PM/CONTENT ⛔ אינם דוחפים קוד, ו-QA ⛔ אינה ממזגת ל-dev.',
      '⇒ השחרור מתועד ב-RULES § 0.4 — הסוכן שמזהה מנקה, בקומיט משלו, עם שלושת המספרים.',
    ],
  };
});

/**
 * ⚰️ 22 — **«חפירה מהארכיון»: שורה סגורה ⛔ אינה קמה לתחייה.**  ⟦NEW 09/09 · הוראת רוי⟧
 *
 * 🔬 **הכשל, בדיוק:** סוכן מודד תסמין, מגלגל `grep`, ומוצא שורה **סגורה** שמתארת את
 * אותו תסמין — בארכיון יושב הטקסט המלא עם «תוקן ב-X». ⇒ הוא מסיק «זה כבר פתור»,
 * ⛔ לא פותח ממצא, ⛔ ולא מודד כלום. **התסמין חוזר, והרגיסטר אומר שהוא סגור.**
 * ⛔ **או הגרסה ההפוכה, ואותה מחלקה:** הוא **מחזיר את השורה הישנה ל-⬜** — וכך הראיה
 * שנמדדה כשהיא נסגרה נמחקת, והשורה נושאת עכשיו שתי מדידות סותרות בלי תאריך.
 *
 * ⇒ **הכלל (`RULES § 0.30`): תסמין שנמדד שוב הוא ממצא חדש, עם מדידה טרייה.** השורה
 * הישנה מצוטטת כ**תקדים**, ⛔ ולעולם לא כ**פתרון**.
 *
 * ⚠️ **ולמה הבדיקה היא «תחייה» ו⛔ לא «מצטט ארכיון».** ⛔ נמדד 09/09 לפני שנכתבה:
 * ‏`npm run archive` משאיר **בדל חי לכל שורה שאורכבה** ⇒ מספר המזהים שקיימים
 * **אך ורק** בארכיון הוא **0 מתוך 383**. ⇒ בדיקת «מזהה שקיים רק בארכיון» הייתה
 * ירוקה לנצח **מעצם הבנייה** — בדיוק השער החלול שהסבב הזה מנקה. ⇒ נמדדת **התנועה**:
 * `✅`/`🚫` ⇢ `⬜`/`⛔`/`🟣`, מול הקומיט הקודם.
 */
check('22', 'שורה סגורה ⛔ לא הוחזרה לפתוחה — תסמין חוזר הוא ממצא **חדש** (§ 0.30)', () => {
  const git = (...args) => {
    try {
      return execFileSync('./scripts/g', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      return '';
    }
  };
  const CLOSED = new Set(['✅', '🚫']);
  const REOPENED = new Set(['⬜', '⛔', '🟣']);
  const stateOf = (line, idx) => {
    const cell = taskCell(line, idx);
    let best = null;
    let bestAt = Number.POSITIVE_INFINITY;
    for (const g of ['✅', '🚫', '⬜', '⛔', '🟣', '🔵']) {
      const a = cell.indexOf(g);
      if (a !== -1 && a < bestAt) { bestAt = a; best = g; }
    }
    return best;
  };
  const table = (text, re, idx) => {
    const m = new Map();
    for (const line of text.split('\n')) {
      const hit = re.exec(line);
      if (hit) m.set(hit[1], stateOf(line, idx));
      re.lastIndex = 0;
    }
    return m;
  };
  const REGISTERS = [
    ['plan/50-tasks.md', /^\|\s*`?(T-\d+)`?\s*\|/, TASK_STATUS_INDEX],
    ['plan/60-findings.md', /^\|\s*`?(F-\d+)`?\s*\|/, FINDING_STATUS_INDEX],
  ];
  const raised = [];
  let measured = false;
  for (const [file, re, idx] of REGISTERS) {
    const nowText = read(at(...file.split('/')));
    const prevText = git('show', `HEAD~1:${file}`);
    if (nowText === '' || prevText === '') continue;
    measured = true;
    const now = table(nowText, re, idx);
    const prev = table(prevText, re, idx);
    for (const [id, wasState] of prev) {
      if (!CLOSED.has(wasState)) continue;
      const isState = now.get(id);
      if (isState !== undefined && REOPENED.has(isState)) {
        raised.push(`${id} — ${wasState} ⇢ ${isState} (${file})`);
      }
    }
  }
  if (!measured) {
    return { ok: false, notMeasured: true, detail: '⛔ לא נמדד — ⛔ אין HEAD~1 או ⛔ אין רגיסטר' };
  }
  return {
    ok: raised.length === 0,
    detail: raised.length === 0 ? '⛔ אף שורה סגורה ⛔ לא נפתחה מחדש' : `${raised.length} תחיות`,
    items: raised.length === 0 ? [] : [
      ...raised,
      '⇒ ⛔ אל תחזיר שורה סגורה ל-⬜. פתח **ממצא חדש** עם מדידה טרייה של היום,',
      '   וצטט את הישנה כ**תקדים** (§ 0.30). הראיה שנמדדה בסגירה ⛔ אינה נמחקת.',
    ],
  };
});

/**
 * 🧑‍⚖️ 23 — **הפרק «פתוח» של רוי נושא ⛔ רק מה שפתוח.**  ⟦NEW 10/09 · דרישת רוי⟧
 *
 * 🔬 **מה נמדד 10/09, ⛔ ולא שוער:** ‏`plan/03-for-roy.md` היה **207KB** עם **164
 * קומיטים ב-30 יום**, והפרק שכותרתו «פתוח» נשא **71 שורות — 59 מהן סגורות (83%)**.
 * ⇒ רוי פתח קובץ שכותרתו «פתוח», מצא בו כמעט רק עבודה גמורה, **והפסיק לקרוא אותו.**
 * ⛔ **וזה ⛔ לא היה מקרה:** ⛔ אף שער ⛔ לא קרא את הקובץ הזה — `measure:plan` קורא
 * `50-tasks` ו-`60-findings` בלבד.
 *
 * 🔴 **ומה שהבדיקה הזאת באמת מונעת:** הקובץ הוא **הערוץ היחיד מהלופ אל רוי**. פרק
 * שרובו ⛔ אינו מה שכותרתו אומרת ⛔ אינו נקרא — וברגע שהוא ⛔ אינו נקרא, **כתיבה אליו
 * הופכת לפעולת ברירת מחדל של «⛔ אין לי מה לעשות»**, שזו בדיוק ההתנהגות שרוי תיאר.
 *
 * ⚠️ **הסף הוא יחס, ⛔ ולא מספר שורות.** פרק פתוח גדול ⛔ אינו בעיה אם הוא באמת פתוח.
 * ⇒ שורה סגורה בתוך «פתוח» היא **הפגם**, והתקרה עליה היא **אפס**.
 */
check('23', 'הפרק «פתוח» ב-`03-for-roy.md` ⛔ אינו נושא שורות סגורות', () => {
  const text = read(at('plan', '03-for-roy.md'));
  if (text === '') {
    return { ok: false, notMeasured: true, detail: '⛔ לא נמדד — הקובץ ⛔ אינו בקלון' };
  }
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith('## פתוח'));
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## נסגר'));
  if (start === -1 || end === -1) {
    return { ok: false, notMeasured: true, detail: '⛔ לא נמדד — ⛔ אין פרק «פתוח»/«נסגר»' };
  }
  const rows = lines.slice(start, end).filter((l) => /^\| ?[\d·]+ ?\|/.test(l));
  /**
   * 🔴 **הסמן נקרא בתחילת תא, ⛔ ולא בכל מקום בשורה — וזה ⛔ אינו ליטוש.**
   * ⟦תוקן 10/09⟧ הנוסח הראשון חיפש `includes('נסגר')` על **השורה כולה**, ולכן שורה
   * **פתוחה** שמספרת בפרוזה על משהו **אחר** שנסגר («שני החסמים כבר **נסגרו** ונמדדו»)
   * נספרה כשורה סגורה. ⇒ הבדיקה האדימה על פריט 107 **ביום שנכתב**, והאשימה את
   * הטיק שדחף אחריו. ⛔ בדיקה שמאשימה את הסוכן הלא-נכון גרועה מבדיקה שאינה קיימת.
   * 🔬 **והחלופה נמדדה על הקובץ החי, ⛔ ולא הונחה:** «סמן בתחילת תא» מזהה
   * **28 מתוך 28** השורות בפרק «נסגר» — כולל שתי צורות שכלל צר יותר היה מפספס
   * (סמן בתא מאוחר, ו-`↪️ מוזג לפריט`) — ו-**0 מתוך 14** בפרק «פתוח».
   * ⇒ ⛔ רגישות ⛔ לא נוּרדה; ⛔ רק הרעש הוסר.
   */
  /**
   * 📋 ⟦11/09⟧ חמשת הסמנים, ⛔ ולא שלושה — מתוך `T-288`ⓑ שה-PM כתב ב-C-0517, **32 דקות
   * לפני** שהתיקון הזה נכתב כאן ⛔ בלי לדעת עליו. שתי הצורות שהוא הוסיף (`🚫` מוחלפת ·
   * `⏸️` מושהית) ⛔ **אינן בשימוש ב-`03-for-roy.md` היום** — נמדד, 0 שורות — ⇒ הפער
   * **רדום** ⛔ ולא חי. ⛔ אבל הן כן בשימוש ברגיסטר המשימות, והוספתן חינם.
   */
  const CLOSURE = ['✅', '🚫', '⏸️', '↪️', '🔒'];
  const closed = rows.filter((l) =>
    l
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .some((cell) => CLOSURE.some((m) => cell.trim().slice(0, 4).startsWith(m))),
  );
  return {
    ok: closed.length === 0,
    detail: `${rows.length} שורות בפרק «פתוח», ${closed.length} מהן סגורות (תקרה 0)`,
    items:
      closed.length === 0
        ? []
        : [
            '⇒ שורה שנסגרה עוברת ל-`## נסגר` או ל-`plan/archive/for-roy-archive.md`.',
            '⇒ ⛔ אפס מחיקה — היא **עוברת**, ⛔ ואינה נמחקת.',
          ],
  };
});

/* 4 — the ONLY path by which an answer from Roy re-enters the loop. */
check('4', 'סומן RELEASE_READY ⇒ שלוש ההקשות נכתבו', () => {
  const control = read(at('plan', '00-control.md'));
  const ready = /^RELEASE_READY:\s*"?[^"\s]/m.test(control);
  const taps = /שלוש הקשות|שלוש ההקשות/.test(read(at('plan', '03-for-roy.md')));
  if (!ready) return { ok: true, detail: 'אין סימון מוכן — אין מה לבדוק' };
  return {
    ok: taps,
    detail: taps ? 'נכתבו' : '⛔ מוכן ללא הקשות — לולאת האימות של רוי אינה נסגרת',
  };
});

/* 5 — a glyph nothing recognises puts a row in NO queue. Caught three real lies
 * in two days: T-164, T-106, T-137. Read from the generated index, which is the
 * one place that already classifies every row. */
check('5', 'אפס סטטוס לא-מוכר · אפס שורה פגומה', () => {
  const idx = read(at('docs', 'plan-open.md'));
  const num = (re) => Number(re.exec(idx)?.[1] ?? '0');
  const unknown = num(/^## ❔ [^(]*\((\d+)\)/m);
  const malformed = num(/^## ⚠️ שורות משימה פגומות[^(]*\((\d+)\)/m);
  return {
    ok: unknown === 0 && malformed === 0,
    detail: `${unknown} לא-מוכרות · ${malformed} פגומות`,
  };
});

/**
 * 9 — ⛔ **THE FILE EVERY AGENT READS EVERY TICK, AND IT WAS ALREADY OVER.**
 * `RULES § 0.2 ב׳` sets a 12KB ceiling on `plan/00-control.md` for one reason:
 * four agents read it on every single tick, so its size is a tax paid ~20 times a
 * day. Measured 25/08 — **12,949 bytes, 661 over the ceiling**, ⛔ and nothing in
 * the loop was watching. The rule existed; the enforcement did not.
 * ⚠️ Advisory like every check here: an oversized register ⛔ does not mean the
 * code is broken, and it ⛔ must not block a merge.
 */
const CONTROL_CEILING = 12 * 1024;

/**
 * ⛔ **ⓑ `T-340` — ההודעה נוקבת ב**שורה הארוכה ביותר**, ⛔ ולא רק בגודל הקובץ.**
 * 🔬 נמדד C-0595: שורת היומן של `C-0594` הייתה **2,307 בתים** מתוך 12,288 ושורת
 * `C-0593` **2,143** ⇒ **שתי שורות לבדן החזיקו ~36% מהתקרה**. ⛔ «עברת את התקרה»
 * לבדו שלח את הטיק הבא לחפש ידנית מה תפח — חמש פעמים (`F-182` · `F-211` ·
 * `F-245`). ⇒ מספר השורה ואורכה הם ההפרש בין «יש בעיה» ל«זו השורה».
 */
export function longestLineOf(text) {
  const lines = text.split('\n');
  let at1 = 0;
  let bytes = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const n = Buffer.byteLength(lines[i], 'utf8');
    if (n > bytes) { bytes = n; at1 = i + 1; }
  }
  return { line: at1, bytes };
}

check('9', 'רגיסטר הבקרה מתחת לתקרת ה-12KB', () => {
  const text = read(at('plan', '00-control.md'));
  const bytes = Buffer.byteLength(text, 'utf8');
  if (bytes === 0) return { ok: false, detail: '⛔ לא נמדד — הקובץ ריק או חסר' };
  if (bytes <= CONTROL_CEILING) return { ok: true, detail: `${bytes} בתים מתוך ${CONTROL_CEILING}` };
  const worst = longestLineOf(text);
  return {
    ok: false,
    detail:
      `${bytes} בתים מתוך ${CONTROL_CEILING} · הארוכה ביותר: שורה ${worst.line} · ${worst.bytes} בתים` +
      ' ⇐ `npm run gc:memory` גוזם תא «סיבת ההעברה» שחצה',
  };
});

/* 6 — a plan no row cites is a plan the next PM rewrites from scratch. */
/**
 * ⛔ **EVERY register counts, ⛔ not only `50-tasks.md`** — and that widening is a
 * correction, ⛔ not a relaxation. The harm this check names is «an orphan plan
 * gets rewritten from scratch by the next PM», and a plan that a FINDING row cites
 * is just as findable as one a task row cites. Measured on 24/08: of the 8 plans
 * the task-only version called orphans, **4 were already cited** — in
 * `60-findings.md` and `26-plan-feedback.md`. ⇒ the task-only version was reporting
 * bookkeeping, ⛔ not risk, and a checker that cries wolf is a checker agents learn
 * to ignore. The four that were genuinely unreachable got their citation instead.
 */
check('6', 'כל תוכנית מצוטטת ברשם כלשהו', () => {
  const dir = at('docs', 'superpowers', 'plans');
  const registers = readdirSync(at('plan'))
    .filter((n) => n.endsWith('.md'))
    .map((n) => read(at('plan', n)))
    .join('\n');
  const orphans = readdirSync(dir)
    .filter((n) => n.endsWith('.md'))
    .filter((n) => !registers.includes(n));
  return { ok: orphans.length === 0, detail: `${orphans.length} יתומות`, items: orphans };
});

/**
 * 10 — ⛔ **QA STOPPED MERGING AND NOBODY NOTICED.** `work/current` is a long-lived
 * branch by design (RULES § 0.23), and the failure mode of a long-lived branch is
 * ⛔ not a conflict — it is **silence**: the gate goes red one day, QA files a
 * finding, and nothing merges for a week while DEV keeps piling commits onto a
 * branch no learner will ever see. ⇒ distance from `dev` is the one number that
 * makes that visible on the day it starts.
 *
 * ⛔ **Measured with `git`, ⛔ never with a register claim** — a register can say
 * "merged" while the branch says otherwise, and that is exactly the lie this check
 * exists to catch. ⚠️ The branch may not exist yet (it is created in phase 2) and
 * the remote may be unreachable from a sandbox; both are reported as **⛔ not
 * measured**, ⛔ never as "ok". A check that passes because it could not run is a
 * check that lies.
 */
const MAX_COMMITS_AHEAD = 40;
check('10', 'work/current ⛔ אינו רחוק מדי מ-dev', () => {
  const git = (...args) => {
    try {
      return execFileSync('./scripts/g', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return null;
    }
  };
  const head = git('rev-parse', '--verify', 'refs/remotes/origin/work/current');
  if (head === null) {
    return { ok: false, detail: '⛔ לא נמדד — הענף origin/work/current אינו נגיש' };
  }
  /**
   * ⛔ **BOTH DIRECTIONS, and the second one is ⛔ not symmetry for its own sake.**
   * AHEAD means QA stopped merging. **BEHIND means something pushed straight to
   * `dev` and bypassed the gate entirely** — which is the worse failure, because
   * the branch then rebases over work nobody reviewed. Measured 24/08: one agent
   * still carried a prompt that pushed to `dev`, and an ahead-only check would
   * have reported "ok" the whole time.
   */
  const counts = git('rev-list', '--left-right', '--count', 'origin/dev...origin/work/current');
  const pair = /^(\d+)\s+(\d+)$/.exec(counts ?? '');
  if (pair === null) {
    return { ok: false, detail: '⛔ לא נמדד — rev-list נכשל' };
  }
  const behind = Number(pair[1]);
  const ahead = Number(pair[2]);
  const items = [];
  if (ahead > MAX_COMMITS_AHEAD) items.push(`⛔ ${ahead} לפני dev — QA הפסיק למזג`);
  if (behind > 0) items.push(`⛔ ${behind} מאחורי dev — משהו נדחף ל-dev ועקף את השער`);
  return {
    ok: items.length === 0,
    detail: `${ahead} לפני · ${behind} אחרי (תקרה ${MAX_COMMITS_AHEAD} לפני · 0 אחרי)`,
    items,
  };
});

/**
 * ⛔ **HELPER FOR CHECK 11 — F-169.** A row can open `⬜` (the first glyph wins,
 * `taskState` below) and still name itself blocked **in the same cell**:
 * `T-220` read «ⓐ ו-ⓓ ⛔ נשארות ⬜, חסומות ב-F-164». ⛔ There is ⛔ no `חסם:`
 * marker on that prose, so `citedTasks`/`staleTaskBlocks` cannot see it either
 * — and `balance()` below reads only the FINISHED NUMBER out of
 * `docs/plan-open.md`, ⛔ never the cell text behind it. ⇒ this reads the raw
 * task register directly and names every row the generated count still calls
 * "open" that the row's own status cell already calls blocked. ⛔ Not a second
 * classification system — the threshold is exactly the substring already
 * sitting in the cell, per F-169's own fix direction.
 */
const textuallyBlockedOpenTasks = (names) => {
  const out = [];
  for (const line of rows(read(at('plan', '50-tasks.md')), 'T')) {
    const tags = taskCell(line, TASK_MILESTONE_INDEX)
      .split('·')
      .map((s) => s.trim());
    if (!names.some((n) => tags.includes(n))) continue;
    if (taskState(line) !== '⬜') continue;
    if (taskCell(line, TASK_STATUS_INDEX).includes('חסומ')) out.push(idOf(line));
  }
  return out;
};

/**
 * 11 — ⛔ **THE ACTIVE WORKSTREAM RAN DRY AND NOBODY MOVED IT.**
 * ‏DEV takes work **only** from `ACTIVE_WORKSTREAM`. When that workstream has no
 * open row left, every DEV tick until QA moves the focus is a **clone, a prompt
 * read, and ⛔ zero output**. Measured 26/08 on the loop's first night: `story`
 * emptied at 05:29, DEV recorded it dry at 07:03, and the field still said
 * `story` — with DEV due to fire twice more before QA's next tick.
 * ⇒ this is the one check that measures **wasted ticks**, ⛔ not correctness.
 * ⚠️ Advisory like every check here. ⛔ It must not block a merge — an idle loop
 * is ⛔ not broken code.
 */
check('11', 'לזרימה הפעילה יש עבודה פנויה', () => {
  const control = read(at('plan', '00-control.md'));
  const active = /^ACTIVE_WORKSTREAM:\s*(\S+)/m.exec(control)?.[1];
  if (active === undefined) {
    return { ok: false, detail: '⛔ לא נמדד — ⛔ אין ACTIVE_WORKSTREAM ב-00-control' };
  }
  const table = balance();
  /**
   * ⛔ **A CROSS-CUTTING FOCUS IS MEASURED ACROSS ITS WHOLE SET, ⛔ NOT ON ONE ROW.**
   * `ACTIVE_WORKSTREAM: general` makes `general` ∪ `loop` ∪ `base` eligible (`D-174`),
   * so counting only the `general` row would report «dry» while 25 rows sit open two
   * lines below it — the same silent-zero this check exists to catch.
   */
  const names = CROSS_CUTTING.has(active) ? [...CROSS_CUTTING] : [active];
  const rows_ = table.filter((w) => names.includes(w.name));
  if (rows_.length === 0) {
    return { ok: false, detail: `⛔ לא נמדד — \`${active}\` ⛔ אינו בטבלת המאזן` };
  }
  if (rows_.some((w) => !Number.isFinite(w.open))) {
    return { ok: false, detail: '⛔ לא נמדד — עמודת ⬜ ⛔ אינה מספר' };
  }
  const countedOpen = rows_.reduce((n, w) => n + w.open, 0);
  const textBlocked = textuallyBlockedOpenTasks(names);
  const open = Math.max(0, countedOpen - textBlocked.length);
  const how = CROSS_CUTTING.has(active) ? `${active} (חוצה-מערכת: ${names.join(' · ')})` : active;
  const caveat = textBlocked.length > 0 ? ` (F-169: ${textBlocked.length} מסומנות ⬜ אך חסומות בתא — ${textBlocked.join(' · ')})` : '';

  /**
   * 🟠 **⟦NEW 14/09 · `F-252`⟧ AND THE ACTIVE WORKSTREAM IS ⛔ ALSO MEASURED ON ITS OWN.**
   *
   * ⛔ **Why this is a second number and ⛔ not a rewrite of the first.** The union above is
   * correct for «⛔ is DEV starved?» — while the focus is `general`, DEV may genuinely take
   * `loop` and `base` rows. ⛔ But it is the ⛔ WRONG number for «⛔ should the focus move?»:
   * `§ 0.23 ז׳` says QA moves the focus when the workstream is **exhausted**, and `QA.md`
   * defines exhausted as **⛔ ZERO ⬜ rows** — of the workstream itself.
   *
   * 🔬 **Measured 14/09 (`F-252`), and this is the whole bug:** `general` sat at ⬜=0 three
   * separate times in 19 hours while the union held 7–12 rows ⇒ this check stayed green
   * every time, `docs/plan-open.md` could ⛔ not emit its 🔴 flag for a cross-cutting focus,
   * and so **⛔ nothing in QA's tick ever raised the question.** The focus has ⛔ not moved
   * since 13/09 14:04Z, and the two `cards` rows Roy asked for sat outside the pool.
   *
   * ⇒ 🟠, ⛔ never 🔴: DEV is ⛔ not starved, so this ⛔ must not read as an emergency. It is
   * addressed to QA, and `QA.md STEP 5.8` is where it is answered.
   */
  const selfRow = table.find((w) => w.name === active);
  const selfOpen = selfRow && Number.isFinite(selfRow.open) ? selfRow.open : null;

  /**
   * 🔴 **⟦REWRITTEN 15/09 · `C-0625` · `F-261`⟧ AND THE CONDITION WAS THE BUG.**
   *
   * ‏`F-252` asked «is `general` ITSELF empty?» — and 🔬 **measured on this clone, that
   * question can ⛔ never become true**, because `general` is exactly where PM opens its
   * rows. ⇒ every PM tick refills the one field whose emptiness was the only exit:
   * ```
   * general selfOpen = 1        ⇒ ⛔ no alarm
   * pool (general∪loop∪base)=7  ⇒ DEV ⛔ never advances (§ 0.23 ז׳ ③: >0 ⇒ stay)
   * 36 § 13 sequence            = 12 ⬜ across amirnet · story · cards · arena · msgs
   *                             ⇒ ⛔ UNREACHABLE, and the focus has read `general`
   *                               since 31/08 — two weeks.
   * ```
   * ⇒ **the question that matters is ⛔ not «is the waiting room empty» but «is anyone
   * still waiting outside».** `general` is step ⑤ of `§ 0.23 ז׳` — the answer ⛔ only when
   * the sequence has nothing — so a non-empty sequence is itself the signal.
   */
  const sequenceOpen = table
    .filter((w) => !CROSS_CUTTING.has(w.name) && Number.isFinite(w.open))
    .reduce((n, w) => n + w.open, 0);
  const stranded = CROSS_CUTTING.has(active) && sequenceOpen > 0;
  const focusDry = CROSS_CUTTING.has(active) && selfOpen === 0 && open > 0;

  /**
   * ⛔ **⛔ NOT a second `ok`, and ⛔ not a `soft` window — an ITEM.** `check()` carries
   * exactly one boolean, and ` warn ` in the report comes ⛔ only from `softUntil`, which
   * is a DATE mechanism and would expire. This finding ⛔ never expires. ⇒ it rides in
   * `items`, the same channel check 17 uses for «alive, ⛔ but ⛔ without the marker».
   */
  const items = stranded
    ? [
        `🟠 המוקד \`${active}\` הוא **חדר המתנה**, ⛔ ולא מחלקה — ולרצף \`36 § 13\` יש **${sequenceOpen}** ⬜ שאיש ⛔ אינו יכול לגעת בהן.`,
        `⇒ **הפרוסה חייבת לחזור לרצף** (\`§ 0.23 ז׳\` — ⑤ הוא התשובה **רק** כשלרצף ⛔ אין דבר). הרשימה המסודרת ⇒ \`docs/plan-open.md\`.`,
        `⚠️ ⛔ **ו⛔ זה ⛔ אינו «DEV רעב»** — הבריכה מחזיקה ${open} ⬜ ⇒ ⛔ אין חירום. מה שיש הוא **עבודה בלתי-נראית**. ⛔ שתיקה ⛔ אינה אפשרות (\`F-252\` · \`F-261\`).`,
      ]
    : focusDry
      ? [
          `🟠 \`${active}\` **עצמה** ⬜=0 — הבריכה מחזיקה ${open} ⇒ DEV ⛔ אינו רעב, ⛔ אבל תנאי המיצוי של \`§ 0.23 ז׳\` **מתקיים**.`,
          `⇒ **QA מכריע ב-STEP 5.8** — מזיז את המוקד, או כותב שורה למה ⛔ לא. ⛔ שתיקה ⛔ אינה אפשרות (\`F-252\`).`,
        ]
      : [];

  return {
    ok: open > 0,
    items,
    detail:
      open > 0
        ? `${how} — ${open} משימות ⬜${caveat}`
        : `⛔ ${how} מוצתה — כל טיק DEV עד שהמיקוד יוזז הוא טיק ריק${caveat}`,
  };
});

/* 7 — the DEV→PM lane only works if the PM actually learns. ⛔ No invented
 * threshold: the same missing element on two open rows IS the PM not learning,
 * which RULES § 0.6ג already calls a 🟡 finding.
 * ⛔ THE `u` FLAG ON `/[⬜🔵]/` IS LOAD-BEARING (T-213) — same bug class as
 * `CLOSED_GLYPH` just above: without it, a CLOSED row whose status text merely
 * names a 🔴/🟠/🟡/🟣/🚫/🔧 finding matches the leading surrogate and is
 * double-counted as open, failing a PM that repeated nothing. */
check('7', 'אף חסר בתוכנית אינו חוזר פעמיים', () => {
  const seen = new Map();
  for (const line of read(at('plan', '26-plan-feedback.md')).split('\n')) {
    if (!/^\| C-\d{4} *\|/.test(line)) continue;
    if (!/[⬜🔵]/u.test(line.split('|').slice(-2).join('|'))) continue;
    for (const key of line.match(/`(tasks|files|interfaces|tests|steps|addressed|verify|render|finish)`/g) ?? [])
      seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const repeats = [...seen].filter(([, n]) => n > 1).map(([k, n]) => `${k} × ${n}`);
  return { ok: repeats.length === 0, detail: `${repeats.length} חוזרים`, items: repeats };
});

/* 8 — a generated index that drifted from its input is an index that lies, and
 * every agent now reads the index instead of the registers. */
check('8', 'הצילומים הנגזרים זהים להרצה טרייה', () => {
  const out = mkdtempSync(join(tmpdir(), 'loop-health-'));
  // ⛔ cwd: ROOT — the generator reads plan/ relative to where it runs, so a
  // fixture root must move the generator too, ⛔ not only the reader.
  execFileSync('node', [join(process.cwd(), 'scripts', 'measure-plan-tables.mjs')], {
    cwd: ROOT,
    env: {
      ...process.env,
      PLAN_TABLES_OUT: join(out, 'tables.md'),
      PLAN_OPEN_OUT: join(out, 'open.md'),
    },
    stdio: 'pipe',
  });
  const drifted = [
    [at('docs', 'plan-tables.md'), join(out, 'tables.md')],
    [at('docs', 'plan-open.md'), join(out, 'open.md')],
  ]
    .filter(([committed, fresh]) => read(committed) !== read(fresh))
    .map(([committed]) => committed);
  return { ok: drifted.length === 0, detail: `${drifted.length} סטו`, items: drifted };
});

/**
 * 12 — ⛔ **THE PM BLOCKS HIMSELF, AND ⛔ NOTHING IN THE LOOP MEASURED IT.**  ⟦D-147⟧
 * Measured 30/08: **87 open findings**, most of them PM-owned, and six of them —
 * F-140 · F-142 · F-143 · F-144 · F-164 · F-167 — sit behind task rows that are
 * ALREADY WRITTEN and ⛔ cannot start. ⇒ the queue is ⛔ not short of work; it is
 * short of **decisions**, and a decision has ⛔ no other owner.
 *
 * ⚠️ **AND THE HONEST LIMIT, stated rather than faked:** `RULES § 0.6` writes the
 * rule as «open more than 3 days». ⛔ A finding row carries a CYCLE id (`C-XXXX`),
 * ⛔ not a date — there is ⛔ no date on it to subtract from. ⇒ this check measures
 * **existence**, ⛔ not age, and the 3 days live in `softUntil` below instead.
 * ⛔ Inventing a date from the cycle id would be a measurement that looks precise
 * and is guessed, which is worse than the honest version.
 */
const PM_OWNED = /→\s*\*\*PM\*\*|בבעלות PM|→\s*PM\b/;
check(
  '12',
  'אין ממצא בבעלות PM שחוסם שורה כתובה',
  () => {
    const findings = rows(read(at('plan', '60-findings.md')), 'F');
    const open = findings.filter((l) => !isClosed(l) && PM_OWNED.test(l)).map(idOf);
    if (open.length === 0) return { ok: true, detail: '⛔ אין ממצא PM פתוח' };
    // ⛔ «Blocks a row» is measured on the TASK register, ⛔ not asserted by the
    // finding: a ⛔ row that names the finding is the row that cannot start.
    const tasks = rows(read(at('plan', '50-tasks.md')), 'T').filter(taskOpen);
    const blocking = [];
    for (const id of open) {
      const held = tasks.filter((l) => taskBlocked(l) && new RegExp(`\\b${id}\\b`).test(l)).map(idOf);
      if (held.length > 0) blocking.push(`${id} → חוסם ${held.join(' · ')}`);
    }
    return {
      ok: blocking.length === 0,
      detail: `${blocking.length} מתוך ${open.length} ממצאי PM פתוחים חוסמים שורה`,
      items: blocking,
    };
  },
);

/**
 * 13 — ⛔ **A WORKSTREAM THE SEQUENCE MOVED PAST AND ⛔ NOBODY WROTE DOWN WHAT WAS
 * LEFT BEHIND.**  ⟦D-145⟧
 * `36 § 13` is one-way. `story` left 5 ⛔ rows whose release condition is «when
 * `story` is active again» — a condition the sequence ⛔ cannot produce. `cards`
 * moved without seal ⓐ with four open PM findings behind it. ⇒ without a row in
 * `plan/61-deferred.md`, the PM in 🩺 IMPROVE has ⛔ nothing to read, and an
 * improvement he re-derives each tick is an improvement he **invents** (lesson 10).
 *
 * ⚠️ **WHY «MOVED PAST», ⛔ NOT «carries three seals».** The seals are prose inside
 * `plan/36-video-spec.md` and `plan/archive/control-log.md`, and two of the three
 * sealed workstreams have theirs in the ARCHIVE — parsing them would be guessing at
 * free text in a file this script ⛔ must not depend on. **Position in the build
 * order is the same fact, and it is generated:** a workstream earlier in `36 § 13`
 * than `ACTIVE_WORKSTREAM` is one the loop has already left. ⛔ Stated here rather
 * than hidden, because a checker that quietly measures something other than its
 * title is the lie this whole file exists against.
 */
check(
  '13',
  'לכל זרימה שהרצף עבר אותה יש שורה ב-61-deferred',
  () => {
    const active = activeWorkstream();
    const table = balance();
    if (active === undefined || table.length === 0) {
      return { ok: false, detail: '⛔ לא נמדד — אין ACTIVE_WORKSTREAM או אין טבלת מאזן' };
    }
    const anchor = sequenceAnchor(table, active);
    const here = anchor.row;
    if (here === undefined) {
      return { ok: false, detail: anchor.why ?? `⛔ לא נמדד — \`${active}\` ⛔ אינו בטבלת המאזן` };
    }
    const deferred = read(at('plan', '61-deferred.md'));
    if (deferred === '') return { ok: false, detail: '⛔ לא נמדד — plan/61-deferred.md חסר' };
    const missing = table
      // ⛔ `order === null` is the cross-cutting set. ⛔ `null < 5` is TRUE in JS — this
      // guard is the whole reason the three of them ⛔ do not silently read as «passed».
      .filter((w) => w.order !== null && w.order < here.order)
      .filter((w) => !new RegExp(`^\\|\\s*\`${w.name}\``, 'm').test(deferred))
      .map((w) => `${w.name} — נחתמה/הוזזה ⛔ בלי שורת חוב`);
    return {
      ok: missing.length === 0,
      detail: `${missing.length} חסרות מתוך ${here.order - 1} שהרצף עבר`,
      items: missing,
    };
  },
);

/**
 * 14 — ⛔ **`IMPROVE_TARGET` IS ONE FIELD AWAY FROM BEING A SECOND ACTIVE
 * WORKSTREAM.**  ⟦D-146⟧
 * The single-active-workstream rule is what stops the product becoming five
 * half-built screens. 🩺 IMPROVE opens rows OUTSIDE that workstream — so the five
 * fences are ⛔ not decoration, they are the entire reason the mode is safe. This
 * check measures the two that can be measured from the registers: the target is a
 * workstream the sequence has already passed, and it holds **at most two** rows.
 * ⚠️ Empty field = the mode is OFF, and that is a PASS, ⛔ not a gap.
 */
/**
 * ⛔ **CHECK 14's CEILING MUST COUNT `שיפור` ROWS ONLY, ⛔ NOT EVERY OPEN ROW IN THE
 * TARGET WORKSTREAM.**  ⟦T-255 · D-190 § 1.3⟧
 * `there.open` (from `balance()`, i.e. `docs/plan-open.md`) counts every open row in
 * the target's build-order slot — including ordinary feature/infra rows that predate
 * 🩺 IMPROVE and have nothing to do with it. Measured 2026-09-04: pointing
 * `IMPROVE_TARGET` at `story` failed on 3 pre-existing ⬜ rows against a ceiling of 2,
 * blocking the mode from ever turning on. ⇒ this reads `plan/50-tasks.md` directly
 * (same technique as `workTypeMix` below) and counts only rows carrying the
 * `שיפור` tag — the tag PM/Roy write by hand (RULES § IMPROVE fence 6), ⛔ never DEV.
 */
const IMPROVE_ROW_TAG = 'שיפור';
const improveTaggedOpenCount = (target) =>
  rows(read(at('plan', '50-tasks.md')), 'T').filter((line) => {
    const tags = taskCell(line, TASK_MILESTONE_INDEX)
      .split('·')
      .map((t) => t.trim());
    return tags.includes(target) && tags.includes(IMPROVE_ROW_TAG) && taskOpen(line);
  }).length;

const IMPROVE_ROW_CEILING = 2;
check(
  '14',
  'IMPROVE_TARGET מצביע על זרימה חתומה ומחזיק ≤2 שורות מתויגות שיפור',
  () => {
    const control = read(at('plan', '00-control.md'));
    const m = /^IMPROVE_TARGET:\s*"?([^"\s#]*)"?/m.exec(control);
    if (m === null) return { ok: false, detail: '⛔ לא נמדד — ⛔ אין IMPROVE_TARGET ב-00-control' };
    const target = (m[1] ?? '').trim();
    if (target === '') return { ok: true, detail: 'ריק — המצב כבוי' };
    const active = activeWorkstream();
    const table = balance();
    const here = sequenceAnchor(table, active).row;
    const there = table.find((w) => w.name === target);
    if (here === undefined || there === undefined) {
      return { ok: false, detail: `⛔ לא נמדד — \`${target}\` או \`${active}\` ⛔ אינם בטבלת המאזן` };
    }
    const items = [];
    if (there.order >= here.order) {
      items.push(`⛔ \`${target}\` ⛔ אינה זרימה שהרצף עבר — זו זרימה פעילה שנייה בדלת האחורית`);
    }
    if (!new RegExp(`^\\|\\s*\`${target}\``, 'm').test(read(at('plan', '61-deferred.md')))) {
      items.push(`⛔ \`${target}\` ⛔ אינה ב-61-deferred ⇒ ⛔ אין ממה לצטט (D-144ⓑ)`);
    }
    const tagged = improveTaggedOpenCount(target);
    if (tagged > IMPROVE_ROW_CEILING) {
      items.push(
        `⛔ ${tagged} שורות \`${IMPROVE_ROW_TAG}\` פתוחות ב-\`${target}\` — התקרה ${IMPROVE_ROW_CEILING}`,
      );
    }
    return {
      ok: items.length === 0,
      detail: `יעד \`${target}\` · ${tagged} ⬜ מתויגות ${IMPROVE_ROW_TAG}`,
      items,
    };
  },
);

/**
 * 15 — ⛔ **`ACTIVE_TASK_ID` SHAPE GATE.**  ⟦T-260 · D-190 § 1.2, option ⓑ⟧
 * The field moved from a single string to a queue of at most 3 `T-xxx` ids so
 * PM/QA can promote more than one row without DEV getting stuck on a row that
 * lands out of order (measured failure כ-2, `2026-09-05-improvement-plan.md`
 * § 1.2: the field sat on an already-delivered row for 5 straight build ticks
 * because `docs/agents/DEV.md` STEP 2 forbids DEV from writing it, and nothing
 * else touched it either). ⛔ This check does NOT enforce who wrote the field —
 * that is `plan/RULES.md § 0.28`, a prose invariant no script can see. It only
 * protects the field's SHAPE: an unparseable or oversized queue is a defect a
 * script would otherwise fail on silently (an agent's own ad-hoc parse of a
 * malformed line is undefined behaviour, not a graceful skip).
 */
const ACTIVE_TASK_ID_CEILING = 3;
check('15', 'ACTIVE_TASK_ID תקין — רשימה של עד 3 מזהים תקפים, או ריקה', () => {
  const control = read(at('plan', '00-control.md'));
  const m = /^ACTIVE_TASK_ID:\s*(\[[^\]]*\])\s*(?:#.*)?$/m.exec(control);
  if (m === null) {
    return { ok: false, detail: '⛔ לא נמדד — אין שורת ACTIVE_TASK_ID בפורמט הצפוי ([]-)' };
  }
  const inner = m[1].slice(1, -1).trim();
  const ids = inner === '' ? [] : inner.split(',').map((s) => s.trim());
  const items = [];
  if (ids.length > ACTIVE_TASK_ID_CEILING) {
    items.push(`⛔ ${ids.length} מזהים — התקרה ${ACTIVE_TASK_ID_CEILING}`);
  }
  const bad = ids.filter((id) => !/^T-\d+$/.test(id));
  if (bad.length > 0) {
    items.push(`⛔ מזהים לא תקפים: ${bad.join(' · ')}`);
  }
  const seen = new Set();
  const dup = new Set();
  for (const id of ids) {
    if (seen.has(id)) dup.add(id);
    seen.add(id);
  }
  if (dup.size > 0) {
    items.push(`⛔ כפילות: ${[...dup].join(' · ')}`);
  }
  return { ok: items.length === 0, detail: `${ids.length}/${ACTIVE_TASK_ID_CEILING} מזהים`, items };
});

/**
 * 16 — ⛔ **הקומיטים האחרונים על הענף עברו `verify` — או ש⛔ אין לכך ראיה.**  ⟦NEW 06/09 · הכרעה 100 ⓑ⟧
 * ⛔ **הכשל שזה קיים נגדו, ⛔ ואינו תיאורטי:** עד 06/09 `npm run verify` היה **משפט
 * בארבעה קבצי פרומפט**. משפט ⛔ אינו שער: סוכן שדילג עליו, או שהריץ אותו וקרא את קוד
 * היציאה לא נכון, דחף בדיוק באותה קלות כמו סוכן שלא — והענף גילה זאת רק בטיק ה-QA
 * הבא, עד 12 שעות אחר כך.
 * ⇒ `scripts/hooks/pre-push` מריץ את `verify` וחוסם דחיפה אדומה, ורושם `git note`
 *   על כל ראש שנדחף. הבדיקה הזאת מודדת **שני דברים ⛔ ולא אחד**:
 *     ⓐ שה-hook בכלל **מותקן בשיבוט הזה** ו⛔ אינו גרסה ישנה — כי כל טיק הוא שיבוט
 *       חדש, ו-hook שלא הועתק פנימה הוא hook שאינו קיים;
 *     ⓑ שראש `origin/work/current` נושא הערת `verify`.
 * ⚠️ **⛔ הבדיקה ⛔ אינה מתקנת את מה שהיא מודדת** — היא ⛔ לעולם אינה מתקינה את ה-hook.
 *    בודק שמתקן מה שהוא מודד יכול רק לדווח «ok».
 * ⚠️ **רכה עד `2026-09-13`** לפי הכלל שכתוב בראש הקובץ: ההיסטוריה שקדמה ל-hook ⛔ אינה
 *    יכולה לשאת הערה, וצבע אדום ביום הנחיתה מלמד כל סוכן שאדום הוא הצבע הרגיל.
 */
const VERIFY_NOTES_REF = 'refs/notes/verify';
/**
 * ⛔ **⟦NEW 07/09⟧ THE SAME ATTESTATION, PUBLISHED UNDER A SECOND REF NAME.**
 *
 * 🔬 Measured live in Claude Code Remote, three consecutive attempts, same repo:
 * pushing `refs/notes/verify` dies in `send-pack` and leaves the remote UNCHANGED,
 * while the identical object pushed to `refs/heads/notes-verify` exits 0 first try.
 * ⇒ `refs/heads/*` is the **only** ref namespace that survives that runtime, so the
 * hook now publishes the notes commit under **both** names.
 *
 * ⛔ This is ⛔ NOT a second source of truth: it is the ⛔ same commit object, and the
 * mirror is fetched into a **separate local ref** precisely so a force-fetch of one
 * ⛔ can never clobber the other — the failure mode that makes an attestation that WAS
 * written look exactly like one that never was.
 */
const VERIFY_NOTES_MIRROR_REMOTE = 'refs/heads/notes-verify';
const VERIFY_NOTES_MIRROR_LOCAL = 'refs/notes/verify-mirror';
const VERIFY_NOTES_REMOTE_LOCAL = 'refs/notes/verify-remote';
check(
  '16',
  'ה-hook של verify מותקן · ראש הענף נושא הערת verify',
  () => {
    const git = (...args) => {
      try {
        return execFileSync('./scripts/g', args, {
          cwd: ROOT,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
      } catch {
        return null;
      }
    };
    const items = [];
    const parts = [];

    const state = hookState(ROOT);
    if (state.missing.length > 0) {
      items.push(`⛔ hook ⛔ אינו מותקן: ${state.missing.join(' · ')} ⇒ npm run hooks:install`);
    }
    if (state.stale.length > 0) {
      items.push(`⛔ hook ישן (⛔ אינו זהה למקור): ${state.stale.join(' · ')} ⇒ npm run hooks:install`);
    }
    parts.push(state.ok ? 'hook מותקן' : '⛔ hook חסר/ישן');

    const tip = git('rev-parse', '--verify', 'refs/remotes/origin/work/current');
    if (tip === null) {
      items.push('⛔ לא נמדד — origin/work/current אינו נגיש');
      parts.push('⛔ הערה לא נמדדה');
      return { ok: false, detail: parts.join(' · '), items };
    }
    /**
     * ⛔ ההערות ⛔ אינן מגיעות ב-clone רגיל — `refs/notes/*` אינו ב-refspec של origin.
     * ⇒ משיכה **מפורשת, שקטה, ובלתי-קטלנית**: כישלון שלה הוא «⛔ לא נמדד», ⛔ ולא «נכשל».
     */
    /**
     * 🔴 ⛔ **⟦FIXED 07/09⟧ THIS CHECK USED TO CORRUPT WHAT IT MEASURES.**
     * It force-fetched the remote into `refs/notes/verify` — **the very ref the
     * pre-push hook appends to.** In CCR the remote copy of that ref ⛔ can never be
     * updated (see above), so every run rolled the local ref back to a stale commit,
     * and the next hook appended onto a history the published ref ⛔ does not contain
     * ⇒ `! [rejected] (non-fast-forward)`, measured on `5c4586f`. ⛔ A checker that
     * writes to the thing it checks ⛔ is not a checker.
     * ⇒ both remote copies are now read into refs of their own, ⛔ and the hook's
     * working ref is ⛔ never written by this file.
     */
    git('fetch', '-q', 'origin', `+${VERIFY_NOTES_REF}:${VERIFY_NOTES_REMOTE_LOCAL}`);
    git('fetch', '-q', 'origin', `+${VERIFY_NOTES_MIRROR_REMOTE}:${VERIFY_NOTES_MIRROR_LOCAL}`);
    // ⛔ Either name is the same evidence ⇒ either one satisfies the check.
    const note =
      git('notes', `--ref=${VERIFY_NOTES_MIRROR_LOCAL}`, 'show', tip) ??
      git('notes', `--ref=${VERIFY_NOTES_REMOTE_LOCAL}`, 'show', tip) ??
      git('notes', `--ref=${VERIFY_NOTES_REF}`, 'show', tip);
    if (note === null) {
      items.push(`⛔ אין הערת verify על ${tip.slice(0, 7)} — הראש נדחף בלי הראיה (⛔ לא תחת refs/notes/verify ו⛔ לא תחת ${VERIFY_NOTES_MIRROR_REMOTE})`);
      parts.push('⛔ ראש ללא הערה');
    } else {
      parts.push(`ראש ${tip.slice(0, 7)} מאושר: ${note.split('\n')[0]}`);
    }
    return { ok: items.length === 0, detail: parts.join(' · '), items };
  },
  '2026-09-13',
);

/**
 * 17 — ⛔ **סוכן דלוק שלא הפיק קומיט מעל 24 שעות.**  ⟦NEW 06/09 · הכרעה 101 ⓒ⟧
 * ⛔ **נמדד, ⛔ לא משוער:** בין **04/09 19:12Z** ל-**06/09 11:00Z** שבעה חלונות QA
 * רצופים הפיקו **⛔ אפס קומיטים**, ו⛔ שום דבר בשום מקום לא אמר למה. הנסיגה השקטה
 * («lock < 30 min ⇒ exit silently») נראית מבחוץ **בדיוק כמו לופ מת**, והיא נשארה
 * בלתי-נראית **40 שעות**. בדיקה 10 אכן האדימה — ⛔ אבל על הסימפטום (41 קומיטים לפני
 * `dev`), ⛔ לא על הסיבה.
 * ⇒ זה המונה שמודד **שתיקה**, ⛔ ולא נכונות. מקורו `git log` על `origin/work/current`,
 *   ⛔ ולא מונה פנימי — מונה בזיכרון הסקריפט סוטה ברגע שמישהו כותב היסטוריה מחדש.
 * ⚠️ הרשימה של מי דלוק חיה ב-`docs/agents/roster.json`, כי מצב המשימות המתוזמנות יושב
 *    בשרת ⛔ ולא בריפו (`RULES § 0.23ח`) — ⇒ הצהרה שאפשר לקרוא, לבדוק ולסקור.
 * ⚠️ **רכה עד `2026-09-13`**, מאותה סיבה שכתובה בראש הקובץ.
 */
const SILENCE_LOOKBACK_COMMITS = 400;
/**
 * 📓 **שורת היומן — הקומיט שאומר «רצתי, ⛔ ולא הייתה עבודה, וזאת הסיבה».**  ⟦NEW 08/09 · `T-280`⟧
 *
 * ‏`RULES § 0.29 ו׳` מחייב אותה מכל חמשת הסוכנים, בצורה:
 * ```
 * loop(<AGENT>): <cycle> idle — <the reason, in one line>
 * ```
 * ⇒ התחילית ⛔ אינה משתנה, ולכן ההתאמה ב-`commitPrefix` ממשיכה לעבוד כמו שהיא;
 * מה שנוסף הוא **הסמן שמבדיל בין «חי» ל«עבד»**.
 */
const IDLE_SUBJECT = /\bidle\b\s*(?:—|--|-|:)\s*\S/;
check(
  '17',
  'כל סוכן דלוק הפיק קומיט ב-24 השעות האחרונות',
  () => {
    const git = (...args) => {
      try {
        return execFileSync('./scripts/g', args, {
          cwd: ROOT,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        });
      } catch {
        return null;
      }
    };
    const rosterRaw = read(at('docs', 'agents', 'roster.json'));
    if (rosterRaw === '') {
      return { ok: false, notMeasured: true, detail: '⛔ לא נמדד — docs/agents/roster.json חסר' };
    }
    const roster = JSON.parse(rosterRaw);
    const active = (roster.agents ?? []).filter((a) => a.enabled === true);
    if (active.length === 0) {
      return { ok: true, detail: '⛔ אף סוכן ⛔ אינו דלוק ברשימה — ⛔ אין מה למדוד' };
    }
    const log = git(
      'log',
      'origin/work/current',
      '--format=%x1e%ct%x1f%s',
      '--name-only',
      `-${SILENCE_LOOKBACK_COMMITS}`,
    );
    if (log === null) {
      return {
        ok: false,
        notMeasured: true,
        detail:
          '⛔ לא נמדד — git log על origin/work/current נכשל (הרף ⛔ אינו בקלון? `./scripts/g fetch origin work/current`)',
      };
    }
    /**
     * 🔴 ⛔ **THE DIFF DECIDES, ⛔ NOT THE WORDING.**  ⟦NEW 08/09⟧
     *
     * 🔬 **Measured the same evening the marker was introduced.** CONTENT's `C-0512` did
     * ⛔ exactly what the rule asks — «closes that silence window with an honest *still
     * blocked, re-verified* trace instead of leaving the loop looking dead» — but in its
     * own shape: it wrote to `plan/archive/handoff-log.md`, and its subject was
     * `«same ingest-cap block re-verified, zero content pushed»`, which carries ⛔ no
     * `idle` marker. ⇒ classifying by SUBJECT read it as a **work commit: green, while
     * the agent was blocked.** ⛔ That is the false green this check exists against.
     * ⛔ **⛔ And it was ⛔ not a violation** — that tick ran the old prompt. It is proof
     * that a convention ⛔ nothing enforces is a convention agents will each reinvent.
     *
     * ⇒ a commit that changed ⛔ NOTHING but bookkeeping paths is an idle tick **whatever
     * it is called**, and the marker becomes a separate, reportable expectation (below).
     */
    const BOOKKEEPING_ONLY = (files) =>
      files.length > 0 &&
      files.every(
        (f) =>
          f === 'plan/00-control.md' ||
          f.startsWith('plan/archive/') ||
          /^docs\/plan-[a-z-]+\.md$/.test(f),
      );

    const commits = log
      .split('\x1e')
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const [head, ...rest] = block.split('\n');
        const [ts, subject] = head.split('\x1f');
        const files = rest.map((f) => f.trim()).filter(Boolean);
        return {
          ts: Number(ts),
          subject: subject ?? '',
          files,
          // ⛔ A merge carries no file list under --name-only. It is ⛔ never an idle tick,
          // and calling it one would hand every agent a free silence window.
          bookkeeping: BOOKKEEPING_ONLY(files),
        };
      });
    const nowSec = Math.floor(Date.now() / 1000);
    const items = [];
    const parts = [];
    /** ⛔ **רק שקט מוחלט מפיל את הבדיקה.** «חי ללא עבודה» מדווח ו⛔ אינו כישלון — אחרת
     *  סוכן שנחסם כדין וכתב למה, מלמד כל קורא ש-`FAIL` הוא הצבע הרגיל. */
    const silent = [];
    for (const a of active) {
      /**
       * 🔴 ⛔ **⟦FIXED 07/09⟧ ONE AGENT, TWO COMMIT PREFIXES — ⛔ and until today this
       * check could ⛔ not see QA at all.**
       *
       * 🔬 Measured on `origin/work/current`, 07/09: QA had written **16** commits under
       * `loop(QA` and **13** under `loop(CRITIC` since 05/09. The roster declared
       * `loop(CRITIC` alone ⇒ this check froze on the newest `loop(CRITIC` commit
       * (06-09 21:07Z) and reported «QA שותק 24.8 שעות» while QA was pushing every few
       * minutes. ⇒ **a live agent read as a dead one — `F-188` exactly, inverted.**
       *
       * ⚠️ And the inversion is ⛔ worse than a wrong number: the warning ⛔ can never
       * clear, so every agent that reads `loop:health` learns that «QA silent» is normal
       * noise — the same rot that an unmeasurable check 16 produced.
       *
       * ⇒ `commitPrefix` accepts a **string or an array**. The old shape keeps working
       * untouched; an agent whose name changed carries both, because the history holds both.
       */
      const prefixes = Array.isArray(a.commitPrefix) ? a.commitPrefix : [a.commitPrefix];
      const mine = commits.filter((c) => prefixes.some((p) => c.subject.startsWith(p)));
      const ceiling = a.maxSilentHours ?? 24;
      const newestAny = mine[0];
      // ⛔ עבודה = קומיט שנגע במשהו מעבר לניהול. הנוסח ⛔ אינו קובע — הדיף קובע.
      const newestWork = mine.find((c) => !c.bookkeeping);

      if (newestAny === undefined) {
        items.push(
          `🔴 ${a.name} — ⛔ אף קומיט ב-${commits.length} האחרונים, ⛔ ולא שורת יומן. ⛔ שקט מוחלט.`,
        );
        parts.push(`${a.name} 🔴`);
        silent.push(a.name);
        continue;
      }

      const workHours = newestWork === undefined ? Infinity : (nowSec - newestWork.ts) / 3600;
      if (workHours <= ceiling) {
        parts.push(`${a.name} ${workHours.toFixed(1)}ש׳`);
        continue;
      }

      // ⛔ ⛔ אין קומיט עבודה בחלון. השאלה היחידה שמשנה: האם הוא **בכלל רץ**, ואמר למה?
      const idleHours = (nowSec - newestAny.ts) / 3600;
      if (newestAny.bookkeeping && idleHours <= ceiling) {
        const noWork =
          workHours === Infinity ? `ב-${commits.length} האחרונים` : `${workHours.toFixed(1)} שעות`;
        if (IDLE_SUBJECT.test(newestAny.subject)) {
          parts.push(`${a.name} 🟡 ${idleHours.toFixed(1)}ש׳`);
          items.push(
            `🟡 ${a.name} חי ללא עבודה — ⛔ אפס קומיט עבודה ${noWork}, ` +
              `⛔ אבל שורת היומן שלו מלפני ${idleHours.toFixed(1)} שעות אומרת למה: ${newestAny.subject.slice(0, 90)}`,
          );
        } else {
          /**
           * 🟠 ⛔ **חי, ⛔ אבל בצורה שלו.** הדיף מוכיח שהטיק רץ ו⛔ לא עבד ⇒ ⛔ אינו מת,
           * ⛔ ולכן ⛔ אינו מפיל. ⛔ אבל הוא ⛔ לא נשא את הסמן ש-`§ 0.29 ו׳` קובעת, ⇒
           * **הסיבה ⛔ אינה ניתנת לקריאה** — וזו כל התועלת בשורת היומן. ⛔ בדיוק `C-0512`.
           */
          parts.push(`${a.name} 🟠 ${idleHours.toFixed(1)}ש׳`);
          items.push(
            `🟠 ${a.name} חי ללא עבודה, ⛔ אך ⛔ ללא הסמן המוצהר — ⛔ אפס קומיט עבודה ${noWork}. ` +
              `‏\`§ 0.29 ו׳\` דורשת \`loop(${a.name}): <cycle> idle — <הסיבה>\`, והקומיט האחרון הוא: ${newestAny.subject.slice(0, 80)}`,
          );
        }
        continue;
      }

      parts.push(`${a.name} 🔴 ${idleHours.toFixed(1)}ש׳`);
      items.push(
        `🔴 ${a.name} שותק ${idleHours.toFixed(1)} שעות (תקרה ${ceiling}) — ⛔ ולא הותיר שורת יומן. הקומיט האחרון: ${newestAny.subject.slice(0, 60)}`,
      );
      silent.push(a.name);
    }
    /**
     * 🔴 ⛔ **ALL OF THEM AT ONCE IS ⛔ NOT THE SAME DIAGNOSIS AS ONE OF THEM.**
     * ⟦NEW 09/09 · measured the morning it happened⟧
     *
     * One agent silent ⇒ that agent is stuck. **Every** enabled agent silent ⇒ the loop
     * itself is not running, and ⛔ nothing in this repository says so.
     *
     * 🔬 **Measured 09/09 09:03–09:06Z, ⛔ not hypothesised:** all six scheduled Routines
     * were switched off, one after another, ~30 seconds apart. From inside the repo that
     * is invisible: `PAUSED_BY_HUMAN` in `plan/00-control.md` still read `false`, every
     * register was clean, and `verify` was green. The loop had simply stopped, and the
     * ⛔ only readable symptom was five separate "agent is silent" lines that each
     * suggested five separate problems.
     *
     * ⇒ the check says the systemic thing when the systemic thing is true. ⛔ It ⛔ cannot
     * read the scheduler — that state lives on the server, ⛔ not in git (`RULES § 0.23ח`)
     * — so it names the two possibilities and ⛔ does not pick one it cannot measure.
     */
    if (silent.length > 0 && silent.length === active.length) {
      items.unshift(
        `🔴 **כל ${active.length} הסוכנים הדלוקים שותקים בבת אחת.** ⛔ זה ⛔ אינו ${active.length} תקלות נפרדות — ` +
          `זו תקלה אחת ברמת הלופ: או שהמשימות המתוזמנות כבויות/מושהות בשרת, או שכולן נכשלות באותה נקודה. ` +
          `⛔ מצב המתזמן ⛔ אינו בגיט (\`RULES § 0.23ח\`) ⇒ ⛔ אי אפשר להכריע מכאן — ` +
          `לבדוק את רשימת ה-Routines. ⚠️ ואם הלופ הושהה בכוונה, \`PAUSED_BY_HUMAN\` ב-\`plan/00-control.md\` ` +
          `אמור לומר זאת, והוא כרגע ⛔ אינו הערוץ שמשמש לכך.`,
      );
      /**
       * 🔴 ⛔ **AND IT REPORTS «⛔ לא נמדד», ⛔ NOT «FAIL» — ⟦09/09⟧ and the reason is
       * that a FAIL here would be a claim this checker ⛔ cannot support.**
       *
       * Every enabled agent silent at once has exactly two causes, and the difference
       * between them lives **on the scheduler**, ⛔ not in git (`RULES § 0.23ח`). One is
       * a defect. The other — the Routines switched off — is a **decision**, and it was
       * measured on 09/09: all six were disabled by their owner within four minutes.
       * ⇒ a checker that ⛔ cannot tell them apart must ⛔ not pick the accusing one.
       *
       * 🔴 **And the cost of getting this wrong is ⛔ concrete, ⛔ not theoretical.** This
       * check goes HARD on 2026-09-13. A paused loop would then redden `verify` in every
       * clone — including the very tick that restarts it — so the switch-off would have
       * armed a trap that fires days later and blocks its own undoing.
       *
       * ⚠️ **⛔ It is ⛔ not silence:** the systemic line above is printed either way, and
       * «⛔ לא נמדד» is ⛔ never «passed» — it is counted separately in the summary and
       * ⛔ never folded into the pass count.
       */
      return { ok: false, notMeasured: true, detail: parts.join(' · '), items };
    }
    return { ok: silent.length === 0, detail: parts.join(' · '), items };
  },
  '2026-09-13',
);

/**
 * 🔴 ⛔ **18 — עבודה שנתקעה על ענף התוצאה של הפלטפורמה.**  ⟦NEW 09/09 · `F-207`⟧
 *
 * 🔬 **נמדד חי 09/09, ⛔ לא שוער.** ב-`ls-remote` ישבו זה לצד זה:
 * ```
 * f6d227e  refs/heads/work/current
 * f6d227e  refs/heads/claude/english-web-architecture-ganiks
 * ```
 * ⇒ **שני רפרנסים, שני כותבים שונים, בשני זמנים שונים:**
 *   ⓐ ל-`work/current` כותב **הסוכן**, במפורש — `./scripts/g push origin work/current`,
 *     באמצע הטיק.
 *   ⓑ ל-`claude/<slug>` כותבת **הפלטפורמה** (CCR), אוטומטית **בסוף הסשן**, מתוך
 *     `session_request.config.outcomes[].git_info.branches`.
 *
 * 🔴 ⇒ **הכשל השקט:** אם הדחיפה של הסוכן נכשלה — non-ff, דחיית מסווג, או שפשוט
 * ⛔ לא נקראה — **הסשן עדיין נסגר בהצלחה**, והפלטפורמה **עדיין** דוחפת ל-`claude/<slug>`.
 * ⇒ העבודה קיימת ב-GitHub, על ענף ש⛔ אף אחד ⛔ לא קורא: ⛔ לא QA במיזוג, ⛔ לא בדיקה 10,
 * ⛔ ולא PROMOTER. **הטיק נראה ירוק והעבודה נעלמת.**
 *
 * ⚠️ **ולכן ⛔ אי אפשר לקודד רשימת ענפים:** השם נוצר מחדש בכל ריצה — נמדד ש-DEV הכריז
 * `claude/modest-galileo` ב-08/09 ו-`claude/sleepy-bell` ב-09/09. ⇒ הבדיקה מונה **תבנית**.
 *
 * ⇒ ה-fetch הוא refspec אחד לכל הענפים ⇒ **קריאת רשת אחת**, ⛔ לא אחת לענף.
 */
check(
  '18',
  '⛔ אין עבודה תקועה על ענף תוצאה של הפלטפורמה (`claude/*`)',
  () => {
    const git = (...args) => {
      try {
        return execFileSync('./scripts/g', args, {
          cwd: ROOT,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        });
      } catch {
        return null;
      }
    };
    // ⛔ קריאת רשת אחת שמביאה את כולם. נכשלה ⇒ ⛔ לא נמדד, ⛔ ולא «נקי».
    if (
      git('fetch', '-q', '--prune', 'origin', '+refs/heads/claude/*:refs/remotes/pf-outcome/*') ===
      null
    ) {
      return {
        ok: false,
        notMeasured: true,
        detail:
          '⛔ לא נמדד — fetch של refs/heads/claude/* נכשל (רשת? הרשאה?). ⛔ «לא נמדד» ⛔ אינו «נקי».',
      };
    }
    const refs = (git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/pf-outcome') ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (refs.length === 0) {
      return { ok: true, detail: '⛔ אין ענפי `claude/*` ברמוט — ⛔ אין מה לבדוק' };
    }
    // ⛔ בסיס ההשוואה הוא `work/current` — הענף שהלופ באמת קורא, ⛔ ולא `dev`.
    if (git('rev-parse', '--verify', '-q', 'origin/work/current') === null) {
      return {
        ok: false,
        notMeasured: true,
        detail: '⛔ לא נמדד — origin/work/current ⛔ אינו בקלון (`./scripts/g fetch origin work/current`)',
      };
    }
    const stranded = [];
    for (const ref of refs) {
      const n = Number((git('rev-list', '--count', `origin/work/current..${ref}`) ?? '').trim());
      if (Number.isFinite(n) && n > 0) {
        const tip = (git('log', '-1', '--format=%h %cI %s', ref) ?? '').trim().slice(0, 120);
        stranded.push(`${ref.replace('pf-outcome/', 'claude/')} — ${n} קומיטים ⛔ שאינם ב-work/current · ${tip}`);
      }
    }
    return stranded.length === 0
      ? { ok: true, detail: `${refs.length} ענפי \`claude/*\` — כולם מוכלים ב-work/current · 0 תקועים` }
      : {
          ok: false,
          detail: `⛔ ${stranded.length} מתוך ${refs.length} ענפי \`claude/*\` נושאים עבודה ש-work/current ⛔ אינו מכיר`,
          items: stranded,
        };
  },
);


/**
 * ⛔ **A REPORTED NUMBER, ⛔ NOT A CHECK.**  ⟦D-147 · the 4/1/1 mix⟧
 * The mix is a soft target and it ⛔ must not become a gate: cutting new slices in
 * half while DEV runs dry trades one problem for another. ⇒ this prints and ⛔ never
 * fails. ⛔ It is deliberately ⛔ not a `check()` — a number in the pass/fail column
 * is a number somebody will start optimising.
 */
/**
 * ⛔ **SOFT, PRINT-ONLY — MIRRORS `workTypeMix` BELOW, ⛔ NOT A NUMBERED CHECK.**  ⟦T-257 · D-190 § 3.3⟧
 * The failure this catches: all five feature workstreams (`story`/`nav`/`cards`/
 * `arena`/`studies`) measured ⬜=0 SIMULTANEOUSLY on 2026-09-05, the loop kept
 * spinning on `general`/`loop`/`base` (D-174, working as designed), and ⛔ no
 * counter anywhere showed that nobody had opened a new feature slice in days —
 * it looked exactly like a healthy loop. ⇒ this counts consecutive PM ticks
 * (commits whose subject starts with `loop(PM)`) since the last one that added
 * a new task row tagged with a feature workstream to `plan/50-tasks.md`.
 * ⚠️ Source is `git log` on `origin/dev` (ⓑ of the task row: "the source is
 * WORKSTREAM_TICKS and git log on loop(PM), not memory") — ⛔ never a running
 * total kept in this script's own memory across invocations, which would drift
 * the moment anyone force-pushed or rewrote history.
 * ⚠️ **Measured in this clone, 2026-09-06:** only checks 1–14 exist today —
 * the task row's own wording ("numbering 1–16 doesn't move") assumed a check
 * 15 that was never added. This line is print-only regardless, exactly as the
 * row's ⓐ requires, so the discrepancy doesn't change what gets built here —
 * recorded so the next reader doesn't re-derive it.
 */
const PM_COMMIT_PREFIX = 'loop(PM)';
const FEATURE_SLICE_LINE = /^\+\|\s*T-\d+\s*\|\s*M\d+\s*·\s*([a-z]+)\s*·/;
const PM_LOOKBACK_COMMITS = 30;
const pmTicksSinceLastSlice = () => {
  const git = (...args) => {
    try {
      return execFileSync('./scripts/g', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      return null;
    }
  };
  const featureNames = new Set(balance().filter((w) => w.order !== null).map((w) => w.name));
  const log = git('log', 'origin/dev', '--format=%H%x1f%s', `-${PM_LOOKBACK_COMMITS}`);
  if (log === null) return { measured: false };
  const commits = log
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [hash, subject] = l.split('\x1f');
      return { hash, subject: subject ?? '' };
    });
  const pmCommits = commits.filter((c) => c.subject.startsWith(PM_COMMIT_PREFIX));
  let ticks = 0;
  let openedSliceSeen = false;
  for (const c of pmCommits) {
    const diff = git('show', c.hash, '--', 'plan/50-tasks.md');
    const openedSlice =
      diff !== null &&
      diff.split('\n').some((l) => {
        const m = FEATURE_SLICE_LINE.exec(l);
        return m !== null && featureNames.has(m[1]);
      });
    if (openedSlice) {
      openedSliceSeen = true;
      break;
    }
    ticks += 1;
  }
  return { measured: true, ticks, scanned: pmCommits.length, capped: !openedSliceSeen && pmCommits.length === PM_LOOKBACK_COMMITS };
};

const workTypeMix = () => {
  const tasks = rows(read(at('plan', '50-tasks.md')), 'T').filter(taskOpen);
  const TAGS = ['מבנה', 'תוכן', 'נוחות', 'מעברים', 'תשתית'];
  /**
   * 🔴 **‏30/08 · D-148 — this read tokens, ⛔ not a suffix, and the difference was ⛔ not
   * cosmetic.** It used to ask `endsWith(tag)`, which is only true while the work-type
   * tag happens to be the LAST token in the cell. The moment `שכבה ב׳` joined the cell
   * (`M2 · arena · נוחות · שכבה ב׳`) **two tagged rows silently re-counted as untagged** —
   * ⛔ no check failed, ⛔ nothing went red, the printed mix was simply wrong.
   * ⚠️ `lib/core/planTable.ts` already parses this cell **by token** and was right all
   * along; this line was a second, weaker parser of the same field. ⇒ splitting on `·`
   * makes it order-free, exactly like `classify`, and immune to the next token anyone adds.
   */
  const tokens = (l) =>
    taskCell(l, TASK_MILESTONE_INDEX)
      .split('·')
      .map((t) => t.trim());
  const count = (tag) => tasks.filter((l) => tokens(l).includes(tag)).length;
  const tagged = tasks.filter((l) => tokens(l).some((t) => TAGS.includes(t))).length;
  return {
    מבנה: count('מבנה'),
    נוחות: count('נוחות'),
    תוכן: count('תוכן'),
    open: tasks.length,
    // ⛔ Reported, ⛔ never hidden: rows written before `§ 0.6ב` carry ⛔ no work-type
    // tag, and a mix printed as if they did is a share of a subset presented as a
    // share of the whole.
    untagged: tasks.length - tagged,
  };
};

/**
 * 🔴 ⛔ **תשתית מול מוצר — המספר שהלופ ⛔ לא יכול היה לראות על עצמו.**
 * ⟦NEW 09/09 · הכרעת רוי · שלב 7⟧
 *
 * 🔬 **האבחנה שהצדיקה את הסבב הזה:** שורות מתויגות `loop`+`base`+`general` עלו
 * מ-**9%** בטווח `T-100`–`T-149` ל-**64%** בטווח `T-240`–`T-289`. ⇒ הלופ בילה את רוב
 * זמנו בתחזוקת עצמו.
 * ⛔ **ומבנית ⛔ אי אפשר היה להדליק על זה דגל:** שלוש הזרימות האלה מוגדרות «מחוץ
 * לרצף» (`CROSS_CUTTING` ב-`lib/core/planTable.ts`) ⇒ הן **מוחרגות מכל דגל** של
 * בדיקות 11 · 13 · 14, ⛔ ובצדק — ⛔ אין להן מקום ב-`36 § 13` להפר.
 * ⇒ **מה שנשאר הוא למדוד ולהראות.** ⛔ **וזה ⛔ אינו `check()`** — ⛔ אין כאן סף,
 * ⛔ אין עובר/נכשל, ו⛔ אין מספר שחוסם מיזוג. **הכרעת רוי: «מדידה גלויה», ⛔ לא שער.**
 * ⚠️ **והיא בראש הפלט ⛔ ולא בסופו**, כי מספר שיושב אחרי 19 שורות ⛔ אינו נקרא.
 */
const infraShare = () => {
  const open = rows(read(at('plan', '50-tasks.md')), 'T').filter(taskOpen);
  const flowOf = (l) =>
    taskCell(l, TASK_MILESTONE_INDEX)
      .split('·')
      .map((t) => t.trim());
  const infra = open.filter((l) => flowOf(l).some((t) => CROSS_CUTTING.has(t)));
  /**
   * ⛔ «מוצר» = **⛔ לא-תשתית**, ⛔ ולא «נמצא ברשימת זרימות». ⇒ שורה שנשאה תג זרימה
   * חדש שהקובץ הזה ⛔ אינו מכיר עדיין נספרת כמוצר, ⛔ ולא נעלמת מהמכנה — נמדד 09/09
   * ש-17 שורות פתוחות ⛔ אינן נושאות תג זרימה כלל, וגם הן ⛔ אינן תשתית.
   */
  return { open: open.length, infra: infra.length, product: open.length - infra.length };
};

/**
 * 🧊 **כמה שורות תשתית נפתחו בשבוע — `RULES § 0.17 · הקפאת שורות הלופ`.**
 * ⟦NEW 09/09 · הכרעת רוי⟧ ⛔ **⛔ לא שער, ו⛔ סף אפס ⛔ אינו ריאלי:** ניסוח והכוונה
 * מותרים במפורש ⇒ המספר ⛔ אינו אמור להיות 0. **מה שהוא קיים בשבילו הוא הכיוון** —
 * שלוש שורות תשתית בשבוע שבו ⛔ לא נפתחה ולו פרוסת מוצר אחת הן דבר שאפשר **לראות**.
 * 🔬 נמדד מהדיף, ⛔ לא מהנוסח: שורות `| T-NNN |` **שנוספו** ל-`plan/50-tasks.md`
 * בשבעת הימים האחרונים, שתא אבן-הדרך שלהן נושא זרימה חוצת-גזרה.
 */
const infraRowsThisWeek = () => {
  const git = (...args) => {
    try {
      return execFileSync('./scripts/g', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch {
      return null;
    }
  };
  /**
   * 🔴 ⛔ **«שורה שנוספה» ⛔ אינה «שורה חדשה», והראשון היה שקר מדיד.** הניסיון הראשון
   * ספר שורות `+| T-NNN |` בדיף של שבעה ימים ⇒ **53**, כי `npm run archive` **מחליף
   * כל שורה סגורה בגדם** וכל rebase כותב שורות מחדש. ⇒ ההשוואה היא בין **קבוצות
   * מזהים**: מה שקיים היום ו⛔ לא היה קיים בקומיט האחרון שלפני שבוע.
   */
  const idsIn = (text) =>
    new Set(
      text
        .split('\n')
        .filter((l) => /^\| T-\d+ \|/.test(l))
        .filter((l) => (l.split('|')[2] ?? '').split('·').some((t) => CROSS_CUTTING.has(t.trim())))
        .map((l) => /^\| (T-\d+) \|/.exec(l)?.[1] ?? ''),
    );
  const base = git('rev-list', '-1', '--before=7 days ago', 'HEAD');
  if (base === null || base.trim() === '') return { measured: false };
  const then = git('show', `${base.trim()}:plan/50-tasks.md`);
  if (then === null) return { measured: false };
  const before = idsIn(then);
  const ids = [...idsIn(read(at('plan', '50-tasks.md')))].filter((id) => !before.has(id));
  return { measured: true, count: ids.length, ids };
};

const notMeasured = results.filter((r) => r.notMeasured);
const failed = results.filter((r) => !r.ok && !r.soft && !r.notMeasured);
const softFailed = results.filter((r) => !r.ok && r.soft && !r.notMeasured);
/** ⛔ מוין לפי מספר, ⛔ ולא לפי סדר הרישום בקובץ — בדיקה חדשה נכתבת ליד הקוד
 *  שהיא בודקת, ⛔ ולא בסוף, ודוח שקופץ מ-6 ל-10 ובחזרה ל-7 הוא דוח שקוראים לא נכון. */
const ordered = [...results].sort((a, b) => Number(a.id) - Number(b.id));
const share = infraShare();
const sharePct = share.open === 0 ? 0 : Math.round((share.infra / share.open) * 100);
console.log('בריאות הלופ — כל בדיקה היא קצה פתוח שכבר קרה\n');
console.log(
  `📊 תשתית מול מוצר (⛔ מדידה גלויה, ⛔ לא שער): **${sharePct}%** מהשורות הפתוחות הן ` +
    `loop/base/general — ${share.infra} תשתית · ${share.product} מוצר · ${share.open} סה"כ.`,
);
console.log(
  '   ⛔ ⛔ אין כאן סף ו⛔ אין עובר/נכשל. הרקע: 9% בטווח T-100–149 ⇒ 64% בטווח T-240–289.',
);
const fresh = infraRowsThisWeek();
console.log(
  fresh.measured
    ? `🧊 שורות תשתית שנפתחו בשבוע (§ 0.17 · הקפאת שורות הלופ · ⛔ לא שער): ${fresh.count}` +
        (fresh.count > 0 ? ` — ${fresh.ids.join(' · ')}` : '')
    : '🧊 שורות תשתית שנפתחו בשבוע: ⛔ לא נמדד — git ⛔ אינו נגיש',
);
console.log('');
for (const r of ordered) {
  const mark = r.notMeasured ? ' n/m  ' : r.ok ? '  ok  ' : r.soft ? ' warn ' : ' FAIL ';
  const tail = r.notMeasured
    ? '   ⛔ לא נמדד — ⛔ ואינה נספרת בקוד היציאה. ⛔ «לא נמדד» ⛔ אינו «עבר».'
    : r.ok || !r.soft
      ? ''
      : `   ⚠️ אזהרה בלבד עד ${r.softUntil}`;
  console.log(`${mark}${r.id}. ${r.title} — ${r.detail}${tail}`);
  for (const item of r.items.slice(0, 8)) console.log(`         ${item}`);
  if (r.items.length > 8) console.log(`         … ועוד ${r.items.length - 8}`);
}
const mix = workTypeMix();
console.log(
  `\nתמהיל (דיווח רך · D-147 · ⛔ לא ציון): ${mix.open} שורות פתוחות — ` +
    `מבנה ${mix.מבנה} · נוחות ${mix.נוחות} · תוכן ${mix.תוכן} · ⛔ ללא תג ${mix.untagged}`,
);
const slice = pmTicksSinceLastSlice();
console.log(
  slice.measured
    ? `טיקי PM מאז פרוסת פיצ'ר אחרונה (דיווח רך · D-190 § 3.3 · ⛔ לא ציון): ${slice.ticks}` +
        (slice.capped ? ` (⚠️ אף פרוסה לא נפתחה ב-${slice.scanned} טיקי PM האחרונים שנבדקו — ייתכן שהחלון קצר מדי)` : '')
    : `טיקי PM מאז פרוסת פיצ'ר אחרונה: ⛔ לא נמדד — git אינו נגיש`,
);
console.log(
  `\nloop health: ${results.length - failed.length - softFailed.length - notMeasured.length}/${results.length} checks pass`,
);
if (notMeasured.length > 0) {
  console.log(`⛔ ${notMeasured.length} ⛔ לא נמדדו — ⛔ ואינן נספרות כעוברות ו⛔ לא כנכשלות.`);
}
if (softFailed.length > 0) {
  console.log(`⚠️ ${softFailed.length} באזהרה — ⛔ אינן נספרות בקוד היציאה עד התאריך שלהן.`);
}
if (failed.length > 0) {
  console.log('⇒ כל כישלון הוא ממצא ל-60-findings. ⛔ אינו חוסם מיזוג ואינו עוצר את DEV.');
}
process.exit(failed.length === 0 ? 0 : 1);
