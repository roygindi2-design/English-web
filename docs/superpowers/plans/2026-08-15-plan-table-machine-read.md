# Plan-Table Machine-Read Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `plan/50-tasks.md` and `plan/60-findings.md` machine-readable by column, so the question "is there Dev-eligible work?" is one command instead of a five-file read, and so a ⛔ cell that cites a closed finding is caught by a machine instead of surviving cycles.

**Architecture:** A pure parser in `/lib/core` (`planTable.ts`) that splits a markdown table row into cells honouring the `\|` escape, classifies a status cell into one state, and cross-references a ⛔ cell's finding citations against the findings register. A thin CLI in `scripts/` reads the two files and writes a committed report, exactly like `measure-gate.mjs` → `docs/gate-recheck.md`. The guard is a **ratchet against measured floors**, ⛔ not an absolute assertion: the two registers belong to the PM and the Critic, and a Dev test that reddens the tree on their prose would be F-030 all over again.

**Tech Stack:** TypeScript (no `any`), vitest, Node ESM `.mjs` with the `registerHooks` TS-resolver shim already used by `scripts/measure-gate.mjs:16-34`.

**Spec:** `plan/60-findings.md` F-050 (every ⛔ cell must name a command that decides whether it still holds) · F-056 (the ⬜ queue holds no Dev-eligible row, and the next Dev repeats the same five-file read) · `plan/RULES.md` § 0.1.1 ו׳ (a ceiling that only counts is not a brake).

## Global Constraints

- `/lib/core` is pure: ⛔ zero React/window/document/localStorage/fetch/process.env/`node:fs`. Enforced by `npm run check:core`. **All file reading lives in `scripts/`, never in `lib/core/planTable.ts`.**
- TypeScript with `noUncheckedIndexedAccess` on: an indexed read is `T | undefined`. Filter, ⛔ never assert with `!`.
- ⛔ This plan does **not** edit `plan/50-tasks.md`, `plan/60-findings.md`, `plan/40-decisions.md`, `plan/35-design-constitution.md`, or `plan/10-pedagogy.md`. It reads them. Repairing a malformed row in the PM's or the Critic's register is **their** commit, opened as a finding by Task 3.
- ⛔ Zero product-UI change. Zero screen decisions. Zero learning content.
- Commit messages carry no `[skip ci]` (RULES § 0.7). Push to `dev` only.

---

## Measurements this plan rests on

Every number below was produced by a command in cycle **C-0151** on the `dev` working tree, ⛔ none is restated from a document.

| # | Command | Output |
|---|---|---|
| M1 | `grep -cE '^\| T-[0-9]{3} \|' plan/50-tasks.md` | **72** rows |
| M2 | `grep -cE '^\| (F\|Q)-[0-9]{3} \|' plan/60-findings.md` | **59** rows |
| M3 | `awk -F'\|' '/^\| T-[0-9]{3} \|/ {print NF}' plan/50-tasks.md \| sort \| uniq -c` | 64×`10` · 3×`11` · 2×`12` · 1×`14` · 1×`19` · 1×`8` |
| M4 | same over `plan/60-findings.md` | 36×`10` · 13×`11` · 4×`12` · 1×`13` · 1×`14` · 1×`15` · 1×`17` · 2×`7` |
| M5 | `awk -F'\|' '/^\| T-042 \|/ {for(i=1;i<=NF;i++) printf "[%d] %.100s\n", i, $i}' plan/50-tasks.md` | six cells: id · milestone · task · source · status · `—`. **Cells 7–8 absent.** |
| M6 | same over `plan/60-findings.md` line 60 (`F-046`) | five cells; the closure verdict `✅ **נסגר C-0134…`** sits in cell 6 = **`תיקון מוצע`**, ⛔ not `סטטוס` |
| M7 | `grep -c '\\\|' plan/50-tasks.md plan/60-findings.md` | `10` · `7` — **the `\|` escape convention already exists in both files** |
| M8 | `npm run typecheck && npm run check:core && npm test` | typecheck ✅ · `/lib/core purity: OK` · **1,236/1,236 in 78 files** |

**What M3–M6 mean, and why this is not cosmetics.** The header of `plan/50-tasks.md:7` declares **8** columns and the header of `plan/60-findings.md` declares **8**. A row that splits into 17 cells (`T-003`) or into 6 (`T-042`) is not a typo — it means *every read by column position lands on the wrong column for that row*. M6 is the proof with a consequence attached: a machine asking "is `F-046` still open?" by position reads its `תיקון מוצע` cell and gets the string `✅ נסגר`, which is the right answer **by luck**; ask `F-047` the same way and the register answers with prose. Two ticks ago (`C-0150`) the loop started machine-reading these registers for the first time, and F-056's proposed fix asks the PM to make every ⛔ cell machine-decidable. Both stand on a splitter that does not exist yet.

