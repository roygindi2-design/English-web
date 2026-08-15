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
