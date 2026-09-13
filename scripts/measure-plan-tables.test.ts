import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  splitRow,
  rowShape,
  classifyStatus,
  TASK_COLUMNS,
  FINDING_COLUMNS,
  TASK_STATUS_INDEX,
  TASK_MILESTONE_INDEX,
  FINDING_STATUS_INDEX,
} from '../lib/core/planTable';

const OUT_DIR = mkdtempSync(join(tmpdir(), 'plan-tables-'));
const FRESH = join(OUT_DIR, 'plan-tables.md');
/**
 * ⛔ BOTH env vars, always. The script writes two files now, and a run that overrides only
 * `PLAN_TABLES_OUT` writes the *real* `docs/plan-open.md` from inside the test suite — a
 * test that mutates the repo it is measuring. `PLAN_OPEN_OUT` exists for this reason.
 */
const FRESH_OPEN = join(OUT_DIR, 'plan-open.md');
const stdout = execFileSync('node', ['scripts/measure-plan-tables.mjs'], {
  encoding: 'utf8',
  env: { ...process.env, PLAN_TABLES_OUT: FRESH, PLAN_OPEN_OUT: FRESH_OPEN },
});

/**
 * A RATCHET, ⛔ not an assertion of correctness — with one half now closed.
 *
 * ⚠️ C-0152 set both ceilings on the belief that both registers belong to other agents.
 * Half of that is wrong, and it is checkable in one line: `plan/50-tasks.md:3` declares
 * `⟦OWNER: Dev · PM מוסיף פריטים חדשים בלבד⟧`, so the task register is **this** agent's
 * to repair; only `plan/60-findings.md:3` (`⟦OWNER: Critic כותב · Dev מסמן טופל⟧`) is
 * someone else's prose. C-0156 repaired all six task rows accordingly ⇒ the task ceiling
 * is **0** and is now a real assertion: any new task row that does not split into its 8
 * declared columns fails here, in the register the Dev owns and writes every tick.
 *
 * The findings ceiling stays a ratchet at the C-0152 measurement, because demanding zero
 * there would redden the tree on the Critic's prose — the exact shape of F-030. Repairs
 * lower it; ⛔ nothing raises it silently.
 */
const MALFORMED_TASKS_CEILING = 0;
/**
 * 19 → 17, C-0220 (T-101). ⛔ Not an instance fix: `splitRow` now honours CommonMark code
 * spans, so a raw pipe inside `` ` `` stops inventing a column. That is the shared root of
 * F-059 · F-062ⓒ · F-063 — three ratchet failures whose fix each time was to escape one
 * pipe on one line. `F-026` and `F-053` fell out class-wide; `tasks` stayed at 0, which is
 * the evidence the splitter broke no row that was well-formed before.
 *
 * ⚠️ `F-017` did ⛔ not fall out, and the reason is a measurement the plan did not have:
 * it lost its two code-span pipes and landed on **9** cells, i.e. it is a *second* class-ⓐ
 * row (two status cells against an 8-column header), like `F-016`. Class ⓐ is therefore
 * **12** rows, ⛔ not 11 — a schema decision that belongs to the Critic, ⛔ not to Dev.
 *
 * 17 → 13, C-0220 (T-129). Four rows became machine-readable: `F-044` and `F-048` had a
 * *prose* pipe escaped as `\|` (⛔ a code-span-aware splitter cannot and must not guess
 * prose), and `F-019` · `F-046` · `F-047` had cells that were never written filled with
 * `—`. ⛔ No finding text was altered and no `סטטוס` cell moved — it still lands on
 * `FINDING_STATUS_INDEX = 6` in all four.
 *
 * The remaining **13** are class ⓐ and ⛔ nothing else: all 13 measure exactly 9 cells
 * against an 8-column header. `F-048` joined them once its prose pipe was escaped — a
 * third row the plan and T-129 did not count. Collapsing that ninth cell (or widening the
 * header to 9) is a **register schema decision** and belongs to the Critic, ⛔ not to Dev.
 *
 * 13 → 0, T-245 (this tick). All 13 were the exact same class ⓐ shape: a status narrative
 * split from its own short-status tail (`✅ טופל` / `🔓 פתוח …`) by one unescaped prose
 * `|`. Fixed by inserting exactly one `\` per row, at the raw character offset of that one
 * delimiter — computed from `codeSpans`/escape rules copied out of `splitRow` itself, ⛔
 * never by reconstructing the line from parsed cell values (parsed cells have already had
 * their own internal escapes *stripped*, e.g. `F-048`'s pre-existing `\|` inside "1 failed
 * \| 10 passed" — round-tripping through them would have silently dropped it and broken a
 * spot that was never malformed). **Verified byte-for-byte:** `git diff --word-diff` shows
 * exactly 13 insertions, each the single token `\|`, nothing else in the file touched.
 */
const MALFORMED_FINDINGS_CEILING = 0;

const numberAfter = (label: string): number => {
  const m = new RegExp(`${label}: \\d+ rows, (\\d+) malformed`).exec(stdout);
  if (m?.[1] === undefined) throw new Error(`no "${label}" line in stdout:\n${stdout}`);
  return Number(m[1]);
};