**The one live case the detector must catch.** `T-066`'s status cell reads `⛔ **חסומה — F-020 + טעינת חומר הניקוד**`. `F-020`'s own status cell reads `✅ **טופל C-0012.**`, and the scoring material landed in `C-0146` (`T-072`, approved `C-0147`). So the register says *blocked by* a finding the register also says is *closed*. F-033 recorded that contradiction on 2026-08-13 and it is still open. **A machine would have caught it the same hour.** Baseline for Task 3: exactly **1** stale ⛔ citation today.

---

## File Structure

- `lib/core/planTable.ts` — **create.** Pure. Row splitting, status classification, citation extraction, eligibility. ⛔ No fs.
- `lib/core/planTable.test.ts` — **create.** Unit tests over literal row strings; ⛔ never reads `plan/`.
- `scripts/measure-plan-tables.mjs` — **create.** Reads the two registers, writes `docs/plan-tables.md`, prints a summary.
- `scripts/measure-plan-tables.test.ts` — **create.** Runs the CLI into a temp path, asserts the ratchet floors.
- `package.json` — **modify.** Add `"measure:plan": "node scripts/measure-plan-tables.mjs"`.
- `docs/plan-tables.md` — **generated and committed**, same standing as `docs/gate-recheck.md`.

---

### Task 1: The pure splitter — `splitRow` and `rowShape`

**Files:**
- Create: `lib/core/planTable.ts`
- Test: `lib/core/planTable.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export interface RowShape {
    readonly id: string;
    readonly cells: readonly string[];
    readonly expected: number;
    readonly ok: boolean;
  }
  export function splitRow(line: string): string[];
  export function rowShape(line: string, expected: number): RowShape | null;
  export const TASK_COLUMNS = 8;
  export const FINDING_COLUMNS = 8;
  ```
  `splitRow` returns **content cells only** — the empty strings before the leading `|` and after the trailing `|` are dropped, so `splitRow('| a | b |')` is `['a','b']`, ⛔ not `['','a','b','']`. Cells are trimmed. A `\|` inside a cell is a literal pipe and is **unescaped in the returned cell** (`'a \| b'` → `'a | b'`). `rowShape` returns `null` for a line that is not a register row (no `| X-NNN |` at the start).

- [x] **Step 1: Write the failing test**

Create `lib/core/planTable.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { splitRow, rowShape, TASK_COLUMNS } from './planTable';

describe('splitRow', () => {
  it('drops the leading and trailing empties and trims', () => {
    expect(splitRow('| T-001 | M0 | build it |')).toEqual(['T-001', 'M0', 'build it']);
  });

  it('treats a backslash-escaped pipe as content, not a column break', () => {
    // Measured M7: the escape is already in use on 10 lines of 50-tasks.md and 7 of
    // 60-findings.md. A splitter that ignores it invents columns out of prose.
    expect(splitRow('| F-004 | fix | if (!payload \\| bad) return |')).toEqual([
      'F-004',
      'fix',
      'if (!payload | bad) return',
    ]);
  });

  it('does not swallow a doubled backslash before a real break', () => {
    expect(splitRow('| a | ends with \\\\ | b |')).toEqual(['a', 'ends with \\', 'b']);
  });
});

describe('rowShape', () => {
  it('returns null for a line that is not a register row', () => {
    expect(rowShape('|---|---|', TASK_COLUMNS)).toBeNull();
    expect(rowShape('some prose', TASK_COLUMNS)).toBeNull();
  });

  it('accepts a row with exactly the declared column count', () => {
    const line = '| T-001 | M0 | task | src | ✅ | 0 | files | — |';
    expect(rowShape(line, TASK_COLUMNS)).toEqual({
      id: 'T-001',
      cells: ['T-001', 'M0', 'task', 'src', '✅', '0', 'files', '—'],
      expected: 8,
      ok: true,
    });
  });

  it('flags a short row — measured M5: T-042 carries six cells, not eight', () => {
    const shape = rowShape('| T-042 | M2 | task | R-014 | ✅ done | — |', TASK_COLUMNS);
    expect(shape?.ok).toBe(false);
    expect(shape?.cells.length).toBe(6);
  });

  it('flags a long row — an unescaped pipe in prose invents columns', () => {
    const shape = rowShape('| T-003 | M1 | a | b | c | d | e | f | g |', TASK_COLUMNS);
    expect(shape?.ok).toBe(false);
    expect(shape?.cells.length).toBe(9);
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/planTable.test.ts`
Expected: FAIL — `Failed to resolve import "./planTable"`.

