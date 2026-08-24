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
 *   3 · `נבדק:` — a rule in RULES § 0.15א with 0 occurrences in the file.
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
const check = (id, title, fn) => {
  try {
    const { ok, detail, items = [] } = fn();
    results.push({ id, title, ok, detail, items });
  } catch (e) {
    results.push({ id, title, ok: false, detail: `⛔ הבדיקה עצמה נפלה: ${e.message}`, items: [] });
  }
};

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

/* 3 — RULES § 0.15א, enforced for the first time. The 7 days is the rule's own
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

/* 7 — the DEV→PM lane only works if the PM actually learns. ⛔ No invented
 * threshold: the same missing element on two open rows IS the PM not learning,
 * which RULES § 0.5ג already calls a 🟡 finding. */
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

const failed = results.filter((r) => !r.ok);
console.log('בריאות הלופ — כל בדיקה היא קצה פתוח שכבר קרה\n');
for (const r of results) {
  console.log(`${r.ok ? '  ok  ' : ' FAIL '}${r.id}. ${r.title} — ${r.detail}`);
  for (const item of r.items.slice(0, 8)) console.log(`         ${item}`);
  if (r.items.length > 8) console.log(`         … ועוד ${r.items.length - 8}`);
}
console.log(`\nloop health: ${results.length - failed.length}/${results.length} checks pass`);
if (failed.length > 0) {
  console.log('⇒ כל כישלון הוא ממצא ל-60-findings. ⛔ אינו חוסם מיזוג ואינו עוצר את DEV.');
}
process.exit(failed.length === 0 ? 0 : 1);