const rowsIn = (label: string): number => {
  const m = new RegExp(`${label}: (\\d+) rows,`).exec(stdout);
  if (m?.[1] === undefined) throw new Error(`no "${label}" line in stdout:\n${stdout}`);
  return Number(m[1]);
};

describe('scripts/measure-plan-tables.mjs', () => {
  it('reports on both registers', () => {
    expect(stdout).toMatch(/^tasks: \d+ rows, \d+ malformed$/m);
    expect(stdout).toMatch(/^findings: \d+ rows, \d+ malformed$/m);
  });

  it('never lets the malformed-row count grow', () => {
    expect(numberAfter('tasks')).toBeLessThanOrEqual(MALFORMED_TASKS_CEILING);
    expect(numberAfter('findings')).toBeLessThanOrEqual(MALFORMED_FINDINGS_CEILING);
  });

  it('prints no malformed-ids line when nothing is malformed', () => {
    // Both registers are clean right now (13 → 0, T-245) — the live run above is itself
    // the negative case: no `ids` line should exist when the count on its own line is 0.
    expect(stdout).not.toMatch(/^tasks malformed ids:/m);
    expect(stdout).not.toMatch(/^findings malformed ids:/m);
  });

  it('names the malformed rows, not just the count (T-245 · F-059\'s ⓑ)', () => {
    // F-059's whole complaint about `measure:plan` was that a bare count never told
    // anyone WHICH rows were unreadable — 13 findings sat unnamed for cycles. Fixture,
    // never the live registers: a copy of one real, well-formed row per file with a
    // single raw `|` injected into its finding-text cell, which is exactly the class ⓐ
    // shape every one of the 13 fixed rows had.
    const tmp = mkdtempSync(join(tmpdir(), 'plan-tables-malformed-'));

    const taskLines = readFileSync(join('plan', '50-tasks.md'), 'utf8').split('\n');
    const taskIdx = taskLines.findIndex((l) => l.startsWith('| T-166 |'));
    expect(taskIdx).toBeGreaterThanOrEqual(0);
    taskLines[taskIdx] = (taskLines[taskIdx] ?? '').replace(
      '**',
      '** raw | pipe injected for the test ',
    );
    const fixtureTasks = join(tmp, '50-tasks.md');
    writeFileSync(fixtureTasks, taskLines.join('\n'), 'utf8');

    const findingLines = readFileSync(join('plan', '60-findings.md'), 'utf8').split('\n');
    const findingIdx = findingLines.findIndex((l) => l.startsWith('| F-005 |'));
    expect(findingIdx).toBeGreaterThanOrEqual(0);
    findingLines[findingIdx] = (findingLines[findingIdx] ?? '').replace(
      '**',
      '** raw | pipe injected for the test ',
    );
    const fixtureFindings = join(tmp, '60-findings.md');
    writeFileSync(fixtureFindings, findingLines.join('\n'), 'utf8');

    const fixtureStdout = execFileSync('node', ['scripts/measure-plan-tables.mjs'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PLAN_TABLES_OUT: join(tmp, 'plan-tables.md'),
        PLAN_OPEN_OUT: join(tmp, 'plan-open.md'),
        PLAN_TASKS_FILE: fixtureTasks,
        PLAN_FINDINGS_FILE: fixtureFindings,
      },
    });

    expect(fixtureStdout).toMatch(/^tasks: \d+ rows, 1 malformed$/m);
    expect(fixtureStdout).toContain('tasks malformed ids: T-166');
    expect(fixtureStdout).toMatch(/^findings: \d+ rows, 1 malformed$/m);
    expect(fixtureStdout).toContain('findings malformed ids: F-005');
  });

  it('holds every ⛔ cell to a blocker that has not already lifted', () => {
    // ⚠️ C-0157 replaced the previous assertion, which pinned the live defect
    // (`stale blockers: T-066 cites F-020 (closed)`) and told the next agent to DELETE
    // this test once T-066's ⛔ cell was rewritten. Deleting it would have retired the
    // only mechanised copy of F-050's rule the moment it first paid out, so the
    // assertion was inverted instead of dropped. This is STRICTLY STRONGER than the
    // old one — it fails on T-066 citing a closed F-020 exactly as before, and also on
    // any OTHER row that starts citing a closed finding — ⛔ and it is not the weakened
    // regex the old comment warned about, because "none" is the only string it accepts.
    expect(stdout).toContain('stale blockers: none');
  });

  it('holds every ⛔ cell to a task blocker that has not already been delivered', () => {
    // C-0158's half of the same rule. Eight ⬜ rows were rewritten to ⛔ this tick, and
    // three of them declare `חסם: T-043` — a human action. The day Roy lands the source
    // files and T-043 flips to ✅, those three go stale in exactly the silent way T-066
    // did for ten cycles. Mutation-checked this tick: marking T-043 ✅ turns this red with
    // `T-007 waits on T-043 (done)` plus two siblings. "none" is the only string it takes.
    expect(stdout).toContain('stale task blockers: none');
  });

  it('holds every declared release condition to one that is not already met', () => {
    // T-166 / D-097's rule, mechanised: D-035 blocked "sentences" on two counting
    // conditions, both got filled, and nothing re-checked them — the tile stayed locked
    // for days. "none" is the only string this accepts, exactly like the two stale-blocker
    // assertions above it: a row that starts declaring `תנאי שחרור: N/N` while still ⛔ or
    // 🔓 must turn this red, not slide by on a weaker regex.
    expect(stdout).toContain('fulfilled release conditions (tasks): none');
    expect(stdout).toContain('fulfilled release conditions (findings): none');
  });

  it('reports a fulfilled release condition in docs/plan-tables.md when one exists', () => {
    // Runs the generator against a temp copy of the real registers with one row edited,
    // rather than the live plan/ files, so this test cannot leave a false "unblocked"
    // claim sitting in the committed registers.
    const tmp = mkdtempSync(join(tmpdir(), 'plan-tables-fixture-'));
    const tasksSrc = readFileSync(join('plan', '50-tasks.md'), 'utf8');
    const lines = tasksSrc.split('\n');
    const idx = lines.findIndex((l) => l.startsWith('| T-166 |'));
    expect(idx).toBeGreaterThanOrEqual(0);
    const cells = splitRow(lines[idx] ?? '');
    cells[TASK_STATUS_INDEX] = '⛔ חסומה — לצורך הבדיקה. תנאי שחרור: 2/2';
    lines[idx] = `| ${cells.join(' | ')} |`;
    const fixtureTasks = join(tmp, '50-tasks.md');
    writeFileSync(fixtureTasks, lines.join('\n'), 'utf8');

    const fixtureOut = join(tmp, 'plan-tables.md');
    const fixtureOpenOut = join(tmp, 'plan-open.md');
    const fixtureStdout = execFileSync('node', ['scripts/measure-plan-tables.mjs'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PLAN_TABLES_OUT: fixtureOut,
        PLAN_OPEN_OUT: fixtureOpenOut,
        PLAN_TASKS_FILE: fixtureTasks,
      },
    });

    expect(fixtureStdout).toContain('fulfilled release conditions (tasks): T-166 (2/2)');
    const report = readFileSync(fixtureOut, 'utf8');
    expect(report).toContain('## תנאי שחרור שהתמלא — והשורה עדיין נעולה');
    expect(report).toContain('`T-166`');
    expect(report).toContain('2/2');
  });

  it('holds every cancelled-in-prose task cell to a status cell that was actually flipped (T-229 · F-125)', () => {
    // The live registers, today: the six rows C-0370 fixed (T-136 · T-151 · T-160 ·
    // T-161 · T-162 · T-163) already carry 🚫 in their status cell, so this must read
    // "none" exactly like the stale-blocker and release-condition assertions above it —
    // ⛔ a weaker regex that also accepts a non-empty list would let the next drifted
    // row back in silently.
    expect(stdout).toContain('cancelled status gaps: none');
  });

  it('reports a cancelled-in-prose row whose status cell was never flipped, in docs/plan-tables.md', () => {
    // Same fixture pattern as the release-condition test above: edit a temp copy of the
    // real register so the live plan/ files are never mutated by a test run.
    const tmp = mkdtempSync(join(tmpdir(), 'plan-tables-fixture-'));
    const tasksSrc = readFileSync(join('plan', '50-tasks.md'), 'utf8');
    const lines = tasksSrc.split('\n');
    const idx = lines.findIndex((l) => l.startsWith('| T-229 |'));
    expect(idx).toBeGreaterThanOrEqual(0);
    const cells = splitRow(lines[idx] ?? '');
    cells[2] = '🚫 **בוטלה — לצורך הבדיקה.**';
    // ⛔ Set the status cell explicitly too, rather than trust T-229's live status: this
    // fixture must stay correct even after T-229 itself is closed (its status cell would
    // then read 🟣, not ⬜) — the same drift class the release-condition fixture above
    // avoids by overwriting TASK_STATUS_INDEX instead of reading it.
    cells[TASK_STATUS_INDEX] = '⬜';
    lines[idx] = `| ${cells.join(' | ')} |`;
    const fixtureTasks = join(tmp, '50-tasks.md');
    writeFileSync(fixtureTasks, lines.join('\n'), 'utf8');

    const fixtureOut = join(tmp, 'plan-tables.md');
    const fixtureOpenOut = join(tmp, 'plan-open.md');
    const fixtureStdout = execFileSync('node', ['scripts/measure-plan-tables.mjs'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PLAN_TABLES_OUT: fixtureOut,
        PLAN_OPEN_OUT: fixtureOpenOut,
        PLAN_TASKS_FILE: fixtureTasks,
      },
    });

    expect(fixtureStdout).toContain('cancelled status gaps: T-229 (open)');
    const report = readFileSync(fixtureOut, 'utf8');
    expect(report).toContain('## שורות שבוטלו בתא המשימה ותא הסטטוס שלהן לא עודכן');
    expect(report).toContain('`T-229`');
  });

  it('writes a report that names the malformed rows', () => {
    const fresh = readFileSync(FRESH, 'utf8');
    expect(fresh).toContain('GENERATED by scripts/measure-plan-tables.mjs');
    // ⚠️ Was `T-042` until C-0156 repaired it, then `F-046` until C-0220 repaired it, then
    // `F-002` (and 12 siblings) until T-245 repaired them — 13 → 0. Pinning one exemplar
    // makes this test go red every time the register is *fixed*, which is backwards, and
    // three cycles of that lesson is enough: the live registers are clean right now (both
    // ratchets sit at their floor, `MALFORMED_TASKS_CEILING`/`MALFORMED_FINDINGS_CEILING`
    // above), so the format itself is checked against a fixture below instead of quoting a
    // row id out of `plan/` that the next repair would just make stale again.
    const named = [...fresh.matchAll(/^\| `[TFQ]-\d{3}` \| \d+ \| \d+ \|$/gm)].length;
    expect(named).toBe(numberAfter('tasks') + numberAfter('findings'));
  });

  it('writes one shape-report row per malformed row, fixture-verified', () => {
    // The invariant above (`named === bad count`) holds vacuously at 0 malformed rows —
    // this fixture is what actually exercises the row-writing code path, using the same
    // deliberately-broken task row as the stdout-ids test above rather than a second copy
    // of the injection logic.
    const tmp = mkdtempSync(join(tmpdir(), 'plan-tables-malformed-report-'));
    const taskLines = readFileSync(join('plan', '50-tasks.md'), 'utf8').split('\n');
    const taskIdx = taskLines.findIndex((l) => l.startsWith('| T-166 |'));
    expect(taskIdx).toBeGreaterThanOrEqual(0);
    taskLines[taskIdx] = (taskLines[taskIdx] ?? '').replace(
      '**',
      '** raw | pipe injected for the test ',
    );
    const fixtureTasks = join(tmp, '50-tasks.md');
    writeFileSync(fixtureTasks, taskLines.join('\n'), 'utf8');

    const fixtureOut = join(tmp, 'plan-tables.md');
    execFileSync('node', ['scripts/measure-plan-tables.mjs'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PLAN_TABLES_OUT: fixtureOut,
        PLAN_OPEN_OUT: join(tmp, 'plan-open.md'),
        PLAN_TASKS_FILE: fixtureTasks,
      },
    });

    const report = readFileSync(fixtureOut, 'utf8');
    expect(report).toContain('`T-166`');
    expect([...report.matchAll(/^\| `[TFQ]-\d{3}` \| \d+ \| \d+ \|$/gm)].length).toBe(1);
  });

  it('indexes every open row and ⛔ drops only ✅ and 🚫', () => {
    // T-184. The index is the only thing three agents will read instead of 667KB of
    // register, so the failure that matters is a row going MISSING, ⛔ not a row being
    // ugly. The count in the header is checked against stdout, which is computed by a
    // different expression over the same rows, and every section count must add up to it.
    const fresh = readFileSync(FRESH_OPEN, 'utf8');
    const m = /^open index: (\d+) tasks, (\d+) findings$/m.exec(stdout);
    if (m?.[1] === undefined || m[2] === undefined) throw new Error(`no index line:\n${stdout}`);
    const [tasks, findings] = [Number(m[1]), Number(m[2])];
    expect(tasks).toBeGreaterThan(0);
    /**
     * 🔴 ⛔ **הסעיפים שנספרים כאן הם **חלוקה**, ⛔ ולא «כל סעיף עם מספר».** חמשת סעיפי
     * המצב (⬜ · ⛔ · 🟣 · ❔ · ⚠️) מחלקים את השורות הפתוחות בדיוק פעם אחת כל אחת ⇒
     * סכומם **חייב** להיות `tasks`. ⇒ סעיף שהוא **חתך** — אותן שורות מקובצות בציר
     * אחר — ⛔ אינו בחלוקה, וספירתו בתוכה הייתה שוברת את האינווריאנט הזה בלי שדבר
     * יישבר במוצר. ⟦09/09: «🎨 התור של PM» הוא החתך הראשון כזה.⟧
     */
    const CROSS_CUTS = /^## (ממצאים|🎨 התור של PM)/;
    const sectionCounts = [...fresh.matchAll(/^## .*\((\d+)\)$/gm)]
      .filter((x) => !CROSS_CUTS.test(x[0]))
      .map((x) => Number(x[1]));
    expect(sectionCounts.length).toBe(5);
    expect(sectionCounts.reduce((a, b) => a + b, 0)).toBe(tasks);

    // ⛔ **והחתך עצמו ⛔ אינו פטור ממדידה** — הוא חייב להיות **תת-קבוצה** של הפתוחות,
    // אחרת הוא מציג ל-PM שורות שכבר נסגרו. ⛔ «⛔ לא נספר» ⛔ אינו «⛔ לא נבדק».
    const pmLane = /^## 🎨 התור של PM — `נוחות` פתוחות \((\d+)\)$/m.exec(fresh);
    expect(pmLane, 'החתך של PM חייב להתקיים').not.toBeNull();
    expect(Number(pmLane?.[1] ?? -1)).toBeLessThanOrEqual(tasks);
    expect(fresh).toContain(`## ממצאים פתוחים (${findings})`);

    // ⛔ The count above and the `open index:` line are computed from the SAME array, so
    // together they cannot catch the mutation that matters: a state quietly added to the
    // dropped set. This recount reads the registers independently — ✅ and 🚫 out, every
    // other state in — and it is the assertion that goes red if ⛔ or 🟣 stops being
    // indexed. Measured: adding 'blocked' to the drop list leaves the sums agreeing and
    // fails only here.
    const countOpen = (file: string, columns: number, statusIndex: number): number =>
      readFileSync(join('plan', file), 'utf8')
        .split('\n')
        .map((line) => rowShape(line, columns))
        .filter((row) => row !== null)
        .filter((row) => {
          if (!row.ok) return true;
          const state = classifyStatus(row.cells[statusIndex] ?? '');
          return state !== 'done' && state !== 'cancelled';
        }).length;
    expect(tasks).toBe(countOpen('50-tasks.md', TASK_COLUMNS, TASK_STATUS_INDEX));
    expect(findings).toBe(countOpen('60-findings.md', FINDING_COLUMNS, FINDING_STATUS_INDEX));
    // ...and every one of those IDs is physically present in the file, ⛔ not just counted.
    for (const id of ['T-185', 'T-184']) expect(fresh).toContain(`\`${id}\``);
    // ⛔ The pointer clause is load-bearing: without it an agent treats an excerpt as
    // the row. If someone deletes it, this test is what says no.
    expect(fresh).toContain('זהו תקציר, לא מקור אמת');
    expect(fresh).toContain("grep -n '^| T-185 |' plan/50-tasks.md");
  });

  it('keeps the index smaller than a fifth of the registers it replaces', () => {
    // The whole point is the cut. A ratchet, ⛔ not a style rule: if a future change starts
    // emitting whole cells again, the index silently stops being cheaper than the register
    // and every agent pays for it in every tick, with nothing going red.
    const registers =
      readFileSync(join('plan', '50-tasks.md'), 'utf8').length +
      readFileSync(join('plan', '60-findings.md'), 'utf8').length;
    expect(readFileSync(FRESH_OPEN, 'utf8').length).toBeLessThan(registers / 5);
  });

  it('emits an index whose table rows are all well-formed', () => {
    // `splitRow` UNESCAPES `\|`, so a re-emitted cell can carry a raw pipe and invent a
    // column. `excerpt` escapes it again; this is the assertion that says it did. Every
    // table row must have the same cell count as the header above it.
    // ⚠️ The file now holds SEVERAL tables of different widths (the state
    // sections, the two balance tables, the plans index). The header is
    // whatever line the `|---|` separator follows, so the width resets per
    // table instead of being assumed once for the file.
    const lines = readFileSync(FRESH_OPEN, 'utf8').split('\n');
    let expected: number | null = null;
    let checked = 0;
    let tables = 0;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line === undefined || !line.startsWith('|')) continue;
      if (/^\|[\s:-]+\|[\s|:-]*$/.test(line)) continue;
      if (/^\|[\s:-]+\|[\s|:-]*$/.test(lines[i + 1] ?? '')) {
        expected = splitRow(line).length;   // this line is a header
        tables += 1;
        continue;
      }
      if (expected === null) continue;
      expect(splitRow(line).length).toBe(expected);
      checked += 1;
    }
    expect(tables).toBeGreaterThan(4);
    expect(checked).toBeGreaterThan(50);
  });

  it('loses no open row between the flat list and the tree', () => {
    // The tree is what three agents will read to decide what to work on. A row
    // that falls out of it — a declared parent cycle, a workstream nobody
    // tagged, a root filter that is too strict — stops existing for them.
    const fresh = readFileSync(FRESH_OPEN, 'utf8');
    const tree = fresh.slice(fresh.indexOf('## 🌳'), fresh.indexOf('## 📐'));
    const inTree = new Set([...tree.matchAll(/^\s*- \S+ `([TF]-\d{3})`/gm)].map((m) => m[1]));
    const m = /^open index: (\d+) tasks,/m.exec(stdout);
    expect(inTree.size).toBe(Number(m?.[1]));
  });

  it('counts every task row exactly once in the balance table', () => {
    // ⛔ The whole point of the balance table is that it adds up. A row counted
    // twice (two workstream tags) or zero times (a tag nobody recognises) turns
    // it into a decoration. Read from the rendered table, ⛔ not from the code
    // that wrote it.
    const fresh = readFileSync(FRESH_OPEN, 'utf8');
    const balance = fresh.slice(fresh.indexOf('| זרימה |'), fresh.indexOf('| סוג עבודה |'));
    const totals = [...balance.matchAll(/^\|[^|]+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\| (\d+) \|$/gm)]
      .map((x) => Number(x[1]));
    expect(totals.length).toBeGreaterThan(5);
    expect(totals.reduce((a, b) => a + b, 0)).toBe(rowsIn('tasks'));
  });

  it('names every plan file on disk, and marks the orphans', () => {
    // 46 plans and, before this, no map of them at all. A plan missing here is
    // a plan the PM cannot find and will rewrite from scratch.
    const fresh = readFileSync(FRESH_OPEN, 'utf8');
    const onDisk = readdirSync(join('docs', 'superpowers', 'plans')).filter((n) =>
      n.endsWith('.md'),
    );
    expect(onDisk.length).toBeGreaterThan(40);
    for (const name of onDisk) expect(fresh).toContain(`\`${name.replace(/\.md$/, '')}\``);
    expect(fresh).toContain(`## 📐 אינדקס התוכניות — ${onDisk.length} קבצים`);
  });

  it('surfaces every open plan-feedback row — a channel nobody reads is not a channel', () => {
    const fresh = readFileSync(FRESH_OPEN, 'utf8');
    // ⛔ Counted from the register itself, ⛔ not from stdout. Mutation-found: with the
    // open-row filter stubbed to [], stdout said "0 open" and the rendered count was 0,
    // so a check comparing the two agreed perfectly while the section was empty and the
    // PM would never see a single gap Dev reported.
    // 🔄 FIXED C-0303 (DEV). This block used to read the row with its OWN anchored regex,
    // `/[⬜🔵]\s*\|\s*$/` — the glyph had to be the LAST thing in the line. The generator
    // reads the same fact as «the glyph appears ANYWHERE in the last cell»
    // (`scripts/measure-plan-tables.mjs:360-367`, and that is the convention every other
    // register uses). ⛔ Two readers of one fact, and they drifted apart the first time a
    // status cell opened with `⬜ **נקראה C-0302**` and closed with prose: the generator
    // said «1 open», this test said «0 open», and the tree went red on a MARKDOWN edit
    // nobody could see. ⇒ ⛔ the register is ⛔ not reshaped to satisfy a stricter private
    // rule — the reader is made ONE reader, through the same `splitRow` the generator uses.
    const open = readFileSync(join('plan', '26-plan-feedback.md'), 'utf8')
      .split('\n')
      .filter((l) => /^\| C-\d{4} \|/.test(l))
      .map((l) => splitRow(l))
      .filter((cells) => /[⬜🔵]/u.test(cells[cells.length - 1] ?? '')).length;
    // ⛔ NO FLOOR ON `open` (T-213). This used to assert `toBeGreaterThan(0)` — a queue
    // this test happened to find non-empty the day it was written, promoted to a
    // permanent invariant. The moment the PM closes the last row honestly, `open`
    // becomes 0 and `npm run verify` goes red on the loop working correctly (measured
    // C-0324). The real invariant is covariant with the count, not a floor under it:
    // the section renders, and every open row it counts appears in it — empty queue
    // included — which the two assertions below already prove either way.
    expect(fresh).toContain('## 🔁 משוב על תוכניות');
    const shown = [...fresh.matchAll(/^\| C-\d{4} \|/gm)].length;
    expect(shown).toBe(open);
    // The DEV→PM lane only works if the PM is actually sent here, so the section must
    // exist even when it is empty — an absent section reads as "nothing to do".
    expect(fresh).toMatch(/## 🔁 משוב על תוכניות[\s\S]{0,400}(אין|מחזור)/);
  });

  it('does not list a CLOSED plan-feedback row whose prose merely quotes a 🔴/🟣/🔧 finding — the surrogate-pair trap (T-213)', () => {
    // ⛔ THE BUG THIS PINS, measured live 2026-09-04 on this exact clone: `/[⬜🔵]/`
    // WITHOUT the `u` flag does not see 🔵 (U+1F535) as one code point — inside an
    // unflagged class, its high surrogate `\uD83D` is matched on its own, and that
    // half is shared by EVERY glyph in U+1F400–U+1F7FF: 🔴 🟠 🟡 🟣 🚫 🔧 included.
    // `node -e "/[⬜🔵]/.test('🔴')"` → true; the `/u` version → false.
    // Row `C-0318` in `plan/26-plan-feedback.md` is ✅ CLOSED — its closing note
    // just happens to quote the finding it resolved: "F-140 היא 🔴 CRITICAL". The
    // unflagged regex read that 🔴 as if it were a ⬜/🔵 open-glyph and rendered the
    // row into "## 🔁 משוב על תוכניות" (open plan feedback) as still open — the exact
    // inverse of what the section exists to tell the PM.
    const fresh = readFileSync(FRESH_OPEN, 'utf8');
    expect(fresh).not.toMatch(/\| C-0318 \|/);
  });

  it('carries no date, so the snapshot cannot rot on its own', () => {
    // ⛔ The one thing that would break the freshness assertion below on nobody's
    // edit: a clock. The tree would go red every midnight and the loop would
    // learn to ignore it.
    const fresh = readFileSync(FRESH_OPEN, 'utf8');
    expect(fresh).not.toMatch(/\b20\d{2}-\d{2}-\d{2}T\d{2}:/);
    expect(fresh).not.toMatch(/ימים מאז|days since/);
  });

  it('leaves the committed index identical to a fresh run', () => {
    expect(readFileSync(join('docs', 'plan-open.md'), 'utf8')).toBe(readFileSync(FRESH_OPEN, 'utf8'));
  });

  it('leaves the committed report identical to a fresh run', () => {
    // The committed docs/plan-tables.md is evidence, ⛔ not decoration: if it drifts from
    // what the script produces, the next agent reads a stale answer and trusts it.
    expect(readFileSync(join('docs', 'plan-tables.md'), 'utf8')).toBe(readFileSync(FRESH, 'utf8'));
  });
});

