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
const TODAY = new Date().toISOString().slice(0, 10);
const check = (id, title, fn, softUntil = null) => {
  const soft = softUntil !== null && TODAY < softUntil;
  try {
    const { ok, detail, items = [] } = fn();
    results.push({ id, title, ok, detail, items, soft, softUntil });
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

/* 2 — a finding names where the defect IS. That file must exist. */
check('2', 'קובץ:שורה של כל ממצא פתוח — קיים', () => {
  const missing = [];
  for (const line of rows(read(at('plan', '60-findings.md')), 'F')) {
    if (isClosed(line)) continue;
    for (const p of claimedPaths(line)) if (!existsSync(at(p))) missing.push(`${idOf(line)} → ${p}`);
  }
  return { ok: missing.length === 0, detail: `${missing.length} מתים`, items: missing };
});

/* 3 — RULES § 0.21, enforced for the first time. The 7 days is the rule's own
 * number, ⛔ not one invented here. A date is fine: this is a report on stdout,
 * ⛔ never a committed snapshot, so a clock cannot rot anything. */
const STAMP = /נבדק:\s*(\d{4}-\d{2}-\d{2})/;
check('3', 'כל פריט פתוח לרוי נושא חותמת נבדק מהשבוע', () => {
  const stale = [];
  const week = Date.now() - 7 * 864e5;
  for (const line of read(at('plan', '03-for-roy.md')).split('\n')) {
    if (!/^\| *\d+ *\| *(PM|DEV|CRITIC|CONTENT|QA)/.test(line)) continue;
    if (isClosed(line)) continue;
    const id = /^\| *(\d+)/.exec(line)?.[1];
    const m = STAMP.exec(line);
    if (m === null) stale.push(`פריט ${id} — ⛔ ללא חותמת`);
    else if (Date.parse(m[1]) < week) stale.push(`פריט ${id} — נבדק ${m[1]}`);
  }
  return { ok: stale.length === 0, detail: `${stale.length} ללא חותמת טרייה`, items: stale };
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
check('9', 'רגיסטר הבקרה מתחת לתקרת ה-12KB', () => {
  const bytes = Buffer.byteLength(read(at('plan', '00-control.md')), 'utf8');
  return {
    ok: bytes > 0 && bytes <= CONTROL_CEILING,
    detail:
      bytes === 0
        ? '⛔ לא נמדד — הקובץ ריק או חסר'
        : `${bytes} בתים מתוך ${CONTROL_CEILING}`,
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
  return {
    ok: open > 0,
    detail:
      open > 0
        ? `${how} — ${open} משימות ⬜${caveat}`
        : `⛔ ${how} מוצתה — כל טיק DEV עד שהמיקוד יוזז הוא טיק ריק${caveat}`,
  };
});

/* 7 — the DEV→PM lane only works if the PM actually learns. ⛔ No invented
 * threshold: the same missing element on two open rows IS the PM not learning,
 * which RULES § 0.6ג already calls a 🟡 finding. */
check('7', 'אף חסר בתוכנית אינו חוזר פעמיים', () => {
  const seen = new Map();
  for (const line of read(at('plan', '26-plan-feedback.md')).split('\n')) {
    if (!/^\| C-\d{4} *\|/.test(line)) continue;
    if (!/[⬜🔵]/.test(line.split('|').slice(-2).join('|'))) continue;
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
const IMPROVE_ROW_CEILING = 2;
check(
  '14',
  'IMPROVE_TARGET מצביע על זרימה חתומה ומחזיק ≤2 שורות',
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
    if (there.open > IMPROVE_ROW_CEILING) {
      items.push(`⛔ ${there.open} שורות ⬜ ב-\`${target}\` — התקרה ${IMPROVE_ROW_CEILING}`);
    }
    return { ok: items.length === 0, detail: `יעד \`${target}\` · ${there.open} ⬜`, items };
  },
);

/**
 * ⛔ **A REPORTED NUMBER, ⛔ NOT A CHECK.**  ⟦D-147 · the 4/1/1 mix⟧
 * The mix is a soft target and it ⛔ must not become a gate: cutting new slices in
 * half while DEV runs dry trades one problem for another. ⇒ this prints and ⛔ never
 * fails. ⛔ It is deliberately ⛔ not a `check()` — a number in the pass/fail column
 * is a number somebody will start optimising.
 */
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

const failed = results.filter((r) => !r.ok && !r.soft);
const softFailed = results.filter((r) => !r.ok && r.soft);
/** ⛔ מוין לפי מספר, ⛔ ולא לפי סדר הרישום בקובץ — בדיקה חדשה נכתבת ליד הקוד
 *  שהיא בודקת, ⛔ ולא בסוף, ודוח שקופץ מ-6 ל-10 ובחזרה ל-7 הוא דוח שקוראים לא נכון. */
const ordered = [...results].sort((a, b) => Number(a.id) - Number(b.id));
console.log('בריאות הלופ — כל בדיקה היא קצה פתוח שכבר קרה\n');
for (const r of ordered) {
  const mark = r.ok ? '  ok  ' : r.soft ? ' warn ' : ' FAIL ';
  const tail = r.ok || !r.soft ? '' : `   ⚠️ אזהרה בלבד עד ${r.softUntil}`;
  console.log(`${mark}${r.id}. ${r.title} — ${r.detail}${tail}`);
  for (const item of r.items.slice(0, 8)) console.log(`         ${item}`);
  if (r.items.length > 8) console.log(`         … ועוד ${r.items.length - 8}`);
}
const mix = workTypeMix();
console.log(
  `\nתמהיל (דיווח רך · D-147 · ⛔ לא ציון): ${mix.open} שורות פתוחות — ` +
    `מבנה ${mix.מבנה} · נוחות ${mix.נוחות} · תוכן ${mix.תוכן} · ⛔ ללא תג ${mix.untagged}`,
);
console.log(`\nloop health: ${results.length - failed.length - softFailed.length}/${results.length} checks pass`);
if (softFailed.length > 0) {
  console.log(`⚠️ ${softFailed.length} באזהרה — ⛔ אינן נספרות בקוד היציאה עד התאריך שלהן.`);
}
if (failed.length > 0) {
  console.log('⇒ כל כישלון הוא ממצא ל-60-findings. ⛔ אינו חוסם מיזוג ואינו עוצר את DEV.');
}
process.exit(failed.length === 0 ? 0 : 1);
