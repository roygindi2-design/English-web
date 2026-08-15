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

const TASK_REF = /\bT-\d{3}\b/g;

/**
 * The declared-blocker marker. ⛔ Everything before it is prose and is ⛔ not read.
 *
 * Measured C-0158, on this function's own first draft: reading the whole cell reported
 * `T-035 waits on T-038 (done)` — but `T-035` names `T-038`/`T-039` as the *evidence* that
 * half its scope is already delivered, ⛔ not as what it waits for. A citation in prose
 * cannot be told apart from a dependency, so the dependency is declared instead of guessed.
 */
export const BLOCKER_MARKER = 'חסם:';

/**
 * Task IDs a ⛔ cell declares as its blockers, minus the row's own ID. A cell with no
 * marker declares no task blocker — those rows name a human or the PM as the owner, and
 * `eligibleTaskIds` already keeps every ⛔ row out of the queue either way.
 *
 * The self-exclusion is not cosmetic: `T-043`'s prose lists the five rows it releases, so a
 * self-citation would turn that row into its own blocker the moment it is marked ✅.
 */
export function citedTasks(cell: string, selfId: string): string[] {
  const at = cell.indexOf(BLOCKER_MARKER);
  if (at === -1) return [];
  const declared = cell.slice(at + BLOCKER_MARKER.length);
  return [...new Set(declared.match(TASK_REF) ?? [])].filter((id) => id !== selfId);
}

export interface StaleBlock {
  readonly taskId: string;
  readonly findingId: string;
  readonly findingState: TaskState;
}

export interface StaleTaskBlock {
  readonly taskId: string;
  readonly blockerId: string;
  readonly blockerState: TaskState;
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

/**
 * The same rule as `staleBlocks`, aimed at the other kind of blocker a ⛔ cell can name:
 * another task. Measured C-0158 — eight ⬜ rows advertised themselves as Dev-eligible while
 * every one of them waited on `T-043` (source files, a human action) or on a missing PM
 * spec, and five consecutive cycles reported the same phantom queue. Writing the blocker
 * into the cell fixes today's lie; this function is what stops it from becoming tomorrow's,
 * because a blocker that has been delivered stops being invisible the moment it flips.
 *
 * `done` and `cancelled` are the two states that lift a block. `awaiting-review` does ⛔ not:
 * a task in the Critic's queue has not shipped yet.
 */
export function staleTaskBlocks(tasks: readonly RowShape[]): StaleTaskBlock[] {
  const states = new Map<string, TaskState>();
  for (const row of tasks) {
    if (!row.ok) continue;
    const cell = row.cells[TASK_STATUS_INDEX];
    if (cell !== undefined) states.set(row.id, classifyStatus(cell));
  }

  const out: StaleTaskBlock[] = [];
  for (const row of tasks) {
    if (!row.ok) continue;
    const cell = row.cells[TASK_STATUS_INDEX];
    if (cell === undefined || classifyStatus(cell) !== 'blocked') continue;
    for (const blockerId of citedTasks(cell, row.id)) {
      const blockerState = states.get(blockerId);
      if (blockerState === 'done' || blockerState === 'cancelled') {
        out.push({ taskId: row.id, blockerId, blockerState });
      }
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