/**
 * T-271 (המשך של T-255) — **הרצה 2 מתוך השלוש שהמשימה מדדה כשבורות:** עם התג `שיפור`
 * על שורה פתוחה, `measure:plan` היה מוציא «⚠️ ⁣\`<id>\` נושאת תג שאינו באוצר המילים:
 * \`שיפור\`. ⛔ תקן או הסר» — כי `classify` (לפני התיקון בקובץ זה) דיווח עליו כ-`unknown`.
 * ⛔ שום שורה בריפו האמיתי לא נושאת את התג היום (הרצת הבסיס למעלה מדדה `0 bad tags`),
 * ⇒ הפיקסצ'ר כאן היא עותק של `plan/50-tasks.md` האמיתי עם `· שיפור` אחד מוסף לתא
 * `אבן דרך` של שורה קיימת (`T-271` עצמה) — ⛔ לא רישום בדוי. **`TASK_STATUS_INDEX`
 * נכתב מפורשות ל-`⬜`** באותו דפוס בדיוק כמו הפיקסצ'ר של T-229 למעלה: השורה הזאת
 * עצמה סוגרת ל-🟣 בטיק שכתב אותה, וקריאת הסטטוס החי (⛔ ולא כתיבתו) הייתה הופכת את
 * הבדיקה לתלויה בדריפט של הרגיסטר החי — בדיוק המחלקה שההערה שם מזהירה מפניה.
 */