- [x] **Step 3: Write the minimal implementation**

Create `lib/core/planTable.ts`:

```ts
/**
 * PURE. No React, no DOM, no clock, no env, no I/O — the reader of plan/ registers lives
 * here, the file handles live in scripts/.
 *
 * Why a hand-written splitter and ⛔ not `line.split('|')`: measured C-0151 (M3/M4), 8 of
 * 72 task rows and 23 of 59 finding rows do not split into the 8 columns their header
 * declares. `T-042` splits into six and `F-046` into five, which means a read by column
 * position lands on `תיקון מוצע` while believing it read `סטטוס` (M6). The registers
 * already escape a literal pipe as `\|` on 17 lines (M7); this splitter honours that
 * escape, so prose stops inventing columns and the rows that are genuinely malformed
 * become visible instead of blending in.
 */

export const TASK_COLUMNS = 8;
export const FINDING_COLUMNS = 8;

/** `| T-034 | …` or `| F-046 | …` or `| Q-001 | …` — the ID cell of a real register row. */
const ROW_ID = /^\|\s*([TFQ]-\d{3})\s*\|/;

export interface RowShape {
  readonly id: string;
  readonly cells: readonly string[];
  readonly expected: number;
  readonly ok: boolean;
}

export function splitRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\') {
      const next = line[i + 1];
      // Only `\|` and `\\` are escapes. Any other backslash is content, so a Windows
      // path or a regex in a cell survives unchanged.
      if (next === '|' || next === '\\') {
        current += next;
        i += 1;
        continue;
      }
      current += ch;
      continue;
    }
    if (ch === '|') {
      cells.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current);
  // A well-formed row opens and closes with `|`, so the first and last fragments are the
  // empty strings outside the table. Dropped by position, ⛔ not by emptiness: a genuinely
  // empty first cell is a malformed row and must stay countable.
  return cells.slice(1, -1).map((cell) => cell.trim());
}

export function rowShape(line: string, expected: number): RowShape | null {
  const match = ROW_ID.exec(line);
  if (match === null) return null;
  const id = match[1];
  if (id === undefined) return null;
  const cells = splitRow(line);
  return { id, cells, expected, ok: cells.length === expected };
}
```

- [x] **Step 4: Run the test and the purity gate**

Run: `npx vitest run lib/core/planTable.test.ts && npm run check:core`
Expected: `5 passed` (3 in `splitRow`, 5 in `rowShape` — **8 passed** total) and `/lib/core purity: OK`.

- [x] **Step 5: Prove the splitter on the real files without asserting on them**

Run:
```bash
node --experimental-strip-types -e "
const { rowShape } = await import('./lib/core/planTable.ts');
const { readFileSync } = await import('node:fs');
for (const [f, n] of [['plan/50-tasks.md',8],['plan/60-findings.md',8]]) {
  const bad = readFileSync(f,'utf8').split('\n').map(l=>rowShape(l,n)).filter(r=>r&&!r.ok);
  console.log(f, 'malformed:', bad.length, bad.map(r=>\`\${r.id}:\${r.cells.length}\`).join(' '));
}"
```
Expected, and **write the two numbers you actually see into Task 3 Step 3 as the floors**: `plan/50-tasks.md` reports a small count including `T-042:6`, and `plan/60-findings.md` reports a count including `F-046:5` and `F-047:5`. ⚠️ The escape-aware splitter will report **fewer** malformed rows than M3/M4's naive `awk`, because M3/M4 counted escaped pipes as breaks. ⛔ Do not copy M3/M4's numbers forward — copy what this command prints.

- [x] **Step 6: Commit**

```bash
git add lib/core/planTable.ts lib/core/planTable.test.ts
git commit -m "loop(DEV): C-XXXX planTable — escape-aware row splitter for the plan registers"
```

---

### Task 2: Status classification and stale-citation detection

