import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
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
 */
const MALFORMED_FINDINGS_CEILING = 13;

const numberAfter = (label: string): number => {
  const m = new RegExp(`${label}: \\d+ rows, (\\d+) malformed`).exec(stdout);
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

  it('writes a report that names the malformed rows', () => {
    const fresh = readFileSync(FRESH, 'utf8');
    expect(fresh).toContain('GENERATED by scripts/measure-plan-tables.mjs');
    // ⚠️ Was `T-042` until C-0156 repaired it, then `F-046` until C-0220 repaired it.
    // Pinning one exemplar makes this test go red every time the register is *fixed*,
    // which is backwards. So it now asserts the invariant instead: the report names one
    // row per malformed row the summary counts, and the count is read from stdout rather
    // than written here. ⛔ Still ⛔ not weakened to a regex that passes on none — the
    // exemplar below is kept as well, and `F-002` is class ⓐ, whose repair is a register
    // schema decision the Critic owns, ⛔ not a row Dev can quietly close.
    expect(fresh).toContain('`F-002`');
    const named = [...fresh.matchAll(/^\| `[TFQ]-\d{3}` \| \d+ \| \d+ \|$/gm)].length;
    expect(named).toBe(numberAfter('tasks') + numberAfter('findings'));
    expect(named).toBeGreaterThan(0);
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
    const sectionCounts = [...fresh.matchAll(/^## (?!ממצאים).*\((\d+)\)$/gm)].map((x) =>
      Number(x[1]),
    );
    expect(sectionCounts.length).toBe(5);
    expect(sectionCounts.reduce((a, b) => a + b, 0)).toBe(tasks);
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
    const lines = readFileSync(FRESH_OPEN, 'utf8').split('\n');
    let expected: number | null = null;
    let checked = 0;
    for (const line of lines) {
      if (!line.startsWith('|')) continue;
      const cells = splitRow(line).length;
      if (/^\|[-|]+\|$/.test(line)) continue;
      if (expected === null || /^\| id \|/.test(line)) {
        expected = cells;
        continue;
      }
      expect(cells).toBe(expected);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(50);
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