describe('🔴 T-271: שיפור אינו תג לא-מוכר (בדיקה 14 · D-190 § 1.3)', () => {
  it('does not flag a row carrying שיפור as an unknown-vocabulary tag', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'plan-tables-improve-tag-'));

    const taskLines = readFileSync(join('plan', '50-tasks.md'), 'utf8').split('\n');
    const taskIdx = taskLines.findIndex((l) => l.startsWith('| T-271 |'));
    expect(taskIdx).toBeGreaterThanOrEqual(0);
    const cells = splitRow(taskLines[taskIdx] ?? '');
    cells[TASK_MILESTONE_INDEX] = `${cells[TASK_MILESTONE_INDEX]} · שיפור`;
    cells[TASK_STATUS_INDEX] = '⬜';
    taskLines[taskIdx] = `| ${cells.join(' | ')} |`;
    const fixtureTasks = join(tmp, '50-tasks.md');
    writeFileSync(fixtureTasks, taskLines.join('\n'), 'utf8');

    const fixtureStdout = execFileSync('node', ['scripts/measure-plan-tables.mjs'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PLAN_TABLES_OUT: join(tmp, 'plan-tables.md'),
        PLAN_OPEN_OUT: join(tmp, 'plan-open.md'),
        PLAN_TASKS_FILE: fixtureTasks,
      },
    });

    // The failing horn, exactly as T-271 measured it: 0 bad tags, ⛔ not 1, and no
    // mention of T-271 in the "unknown vocabulary" flag.
    expect(fixtureStdout).toMatch(/balance: \d+ rows without a workstream, 0 bad tags, \d+ flags/);
    expect(fixtureStdout).not.toMatch(/T-271.*אוצר המילים/);
    const report = readFileSync(join(tmp, 'plan-tables.md'), 'utf8');
    expect(report).not.toContain('נושאת תג שאינו באוצר המילים');

    // The row still classifies correctly on the axis שיפור does not touch —
    // `T-271` stays eligible (⬜) rather than falling into a malformed/unknown bucket.
    expect(report).toMatch(/`T-271`/);
  });
});

