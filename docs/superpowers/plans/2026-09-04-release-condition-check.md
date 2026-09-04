# Release Condition Auto-Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `scripts/measure-plan-tables.mjs` a new section that catches a task or finding
whose declared release condition is already numerically fulfilled while the row is still
marked blocked/open — the exact failure `D-097` measured by hand (D-035's two conditions on
"sentences" were both filled while the tile stayed locked, because nothing re-checked them).

**Architecture:** Add one declared marker to the existing "cell carries a hidden field" idiom
already used by `BLOCKER_MARKER` (`חסם:`) and `CONTINUATION_MARKER` (`המשך של:`) in
`lib/core/planTable.ts`: `תנאי שחרור: <have>/<need>`. A row that carries it declares its own
release condition as a plain count — the same rule `D-046` already imposes on locked-tile
copy in the product itself ("an opening condition is a count, never a date, never a judgment
call"), applied reflexively to the registers that describe it. Two pure functions read the
marker and report a fulfilled-but-still-locked row; `scripts/measure-plan-tables.mjs` wires
them into the report it already writes to `docs/plan-tables.md`. It only reports — it never
flips a status cell itself, matching the task's own requirement and `RULES`' declared-not-
inferred pattern used everywhere else in this file.

**Tech Stack:** TypeScript (`lib/core/`, pure, no I/O), Node ESM script (`scripts/`), Vitest.

**Spec:** `plan/50-tasks.md` row `T-166` (`grep -n '^| T-166 |' plan/50-tasks.md`) — background:
`D-097`, `D-096`, `D-035`, `D-046` in `plan/40-decisions.md` (full text of the tombstoned ones
in `plan/archive/decisions-archive.md`, `grep -n -A 30 '^#### D-096' plan/archive/decisions-archive.md`
per `docs/agents/DEV.md`'s closing note on tombstones).

## File Structure

Both files this plan touches already exist and already have open-work history against
them (`scripts/measure-plan-tables.mjs` — `T-101`, register-hygiene/splitter work;
`lib/core/planTable.ts` — `T-129`, the same). **NOT an extension of T-101 or T-129**: both
of those rows closed a different defect class (malformed rows / stale citation blockers)
and are done; this plan adds an independent, additive check (a new declared marker + two
new exported functions + one new report section) that touches the same two files only
because they are where all register-reading logic already lives — see `RULES § 0.6ב`,
"the register already proved a declared field inside a cell works." No task row is
continued; `T-166` is the only row this plan closes.

- `lib/core/planTable.ts` — MODIFY. Adds `RELEASE_CONDITION_MARKER`, `ReleaseCondition`,
  `releaseCondition()`, `FulfilledCondition`, `fulfilledReleaseConditions()`. Pure logic
  only, same file that already holds `BLOCKER_MARKER`/`citedTasks`/`staleTaskBlocks`.
- `lib/core/planTable.test.ts` — MODIFY. Unit tests for both new functions, fixture-based,
  no file I/O — same pattern as the existing `staleTaskBlocks` describe block.
- `scripts/measure-plan-tables.mjs` — MODIFY. Makes `TASKS_FILE` overridable via
  `PLAN_TASKS_FILE` (needed so Task 2's fixture test can point at a temp copy of the
  register instead of mutating the real one), computes the two fulfilled-condition lists,
  and adds one report section + two `console.log` lines. No new file, no new npm script.
- `scripts/measure-plan-tables.test.ts` — MODIFY. One CLI-level "stays none on the real
  registers" assertion (matches the existing `stale blockers: none` /
  `stale task blockers: none` pattern) and one fixture-based test that edits a temp copy
  of `plan/50-tasks.md` to prove the report actually surfaces a fulfilled condition.

## Global Constraints

- `/lib/core/` is PURE — zero React, window, document, localStorage, fetch, process.env
  (`docs/agents/DEV.md` STEP 5). Both new functions in `lib/core/planTable.ts` must stay
  pure string/array logic, exactly like `citedTasks`/`staleTaskBlocks` beside them.
- TypeScript, no `any` (`docs/agents/DEV.md` STEP 5).
- The check REPORTS ONLY — it must never rewrite a task/finding status cell itself. The
  register row (`plan/50-tasks.md:223`, T-166's own text) says this explicitly: "it does
  NOT change status by itself — it reports, and the decision stays human."
- No new file, no new npm script — the output goes into `docs/plan-tables.md`, which
  `scripts/measure-plan-tables.mjs` already generates every tick.
- `docs/plan-tables.md` and `docs/plan-open.md` are GENERATED — regenerate both with
  `npm run measure:plan` in the same commit as any change to the generator or to the
  functions it calls (`docs/agents/DEV.md` STEP 2, "⚠️ Edited a register?").
- Declared, never inferred — the marker is read literally after a fixed marker string,
  the same way `BLOCKER_MARKER`/`CONTINUATION_MARKER` are (`lib/core/planTable.ts:176-198`,
  `:468-486`). No NLP, no guessing a condition out of free prose.

---

### Task 1: `releaseCondition` + `fulfilledReleaseConditions` in `lib/core/planTable.ts`

**Files:**
- Modify: `lib/core/planTable.ts` (add after `staleTaskBlocks`, i.e. after line 267, before
  `eligibleTaskIds` at line 269)
- Test: `lib/core/planTable.test.ts` (add a new `describe` block after the existing
  `describe('staleTaskBlocks', ...)` block, which ends at line 241)

**Interfaces:**
- Consumes: `RowShape`, `TaskState`, `classifyStatus` — all already defined/exported in
  `lib/core/planTable.ts` (lines 20-25, 124-163).
- Produces (for Task 2):
  - `export const RELEASE_CONDITION_MARKER = 'תנאי שחרור:'`
  - `export interface ReleaseCondition { readonly have: number; readonly need: number }`
  - `export function releaseCondition(cell: string): ReleaseCondition | null`
  - `export interface FulfilledCondition { readonly id: string; readonly have: number; readonly need: number }`
  - `export function fulfilledReleaseConditions(rows: readonly RowShape[], statusIndex: number, targetState: TaskState): FulfilledCondition[]`

- [ ] **Step 1: Write the failing tests for `releaseCondition`**

Add to `lib/core/planTable.test.ts`, directly after the closing `});` of the
`describe('staleTaskBlocks', ...)` block (line 241):

```typescript
import { releaseCondition, fulfilledReleaseConditions } from './planTable';
import type { ReleaseCondition, FulfilledCondition } from './planTable';

describe('releaseCondition', () => {
  it('reads a have/need pair right after the marker', () => {
    expect(releaseCondition('⛔ חסום. תנאי שחרור: 2/2')).toEqual({ have: 2, need: 2 });
    expect(releaseCondition('⛔ חסום — עדיין. תנאי שחרור: 0/2 (ⓐ F-020 · ⓑ הבדיקה החוזרת)')).toEqual(
      { have: 0, need: 2 },
    );
  });

  it('returns null when the cell carries no marker', () => {
    expect(releaseCondition('⛔ **חסום — פעולה אנושית**')).toBeNull();
  });

  it('returns null when the marker is present but is not followed by have/need', () => {
    expect(releaseCondition('⛔ חסום. תנאי שחרור: עוד לא נספר')).toBeNull();
  });

  it('returns null when need is 0 — a condition cannot need zero of itself', () => {
    expect(releaseCondition('⛔ חסום. תנאי שחרור: 0/0')).toBeNull();
  });

  it('reads only the first have/need pair after the marker, ignoring numbers in later prose', () => {
    expect(releaseCondition('⛔ חסום. תנאי שחרור: 1/2 (עוד 3 ימים משוער)')).toEqual({
      have: 1,
      need: 2,
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/core/planTable.test.ts -t releaseCondition`
Expected: FAIL — `releaseCondition` is not exported from `./planTable` (TS2305 / import error),
so every test in the block fails at the import.

- [ ] **Step 3: Implement `RELEASE_CONDITION_MARKER` and `releaseCondition`**

In `lib/core/planTable.ts`, insert immediately after the closing `}` of `staleTaskBlocks`
(line 267), before `export function eligibleTaskIds` (line 269):

```typescript
/**
 * The declared numeric release-condition marker — the same idiom as `BLOCKER_MARKER` and
 * `CONTINUATION_MARKER`: declared, never inferred. `D-046` already binds this exact rule
 * onto the product itself — "an opening condition is a COUNT, never a date, never a
 * judgment call" — this applies it reflexively to the registers that describe conditions.
 * A ⛔ or 🔓 cell that carries a countable release condition writes
 * `תנאי שחרור: <have>/<need>`, and `releaseCondition` reads it back exactly: no partial
 * credit, no rounding, no guessing at a count from prose that does not use the marker.
 */
export const RELEASE_CONDITION_MARKER = 'תנאי שחרור:';

export interface ReleaseCondition {
  readonly have: number;
  readonly need: number;
}

const RELEASE_CONDITION_RE = /(\d+)\s*\/\s*(\d+)/;

/**
 * Parses the `have/need` pair immediately after the marker. `null` when the cell carries
 * no marker, when the text right after it does not start with a `have/need` pair, or when
 * `need` is 0 (a condition cannot need zero of itself — that is a malformed marker, not a
 * fulfilled one). A cell that declares the marker but writes it wrong stays silent here and
 * is a register-hygiene defect for a human to fix, not something this function guesses at.
 */
export function releaseCondition(cell: string): ReleaseCondition | null {
  const at = cell.indexOf(RELEASE_CONDITION_MARKER);
  if (at === -1) return null;
  const after = cell.slice(at + RELEASE_CONDITION_MARKER.length);
  const match = RELEASE_CONDITION_RE.exec(after);
  if (match === null) return null;
  const have = Number(match[1]);
  const need = Number(match[2]);
  if (need === 0) return null;
  return { have, need };
}
```

- [ ] **Step 4: Run the tests to verify `releaseCondition` passes**

Run: `npx vitest run lib/core/planTable.test.ts -t releaseCondition`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the failing tests for `fulfilledReleaseConditions`**

Append to the same new section of `lib/core/planTable.test.ts`, after the
`describe('releaseCondition', ...)` block:

```typescript
describe('fulfilledReleaseConditions', () => {
  const row = (id: string, status: string): RowShape => ({
    id,
    cells: ['', '', '', '', status, '', '', ''],
    expected: 8,
    ok: true,
  });
  const finding = (id: string, status: string): RowShape => ({
    id,
    cells: ['', '', '', '', '', '', status, ''],
    expected: 8,
    ok: true,
  });

  it('flags a ⛔ task whose declared condition is fully met — the D-097 case', () => {
    const rows = [row('T-199', '⛔ חסומה. תנאי שחרור: 2/2 (ⓐ F-020 נסגר · ⓑ נספר מחדש)')];
    expect(fulfilledReleaseConditions(rows, TASK_STATUS_INDEX, 'blocked')).toEqual([
      { id: 'T-199', have: 2, need: 2 },
    ]);
  });

  it('stays silent when the declared condition is only partly met', () => {
    const rows = [row('T-199', '⛔ חסומה. תנאי שחרור: 1/2 (ⓐ F-020 נסגר · ⓑ עדיין לא)')];
    expect(fulfilledReleaseConditions(rows, TASK_STATUS_INDEX, 'blocked')).toEqual([]);
  });

  it('stays silent on a ⛔ row that carries no release-condition marker at all', () => {
    const rows = [row('T-043', '⛔ **חסום — פעולה אנושית**')];
    expect(fulfilledReleaseConditions(rows, TASK_STATUS_INDEX, 'blocked')).toEqual([]);
  });

  it('ignores a row whose state does not match targetState, even if fulfilled', () => {
    // A task marked ✅ done that still carries a stale marker must not be reported —
    // the marker only means something on the state the caller asks about.
    const rows = [row('T-100', '✅ בוצעה. תנאי שחרור: 2/2 (נשאר מהניסוח הישן)')];
    expect(fulfilledReleaseConditions(rows, TASK_STATUS_INDEX, 'blocked')).toEqual([]);
  });

  it('flags an open 🔓 finding whose declared condition is fully met (ⓑ)', () => {
    const rows = [finding('F-050', '🔓 פתוח. תנאי שחרור: 3/3 (שלושת התיקונים נחתו)')];
    expect(fulfilledReleaseConditions(rows, FINDING_STATUS_INDEX, 'open')).toEqual([
      { id: 'F-050', have: 3, need: 3 },
    ]);
  });

  it('over-fulfilled counts as fulfilled — have can exceed need', () => {
    const rows = [row('T-005', '⛔ חסומה. תנאי שחרור: 3/2 (תנאי שלישי התווסף ומולא גם הוא)')];
    expect(fulfilledReleaseConditions(rows, TASK_STATUS_INDEX, 'blocked')).toEqual([
      { id: 'T-005', have: 3, need: 2 },
    ]);
  });

  it('skips a malformed row', () => {
    const malformed: RowShape = { id: 'T-999', cells: ['a', 'b'], expected: 8, ok: false };
    expect(fulfilledReleaseConditions([malformed], TASK_STATUS_INDEX, 'blocked')).toEqual([]);
  });
});
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npx vitest run lib/core/planTable.test.ts -t fulfilledReleaseConditions`
Expected: FAIL — `fulfilledReleaseConditions` is not exported from `./planTable`.

- [ ] **Step 7: Implement `FulfilledCondition` and `fulfilledReleaseConditions`**

In `lib/core/planTable.ts`, immediately after the `releaseCondition` function from Step 3:

```typescript
export interface FulfilledCondition {
  readonly id: string;
  readonly have: number;
  readonly need: number;
}

/**
 * Rows — task or finding, same 8-cell shape — sitting in `targetState` whose declared
 * release condition is already met. `staleBlocks`/`staleTaskBlocks` catch a blocker that
 * cites another row by ID; this catches the other kind `D-097` measured: a condition that
 * was never a row ID at all, only a count nobody re-checked after `D-046` overrode `D-035`.
 * ⛔ It does NOT change status — it only reports; the decision stays human (`T-166`).
 *
 * `targetState` is a parameter, not hard-coded, because the two callers need different
 * states: a task's condition matters while it sits ⛔ blocked; a finding's condition
 * matters while it sits 🔓 open (`classifyStatus` maps 🔓 to `'open'`, same as ⬜) — a
 * finding has no separate "blocked" state of its own.
 */
export function fulfilledReleaseConditions(
  rows: readonly RowShape[],
  statusIndex: number,
  targetState: TaskState,
): FulfilledCondition[] {
  const out: FulfilledCondition[] = [];
  for (const row of rows) {
    if (!row.ok) continue;
    const cell = row.cells[statusIndex];
    if (cell === undefined || classifyStatus(cell) !== targetState) continue;
    const cond = releaseCondition(cell);
    if (cond !== null && cond.have >= cond.need) {
      out.push({ id: row.id, have: cond.have, need: cond.need });
    }
  }
  return out;
}
```

- [ ] **Step 8: Run the full `planTable.test.ts` file to verify everything passes**

Run: `npx vitest run lib/core/planTable.test.ts`
Expected: PASS, all tests including the pre-existing ones (no regressions).

- [ ] **Step 9: Commit**

```bash
./scripts/g add lib/core/planTable.ts lib/core/planTable.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-166 add releaseCondition + fulfilledReleaseConditions to planTable.ts"
```
(`C-XXXX` = next cycle id, per `docs/agents/DEV.md` STEP 7: `./scripts/g pull` then max+1 over
what is on `dev` right now.)

---

### Task 2: Wire the check into `scripts/measure-plan-tables.mjs` and report it

**Files:**
- Modify: `scripts/measure-plan-tables.mjs` (import list at lines 33-53, report array at
  lines 86-118, console.log block at lines 527-543)
- Test: `scripts/measure-plan-tables.test.ts` (add after the existing
  `it('holds every ⛔ cell to a task blocker that has not already been delivered', ...)`
  block, which ends at line 112)

**Interfaces:**
- Consumes: `fulfilledReleaseConditions`, `TASK_STATUS_INDEX`, `FINDING_STATUS_INDEX` from
  Task 1 (`lib/core/planTable.ts`), plus `taskRows`/`findingRows` already computed in
  `scripts/measure-plan-tables.mjs` at lines 69-70.
- Produces: a `## תנאי שחרור שהתמלא — והשורה עדיין נעולה` section in `docs/plan-tables.md`,
  and two new stdout lines: `fulfilled release conditions (tasks): none` /
  `fulfilled release conditions (findings): none` (or, when non-empty, one line per row in
  the same style as the existing `stale blockers: ...` / `stale task blockers: ...` lines at
  `scripts/measure-plan-tables.mjs:534-539`).

- [ ] **Step 1: Write the failing CLI-level test**

Add to `scripts/measure-plan-tables.test.ts`, directly after the closing `});` of the
`it('holds every ⛔ cell to a task blocker that has not already been delivered', ...)` block
(line 112):

```typescript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run scripts/measure-plan-tables.test.ts -t "release condition"`
Expected: FAIL — the first assertion fails because the stdout lines do not exist yet; the
second fails both because those stdout/report strings do not exist yet AND because
`PLAN_TASKS_FILE` is not yet read by the script (still hard-coded at line 55).

- [ ] **Step 3: Make `TASKS_FILE` overridable, add the import, compute the two lists**

In `scripts/measure-plan-tables.mjs`, change line 55 from:

```javascript
const TASKS_FILE = join('plan', '50-tasks.md');
```

to:

```javascript
const TASKS_FILE = process.env.PLAN_TASKS_FILE || join('plan', '50-tasks.md');
```

Add `fulfilledReleaseConditions` to the destructured import block (lines 33-53), inside the
existing `const { ... } = await import('../lib/core/planTable.ts');`:

```javascript
  fulfilledReleaseConditions,
```

(insert it as a new line anywhere inside that destructuring list, e.g. right after
`eligibleTaskIds,` on line 38).

After line 83 (`const staleTasks = staleTaskBlocks(taskRows);`), add:

```javascript
const fulfilledTaskConditions = fulfilledReleaseConditions(taskRows, TASK_STATUS_INDEX, 'blocked');
const fulfilledFindingConditions = fulfilledReleaseConditions(
  findingRows,
  FINDING_STATUS_INDEX,
  'open',
);
```

- [ ] **Step 4: Add the report section and the console.log lines**

In the `report` array in `scripts/measure-plan-tables.mjs` (lines 86-118), insert a new
section right after the `'## חסמים ⛔ שמצטטים משימה שכבר נמסרה'` section and its content
(after line 116, before the closing `''` at line 117):

```javascript
  '',
  '## תנאי שחרור שהתמלא — והשורה עדיין נעולה',
  '',
  '⛔ **דיווח בלבד — הסטטוס לא משתנה כאן.** ⓐ+ⓑ (`T-166`): כל שורה ⛔ או 🔓 שמצהירה',
  `\`${RELEASE_CONDITION_MARKER}\` עם תנאי שמולא, ⛔ ואיש עדיין לא עדכן את הסטטוס.`,
  '',
  fulfilledTaskConditions.length === 0 && fulfilledFindingConditions.length === 0
    ? '⛔ אין.'
    : [
        ...fulfilledTaskConditions.map((c) => `- \`${c.id}\` (משימה) — ${c.have}/${c.need}`),
        ...fulfilledFindingConditions.map((c) => `- \`${c.id}\` (ממצא) — ${c.have}/${c.need}`),
      ].join('\n'),
```

(`RELEASE_CONDITION_MARKER` must also be added to the destructured import from Task 1's
module, alongside `fulfilledReleaseConditions` from Step 3 above.)

Near the end of the file, in the console.log block (after line 539, the `for (const s of
staleTasks)` loop, before line 540's `console.log(\`open index: ...\`)`), add:

```javascript
const conditionLine = (c) => `${c.id} (${c.have}/${c.need})`;
console.log(
  `fulfilled release conditions (tasks): ${
    fulfilledTaskConditions.length === 0 ? 'none' : fulfilledTaskConditions.map(conditionLine).join(', ')
  }`,
);
console.log(
  `fulfilled release conditions (findings): ${
    fulfilledFindingConditions.length === 0
      ? 'none'
      : fulfilledFindingConditions.map(conditionLine).join(', ')
  }`,
);
```

- [ ] **Step 5: Add the missing test imports**

At the top of `scripts/measure-plan-tables.test.ts`, extend the existing import from
`../lib/core/planTable` (lines 6-14) to also include `splitRow` — it is already imported
there (line 7) — no change needed. Confirm `mkdtempSync`, `readFileSync`, `writeFileSync`
are already imported from `node:fs` (line 2) and `tmpdir`/`join` from `node:os`/`node:path`
(lines 3-4) — all four are already present, so Step 1's new test needs no new imports.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run scripts/measure-plan-tables.test.ts`
Expected: PASS, all tests including the pre-existing ones (no regressions) — in particular
re-check `it('holds every ⛔ cell to a blocker that has not already lifted', ...)` and its
task-blocker sibling still say `none`, since this task only adds a new independent check.

- [ ] **Step 7: Regenerate the two generated registers**

Run: `npm run measure:plan`
Expected: exits 0, rewrites `docs/plan-tables.md` (now carrying the new, empty
`## תנאי שחרור שהתמלא` section against the real live registers) and `docs/plan-open.md`
(unchanged in content, since this task adds no new task-open-index logic). Confirm with
`./scripts/g diff --stat` that only `docs/plan-tables.md` changed (and possibly
`docs/plan-open.md` if unrelated rows moved since Task 1's commit).

- [ ] **Step 8: Run full verify**

Run: `npm run verify`
Expected: PASS (all five commands green), per `docs/agents/DEV.md` STEP 6.

- [ ] **Step 9: Commit**

```bash
./scripts/g add scripts/measure-plan-tables.mjs scripts/measure-plan-tables.test.ts docs/plan-tables.md docs/plan-open.md
./scripts/g commit -m "loop(DEV): C-XXXX T-166 report fulfilled release conditions in docs/plan-tables.md"
./scripts/g push origin work/current
```
(`C-XXXX` = next cycle id, one higher than Task 1's, per the same `./scripts/g pull` +
max+1 rule.)

---

## Self-review notes (written during planning, not execution)

- **Spec coverage:** ⓐ (task check) → Task 1 + Task 2 Steps 3-4. ⓑ (finding check) → same
  functions, parameterized by `targetState`, exercised in both tasks' test suites.
  ⓒ (reuse `docs/plan-tables.md`, no new file/command) → Task 2 Step 4, no new `OUT`
  constant, no new `package.json` script. "Reports, does not change status" → enforced by
  construction: `fulfilledReleaseConditions` returns data, never writes a file or a cell;
  only `writeFileSync(OUT, report, ...)` (already existing, line 120) touches disk for it.
- **No placeholders:** every step above carries literal code, not a description of code.
- **Type consistency:** `FulfilledCondition` (`id`/`have`/`need`) is defined once in Task 1
  Step 7 and consumed with the same three fields in Task 2 Steps 1 and 4 — no renamed
  fields between tasks.
- **Marker syntax is a DEV judgment call, not a scope change** — per `docs/agents/DEV.md`'s
  `D-110` table ("File layout, function names, module boundaries" → you decide alone). No
  existing convention defines what a numeric release condition looks like in the registers;
  this plan proposes `תנאי שחרור: <have>/<need>`, mirroring the already-adopted
  `חסם:`/`המשך של:` idiom. **Log this as the one required D-110 line** in the tick's report
  when Task 1 is built: "בחרתי תחביר `תנאי שחרור: N/M` לתנאי שחרור מספרי — תואם את
  `חסם:`/`המשך של:` הקיימים, ⛔ אין מוסכמה קודמת."
</content>