**Files:**
- Modify: `lib/core/planTable.ts` (append; ⛔ do not restructure Task 1's exports)
- Modify: `lib/core/planTable.test.ts` (append one `describe` per new export)

**Interfaces:**
- Consumes: `splitRow`, `rowShape`, `RowShape`, `TASK_COLUMNS`, `FINDING_COLUMNS` from Task 1.
- Produces:
  ```ts
  export type TaskState = 'done' | 'awaiting-review' | 'open' | 'blocked' | 'cancelled' | 'unknown';
  export function classifyStatus(cell: string): TaskState;
  export function citedFindings(cell: string): string[];
  export interface StaleBlock {
    readonly taskId: string;
    readonly findingId: string;
    readonly findingState: TaskState;
  }
  export function staleBlocks(
    tasks: readonly RowShape[],
    findingStates: ReadonlyMap<string, TaskState>,
  ): StaleBlock[];
  export function eligibleTaskIds(tasks: readonly RowShape[]): string[];
  export const TASK_STATUS_INDEX = 4;
  export const FINDING_STATUS_INDEX = 6;
  ```
  `TASK_STATUS_INDEX` is the 0-based index of `סטטוס` in the 8-column task header (`id · אבן דרך · המשימה · מקור פדגוגי · **סטטוס** · סבבי ביקורת · קבצים · סקיל`). `FINDING_STATUS_INDEX` is the 0-based index of `סטטוס` in the 8-column findings header (`# · חומרה · קובץ:שורה · הממצא · תרחיש הכשל · תיקון מוצע · **סטטוס** · סבב`). Both are read **only** from rows where `shape.ok` is true — a malformed row has no trustworthy status column and is reported as such, ⛔ never guessed.

- [x] **Step 1: Write the failing tests**

Append to `lib/core/planTable.test.ts`:

```ts
import {
  classifyStatus,
  citedFindings,
  staleBlocks,
  eligibleTaskIds,
  TASK_STATUS_INDEX,
  FINDING_STATUS_INDEX,
} from './planTable';
import type { RowShape, TaskState } from './planTable';

const taskRow = (id: string, status: string): RowShape => ({
  id,
  cells: ['', '', '', '', status, '', '', ''],
  expected: 8,
  ok: true,
});

describe('classifyStatus', () => {
  it('reads the first glyph in the cell, not the last', () => {
    // T-050 reads "✅ **בוצעה C-0064.** ⛔ **החצי המדידתי בלבד** …" — done, with a caveat.
    // T-066 reads "⛔ **חסומה — F-020 …**" — blocked. Same two glyphs, opposite verdicts;
    // only the order tells them apart, because the register writes its verdict first.
    expect(classifyStatus('✅ **בוצעה C-0064.** ⛔ החצי המדידתי בלבד')).toBe('done');
    expect(classifyStatus('⛔ **חסומה — F-020 + טעינת חומר הניקוד**')).toBe('blocked');
  });

  it('maps each glyph the registers actually use', () => {
    const cases: ReadonlyArray<readonly [string, TaskState]> = [
      ['✅', 'done'],
      ['🟣 ממתין לסקירת Critic', 'awaiting-review'],
      ['⬜ **לפני השקה**', 'open'],
      ['⛔ חסום — פעולה אנושית', 'blocked'],
      ['🚫 **בוטלה — הוחלפה ב-T-010**', 'cancelled'],
      ['🔓 פתוח → PM', 'open'],
      ['prose with no glyph', 'unknown'],
    ];
    for (const [cell, expected] of cases) expect(classifyStatus(cell)).toBe(expected);
  });
});

describe('citedFindings', () => {
  it('pulls every finding ID out of a blocked cell', () => {
    expect(citedFindings('⛔ **חסומה — F-020 + טעינת חומר הניקוד**')).toEqual(['F-020']);
    expect(citedFindings('⛔ חסום ב-F-020 ואחר כך ב-F-033')).toEqual(['F-020', 'F-033']);
  });

  it('returns nothing for a blocker that cites no finding', () => {
    // T-019 · T-043 · T-046 cite a human action; T-034 cites P-001, which is not a finding.
    expect(citedFindings('⛔ **חסום — פעולה אנושית**')).toEqual([]);
    expect(citedFindings('⛔ חסום ב-P-001 (אין תוכן מורשה)')).toEqual([]);
  });

  it('does not report the same finding twice', () => {
    expect(citedFindings('⛔ F-020 ועוד F-020')).toEqual(['F-020']);
  });
});

describe('staleBlocks', () => {
  it('flags a ⛔ cell whose cited finding is closed — the live T-066 case', () => {
    const findings = new Map<string, TaskState>([['F-020', 'done']]);
    expect(staleBlocks([taskRow('T-066', '⛔ חסומה — F-020')], findings)).toEqual([
      { taskId: 'T-066', findingId: 'F-020', findingState: 'done' },
    ]);
  });

  it('stays silent when the cited finding is still open', () => {
    const findings = new Map<string, TaskState>([['F-052', 'open']]);
    expect(staleBlocks([taskRow('T-066', '⛔ חסומה — F-052')], findings)).toEqual([]);
  });

  it('stays silent for an unknown finding rather than guessing it closed', () => {
    expect(staleBlocks([taskRow('T-066', '⛔ חסומה — F-999')], new Map())).toEqual([]);
  });

  it('ignores a non-blocked row that happens to mention a closed finding', () => {
    const findings = new Map<string, TaskState>([['F-020', 'done']]);
    expect(staleBlocks([taskRow('T-070', '✅ נסגר — סוגר את F-020')], findings)).toEqual([]);
  });
});

describe('eligibleTaskIds', () => {
  it('returns only ⬜ rows, and never a malformed one', () => {
    const malformed: RowShape = { id: 'T-042', cells: ['T-042'], expected: 8, ok: false };
    const rows = [
      taskRow('T-004', '⬜'),
      taskRow('T-066', '⛔ חסומה'),
      taskRow('T-001', '✅'),
      malformed,
    ];
    expect(eligibleTaskIds(rows)).toEqual(['T-004']);
  });
});

describe('column indices', () => {
  it('points at the סטטוס column of each header, measured from the header row', () => {
    expect(TASK_STATUS_INDEX).toBe(4);
    expect(FINDING_STATUS_INDEX).toBe(6);
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/planTable.test.ts`
Expected: FAIL — `classifyStatus is not a function` (or an import error naming the new exports). ⚠️ If instead it fails on `TASK_STATUS_INDEX`, you appended the import to the wrong file.

- [x] **Step 3: Write the minimal implementation**

Append to `lib/core/planTable.ts`:

```ts
export type TaskState =
  | 'done'
  | 'awaiting-review'
  | 'open'
  | 'blocked'
  | 'cancelled'
  | 'unknown';

/** 0-based index of `סטטוס` in each 8-column header. Read only when `shape.ok`. */
export const TASK_STATUS_INDEX = 4;
export const FINDING_STATUS_INDEX = 6;

const STATE_GLYPHS: ReadonlyArray<readonly [string, TaskState]> = [
  ['✅', 'done'],
  ['🟣', 'awaiting-review'],
  ['⬜', 'open'],
  ['🔓', 'open'],
  ['⛔', 'blocked'],
  ['🚫', 'cancelled'],
];

/**
 * The FIRST glyph in the cell decides. Measured: `T-050` opens `✅` and then carries a `⛔`
 * caveat about what it did not cover, while `T-066` opens `⛔` and cites the reason. Both
 * cells contain both glyphs; a "contains ⛔ ⇒ blocked" rule marks a finished task blocked,
 * and a "contains ✅ ⇒ done" rule marks a blocked task finished. Only the order separates
 * them, because the register states its verdict before its caveats.
 */
export function classifyStatus(cell: string): TaskState {
  let best: TaskState = 'unknown';
  let bestAt = Number.POSITIVE_INFINITY;
  for (const [glyph, state] of STATE_GLYPHS) {
    const at = cell.indexOf(glyph);
    if (at !== -1 && at < bestAt) {
      bestAt = at;
      best = state;
    }
  }
  return best;
}

const FINDING_REF = /\bF-\d{3}\b/g;

export function citedFindings(cell: string): string[] {
  // A Set, because a cell is allowed to argue its case twice and a duplicate citation
  // would otherwise become a duplicate stale-block report.
  return [...new Set(cell.match(FINDING_REF) ?? [])];
}

export interface StaleBlock {
  readonly taskId: string;
  readonly findingId: string;
  readonly findingState: TaskState;
}

/**
 * F-050's rule, mechanised: a ⛔ cell that cites a finding the findings register calls
 * closed is a blocker that has already lifted. ⛔ Silent on a citation we cannot resolve —
 * an unknown ID means the registers disagree about which findings exist, which is a
 * different defect and is reported separately by the CLI.
 */
export function staleBlocks(
  tasks: readonly RowShape[],
  findingStates: ReadonlyMap<string, TaskState>,
): StaleBlock[] {
  const out: StaleBlock[] = [];
  for (const row of tasks) {
    if (!row.ok) continue;
    const cell = row.cells[TASK_STATUS_INDEX];
    if (cell === undefined || classifyStatus(cell) !== 'blocked') continue;
    for (const findingId of citedFindings(cell)) {
      const state = findingStates.get(findingId);
      if (state === 'done') out.push({ taskId: row.id, findingId, findingState: state });
    }
  }
  return out;
}

export function eligibleTaskIds(tasks: readonly RowShape[]): string[] {
  return tasks
    .filter((row) => {
      if (!row.ok) return false;
      const cell = row.cells[TASK_STATUS_INDEX];
      return cell !== undefined && classifyStatus(cell) === 'open';
    })
    .map((row) => row.id);
}
```

- [x] **Step 4: Run the tests, the purity gate, and typecheck**

Run: `npx vitest run lib/core/planTable.test.ts && npm run check:core && npm run typecheck`
Expected: all green; `/lib/core purity: OK`; zero TS errors.

- [x] **Step 5: Mutate to prove the order rule is load-bearing**

Temporarily reorder `STATE_GLYPHS` so `['⛔','blocked']` sits first, and change `classifyStatus` to return on first match instead of first *position*. Run `npx vitest run lib/core/planTable.test.ts`.
Expected: the `reads the first glyph in the cell, not the last` case FAILS on `T-050` (`'blocked'` received, `'done'` expected). Restore the file and re-run to green. ⛔ Do not commit the mutation.

- [x] **Step 6: Commit**

```bash
git add lib/core/planTable.ts lib/core/planTable.test.ts
git commit -m "loop(DEV): C-XXXX planTable — status classification and stale-blocker detection"
```

---

### Task 3: The reporter, the ratchet, and the finding

**Files:**
- Create: `scripts/measure-plan-tables.mjs`
- Create: `scripts/measure-plan-tables.test.ts`
- Create (generated, committed): `docs/plan-tables.md`
- Modify: `package.json` — add `"measure:plan"`
- Modify: `plan/60-findings.md` — Dev opens **one** new finding row (this is Dev writing a finding against the registers, which `plan/00-control.md` allows; ⛔ Dev does not edit any existing row)

**Interfaces:**
- Consumes: every export from Tasks 1–2.
- Produces: the CLI honours `PLAN_TABLES_OUT` to redirect its output file, exactly as `measure-gate.mjs` honours `GATE_REPORT_OUT` (`scripts/measure-gate.mjs:42`), so the test can run it without touching the committed report. Stdout is four lines: `tasks: N rows, M malformed`, `findings: N rows, M malformed`, `eligible: <ids or none>`, `stale blockers: <taskId cites findingId (closed)>` (one line per stale block, or `stale blockers: none`).

- [x] **Step 1: Write the reporter**

Create `scripts/measure-plan-tables.mjs`. The `registerHooks` block is copied verbatim from `scripts/measure-gate.mjs:16-34` — it is what lets a `.mjs` import a `.ts` module in this repo.

```js
#!/usr/bin/env node
/**
 * F-050 + F-056, mechanised — "is there Dev-eligible work, and is any ⛔ cell stale?"
 * in one command.
 *
 * ⛔ Read-only over plan/. The one file it writes is docs/plan-tables.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return withTsFormat(nextResolve(`${specifier}.ts`, context));
      } catch {
        // Not a TypeScript sibling — fall through to the default resolver.
      }
    }
    return withTsFormat(nextResolve(specifier, context));
  },
});

function withTsFormat(resolved) {
  if (resolved && typeof resolved.url === 'string' && resolved.url.endsWith('.ts')) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}

const {
  rowShape,
  classifyStatus,
  staleBlocks,
  eligibleTaskIds,
  TASK_COLUMNS,
  FINDING_COLUMNS,
  FINDING_STATUS_INDEX,
} = await import('../lib/core/planTable.ts');

const TASKS_FILE = join('plan', '50-tasks.md');
const FINDINGS_FILE = join('plan', '60-findings.md');
const OUT = process.env.PLAN_TABLES_OUT || join('docs', 'plan-tables.md');

const shapesOf = (file, columns) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => rowShape(line, columns))
    .filter((shape) => shape !== null);

const taskRows = shapesOf(TASKS_FILE, TASK_COLUMNS);
const findingRows = shapesOf(FINDINGS_FILE, FINDING_COLUMNS);

const findingStates = new Map();
for (const row of findingRows) {
  if (!row.ok) continue;
  const cell = row.cells[FINDING_STATUS_INDEX];
  if (cell !== undefined) findingStates.set(row.id, classifyStatus(cell));
}

const badTasks = taskRows.filter((r) => !r.ok);
const badFindings = findingRows.filter((r) => !r.ok);
const eligible = eligibleTaskIds(taskRows);
const stale = staleBlocks(taskRows, findingStates);

const shapeLine = (r) => `| \`${r.id}\` | ${r.cells.length} | ${r.expected} |`;
const report = [
  '<!-- GENERATED by scripts/measure-plan-tables.mjs — ⛔ do not edit by hand. -->',
  '',
  '# מצב הרגיסטרים — קריאה מכונה',
  '',
  `- \`${TASKS_FILE}\`: ${taskRows.length} שורות, ${badTasks.length} פגומות`,
  `- \`${FINDINGS_FILE}\`: ${findingRows.length} שורות, ${badFindings.length} פגומות`,
  '',
  '## שורות שאינן נקראות לפי עמודה',
  '',
  '| שורה | תאים בפועל | תאים בכותרת |',
  '|---|---|---|',
  ...[...badTasks, ...badFindings].map(shapeLine),
  '',
  '## משימות פנויות ל-Dev (⬜)',
  '',
  eligible.length === 0 ? '⛔ אין.' : eligible.map((id) => `- \`${id}\``).join('\n'),
  '',
  '## חסמים ⛔ שמצטטים ממצא סגור',
  '',
  stale.length === 0
    ? '⛔ אין.'
    : stale.map((s) => `- \`${s.taskId}\` מצטטת \`${s.findingId}\`, שסטטוסה \`done\``).join('\n'),
  '',
].join('\n');

writeFileSync(OUT, report, 'utf8');

console.log(`tasks: ${taskRows.length} rows, ${badTasks.length} malformed`);
console.log(`findings: ${findingRows.length} rows, ${badFindings.length} malformed`);
console.log(`eligible: ${eligible.length === 0 ? 'none' : eligible.join(' ')}`);
if (stale.length === 0) console.log('stale blockers: none');
for (const s of stale) console.log(`stale blockers: ${s.taskId} cites ${s.findingId} (closed)`);
console.log(`wrote ${OUT}`);
```

- [x] **Step 2: Run it and read the real numbers**

Run: `node scripts/measure-plan-tables.mjs`
Expected: four-plus lines of stdout and `wrote docs/plan-tables.md`. **Write down `tasks: N rows, M malformed`, `findings: N rows, M malformed`, and the eligible/stale lines verbatim** — Step 3 turns them into floors, and Step 8 quotes them into the finding. ⚠️ Expect `stale blockers: T-066 cites F-020 (closed)`. If that line is absent, ⛔ do not proceed: either `F-020`'s row is malformed and its status was skipped, or `classifyStatus` disagrees with the register. Diagnose with `superpowers:systematic-debugging` before writing the guard.

- [x] **Step 3: Write the ratchet test**

Create `scripts/measure-plan-tables.test.ts`, substituting the numbers Step 2 printed for `<…>`:

```ts
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const OUT_DIR = mkdtempSync(join(tmpdir(), 'plan-tables-'));
const FRESH = join(OUT_DIR, 'plan-tables.md');
const stdout = execFileSync('node', ['scripts/measure-plan-tables.mjs'], {
  encoding: 'utf8',
  env: { ...process.env, PLAN_TABLES_OUT: FRESH },
});

/**
 * A RATCHET, ⛔ not an assertion of correctness. `plan/50-tasks.md` belongs to the PM and
 * `plan/60-findings.md` to the Critic; a Dev test that demanded zero malformed rows would
 * redden the tree on someone else's prose and hand the Critic a red suite that means
 * nothing — the exact shape of F-030. So the ceilings are the measured counts of C-0151,
 * and only a WORSENING fails. Repairs lower the ceiling; ⛔ nothing raises it silently.
 */
const MALFORMED_TASKS_CEILING = <N from Step 2>;
const MALFORMED_FINDINGS_CEILING = <N from Step 2>;

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

  it('detects the live stale blocker — T-066 is blocked by a closed F-020', () => {
    // ⚠️ This assertion is expected to STOP being true, and that is the success case:
    // when the PM rewrites T-066's ⛔ cell, delete this test in the same commit and say
    // so in the journal. ⛔ Do not weaken it to a regex that also passes on "none".
    expect(stdout).toContain('stale blockers: T-066 cites F-020 (closed)');
  });

  it('writes a report that names the malformed rows', () => {
    const fresh = readFileSync(FRESH, 'utf8');
    expect(fresh).toContain('GENERATED by scripts/measure-plan-tables.mjs');
    expect(fresh).toContain('`T-042`');
  });

  it('leaves the committed report identical to a fresh run', () => {
    // The committed docs/plan-tables.md is evidence, ⛔ not decoration: if it drifts from
    // what the script produces, the next agent reads a stale answer and trusts it.
    expect(readFileSync(join('docs', 'plan-tables.md'), 'utf8')).toBe(readFileSync(FRESH, 'utf8'));
  });
});
```

- [x] **Step 4: Run it and watch the ratchet bite**

Run: `npx vitest run scripts/measure-plan-tables.test.ts`
Expected: PASS. Then temporarily lower `MALFORMED_TASKS_CEILING` by 1 and re-run.
Expected: FAIL on `never lets the malformed-row count grow`. Restore it. ⛔ Do not commit the mutation.

- [x] **Step 5: Wire the npm script**

In `package.json`, add after `"measure:gate"`:

```json
"measure:plan": "node scripts/measure-plan-tables.mjs",
```

⛔ Do **not** add it to `"verify"`: `verify` is the gate that decides whether code ships, and a report over someone else's prose is not that. The vitest file above already runs inside `npm test`.

- [x] **Step 6: Regenerate and commit the report**

Run: `npm run measure:plan`
Expected: `wrote docs/plan-tables.md`.

- [x] **Step 7: Run the full gate**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: typecheck clean · `/lib/core purity: OK` · **1,236 + the tests added by Tasks 1–3** (count the delta against 1,236 and state the exact number in the journal — ⛔ "all passed" is not a measurement) · `build` exit 0.

- [x] **Step 8: Open one finding, ⛔ and repair nothing**

Append **one** row to `plan/60-findings.md` — a correctly-shaped 8-cell row, escaping every literal `|` as `\|`:

| field | content |
|---|---|
| # | the next free `F-0NN` (`git pull` first, then max+1) |
| חומרה | `🟡 MEDIUM · **פגם (רגיסטר שאינו נקרא לפי עמודה) · נפתח על ידי DEV (C-XXXX)**` |
| קובץ:שורה | `plan/50-tasks.md` — `T-042` · `plan/60-findings.md` — `F-046` · `F-047` |
| הממצא | the counts Step 2 printed, and: `T-042` carries 6 of 8 cells; `F-046` and `F-047` carry 5 of 8, so their closure verdict sits in the `תיקון מוצע` column |
| תרחיש הכשל | a machine asking "is `F-047` open?" by column position reads its `תרחיש הכשל` prose and gets neither open nor closed — and `C-0150` began machine-reading these registers, while F-056 asks the PM to make every ⛔ cell machine-decidable |
| תיקון מוצע | the owner of each register restores the missing cells (PM for `50-tasks.md`, Critic for `60-findings.md`); `npm run measure:plan` names the rows and the ceilings in `scripts/measure-plan-tables.test.ts` drop with each repair |
| סטטוס | `🔓 פתוח → PM + CRITIC` |
| סבב | `C-XXXX` |

- [x] **Step 9: Commit and close the tick**

Update `plan/30-architecture.md` (a line under the new cycle), `plan/50-tasks.md` (⛔ **only** if the PM has minted a task ID for this work — otherwise leave it alone and say so in the journal), `plan/00-control.md` (`CYCLE_ID`, `NEXT_AGENT=CRITIC`, release the lock, `MILESTONE_TICKS` +1).

```bash
git add lib/core/planTable.ts lib/core/planTable.test.ts \
        scripts/measure-plan-tables.mjs scripts/measure-plan-tables.test.ts \
        docs/plan-tables.md package.json plan/