/**
 * T-248 — הדגל «הזרימה הפעילה מוצתה» חייב לקרוא את `ACTIVE_WORKSTREAM` בפועל, ⛔ ולא
 * להסיק אותו משדה `spent > 0`. `nav` ו-`arena` שתיהן זרימות שהתרוקנו בעבר (spent > 0,
 * open === 0) ו⛔ אף אחת מהן אינה `ACTIVE_WORKSTREAM` כרגע — ⇒ אף אחת לא אמורה לקבל את
 * הטלת ה-🔴 המחייבת (שהיא הודעה ל-QA, ⛔ לא תיאור מצב). כדי לבודד את `ACTIVE_WORKSTREAM`
 * בלי לגעת ברגיסטר האמיתי, `PLAN_CONTROL_FILE` מפנה את הסקריפט לקובץ בקרה זמני שמכריז
 * `arena` כפעילה — ⛔ תוך שימוש ב-`plan/50-tasks.md` האמיתי, כדי שהמספרים (0 פתוחות
 * ב-`nav` וב-`arena`) יהיו נמדדים, ⛔ לא מבוימים.
 *
 * ⚠️ **C-0583 — ולמה הזרימה הנקובה כאן זזה מ-`studies` ל-`arena`, ⛔ ולא כי הבדיקה
 * הייתה שגויה:** הפיקסטורה נשענת במתכוון על הרגיסטר **החי**, ⇒ הזרימה הנקובה חייבת
 * להיות זרימה ש-⬜=0 **בפועל**. ‏`T-330`/`T-331` נפתחו ב-`studies` (הליכת מסכים,
 * C-0583) ⇒ `studies` חדלה להיות מוצתה, והטענה «הדגל נופל עליה» נעשתה **שקרית
 * לפי המדידה**. ‏`arena` היא זרימה מוצתה אמיתית (24 טיקים · ⬜=0). 🔴 **והצימוד עצמו
 * הוא ממצא, ⛔ ולא דבר שתוקן כאן:** כל שורה שתיפתח בזרימה הנקובה תפיל את הבדיקה שוב.
 */
