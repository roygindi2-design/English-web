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