git commit -m "loop(DEV): C-XXXX measure:plan — the registers answer 'is there Dev work?' in one command"
git push origin dev
```

---

## Self-Review

**Spec coverage.** F-050 ("every ⛔ cell names a command that decides whether it still holds") → Task 2 `staleBlocks` + Task 3 Step 2, and `npm run measure:plan` *is* that command. F-056 ("the next Dev repeats the same five-file read and ends in a quiet tick") → Task 2 `eligibleTaskIds` + the `eligible:` stdout line. RULES § 0.1.1 ו׳ ("a ceiling that only counts is not a brake") → the ratchet in Task 3 Step 3, which fails on worsening rather than on the current state.

**Placeholder scan.** The only `<…>` in this plan are the two ceiling numbers in Task 3 Step 3, and Step 2 is the command that produces them — deliberately not guessed here, because M3/M4 counted with a naive splitter and would seed the ratchet wrong. Every other code block is complete and compiles as written.

**Type consistency.** `RowShape` is produced by Task 1 and consumed unchanged by Task 2's `staleBlocks`/`eligibleTaskIds` and Task 3's CLI. `TaskState` is produced by `classifyStatus` and is the value type of the `findingStates` map. `TASK_STATUS_INDEX` (4) is read only inside `lib/core/planTable.ts`; `FINDING_STATUS_INDEX` (6) is exported because the CLI builds the findings map itself. `PLAN_TABLES_OUT` is named identically in the CLI and the test.

**Known gap, stated rather than hidden.** `classifyStatus` reads the first glyph in the cell. A register row that opens with a glyph inside a quotation of an earlier status (`"[לשעבר 🟣] ✅ אושר…"`) would classify as `awaiting-review`. Measured C-0151: rows using the `[לשעבר …]` form put the live verdict first, so no row misreads today — but the day one does, the fix is a rule about the `[לשעבר` prefix, ⛔ not a heuristic about which glyph "looks live".