describe('🔴 הזרימה הפעילה מוצתה — חייב לקרוא ACTIVE_WORKSTREAM (T-248)', () => {
  const CONTROL_DIR = mkdtempSync(join(tmpdir(), 'plan-control-'));
  const FAKE_CONTROL = join(CONTROL_DIR, '00-control.md');
  writeFileSync(
    FAKE_CONTROL,
    ['ACTIVE_WORKSTREAM: arena', '#   nav:     3 / 120', '#   arena:  24 / 120', ''].join('\n'),
    'utf8',
  );
  const ACTIVE_OUT = join(CONTROL_DIR, 'plan-tables.md');
  const ACTIVE_OPEN_OUT = join(CONTROL_DIR, 'plan-open.md');
  const activeStdout = execFileSync('node', ['scripts/measure-plan-tables.mjs'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PLAN_TABLES_OUT: ACTIVE_OUT,
      PLAN_OPEN_OUT: ACTIVE_OPEN_OUT,
      PLAN_CONTROL_FILE: FAKE_CONTROL,
    },
  });
  const activeOpen = readFileSync(ACTIVE_OPEN_OUT, 'utf8');

  it('⛔ אינה מטילה את הדגל המחייב על `nav` — spent > 0 אך ⛔ אינה הפעילה', () => {
    expect(activeOpen).not.toMatch(/🔴 \*\*הזרימה הפעילה מוצתה — `nav`/);
  });

  it('כן מטילה את הדגל המחייב על `arena` — היא `ACTIVE_WORKSTREAM` בקובץ הבקרה הזה', () => {
    expect(activeOpen).toMatch(/🔴 \*\*הזרימה הפעילה מוצתה — `arena`/);
  });

  it('⛔ לא שותקת על `nav` — מקבלת ניסוח נפרד, נכון, ⛔ ולא הטלה על QA', () => {
    expect(activeOpen).toMatch(/`nav`.*⛔ אינה הזרימה הפעילה.*⛔ אין פעולה/);
  });

  it('`balance:` ב-stdout סופר את שני הדגלים גם יחד', () => {
    expect(activeStdout).toMatch(/balance: \d+ rows without a workstream, \d+ bad tags, \d+ flags/);
  });
});

/**
 * ⛔ **עמודת הצעדים (שלב 3 · P3-2).** הטענה ⛔ אינה «יש עמודה» — היא ש**שתי
 * המחלקות ⛔ אינן מתערבבות**: תוכנית שאיש לא סימן בה ולו תיבה אחת ⛔ אינה «נעצרה
 * באמצע», ודגל שמאחד אותן הוא דגל שכל סוכן לומד להתעלם ממנו.
 */
describe('📐 אינדקס התוכניות — כיסוי הצעדים', () => {
  const open = readFileSync(join('docs', 'plan-open.md'), 'utf8');
  const rows = open
    .split('\n')
    .filter((l) => /^\| `20\d\d-\d\d-\d\d-/.test(l));

  it('כל תוכנית מקבלת שורה, ובה ארבע עמודות', () => {
    const files = readdirSync(join('docs', 'superpowers', 'plans')).filter((f) => f.endsWith('.md'));
    expect(rows).toHaveLength(files.length);
    for (const r of rows) expect(r.split('|').length, r.slice(0, 40)).toBe(6);
  });

  it('כל שורה נושאת מונה `done/total`, ⛔ ולא טקסט חופשי', () => {
    for (const r of rows) {
      expect(r, r.slice(0, 40)).toMatch(/\| [^|]*(\d+\/\d+|⛔ אין צעדים)[^|]*\|/);
    }
  });

  it('⛔ ⛔ אין שורה שהיא גם «נעצרה באמצע» וגם «ולו תיבה אחת לא סומנה»', () => {
    for (const r of rows) {
      const mid = r.includes('נעצרה באמצע');
      const none = r.includes('ולו תיבה אחת לא סומנה');
      expect(mid && none, r.slice(0, 40)).toBe(false);
    }
  });

  it('«נעצרה באמצע» ⛔ לעולם ⛔ אינה 0, ו«לא סומנה» היא תמיד 0 — זו כל ההפרדה', () => {
    for (const r of rows) {
      const mid = /\*\*(\d+)\/(\d+)\*\* — נעצרה באמצע/.exec(r);
      if (mid !== null) {
        expect(Number(mid[1]), r.slice(0, 40)).toBeGreaterThan(0);
        expect(Number(mid[1])).toBeLessThan(Number(mid[2]));
      }
      const none = /⚪ (\d+)\/\d+ — ⛔ ולו תיבה אחת/.exec(r);
      if (none !== null) expect(Number(none[1]), r.slice(0, 40)).toBe(0);
    }
  });

  it('שתי המחלקות קיימות בפועל — ⛔ בדיקה שלא ראתה אף מקרה ⛔ אינה בדיקה', () => {
    expect(rows.filter((r) => r.includes('נעצרה באמצע')).length).toBeGreaterThan(0);
    expect(rows.filter((r) => r.includes('ולו תיבה אחת לא סומנה')).length).toBeGreaterThan(0);
  });
});
