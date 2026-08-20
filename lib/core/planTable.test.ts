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

  it('does not break a column on a pipe inside a code span', () => {
    // מחלקת F-059 · F-062ⓒ · F-063 — שלוש נפילות רצ׳ט מאותו שורש, ובכל פעם התיקון
    // היה להבריח צינור בשורה אחת. השורש הוא כאן: מפצל שאינו מכיר code span.
    expect(splitRow('| F-053 | `string | undefined` | fix |')).toEqual([
      'F-053',
      '`string | undefined`',
      'fix',
    ]);
  });

  it('honours a doubled backtick run and only closes on a run of the same length', () => {
    // נמדד: 3 רצפי `` ב-50-tasks ו-1 ב-60-findings, ובתוכם כבר יושבים `\|` מוברחים.
    // מפצל שסופר גרש בודד היה שובר את השורות האלה, שהיום תקינות.
    expect(splitRow('| T-001 | ``a ` b | c`` | d |')).toEqual(['T-001', '``a ` b | c``', 'd']);
  });

  it('treats an unterminated backtick run as literal, not as an open span', () => {
    // ⛔ הכשל השקט המסוכן: רצף שאינו נסגר בולע את שארית השורה ומאחד עמודות, כלומר
    // שורה תקינה הופכת פגומה. CommonMark מסכים: רצף בלי סוגר הוא טקסט.
    expect(splitRow('| T-002 | a ` b | c |')).toEqual(['T-002', 'a ` b', 'c']);
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

import {
  classifyStatus,
  citedFindings,
  citedTasks,
  staleBlocks,
  staleTaskBlocks,
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

describe('citedTasks', () => {
  it('reads only what the cell declares after the חסם: marker', () => {
    expect(
      citedTasks('⛔ חסום — `data/ngsl-1.2.csv` חסר. חסם: **פעולה אנושית T-043**', 'T-007'),
    ).toEqual(['T-043']);
    expect(citedTasks('⛔ חסום. חסם: **T-037 · T-043**', 'T-036')).toEqual(['T-037', 'T-043']);
  });

  it('ignores a task named before the marker — prose is evidence, not dependency', () => {
    // The live T-035 case, measured C-0158: it names T-038/T-039 as proof that half its
    // scope already shipped. Reading the whole cell called those two its blockers.
    const cell = '⛔ החצי הסכמתי נמסר ב-T-038/T-039 (אושרו C-0011). חסם: **T-037**';
    expect(citedTasks(cell, 'T-035')).toEqual(['T-037']);
  });

  it('returns nothing for a cell that declares no marker at all', () => {
    expect(citedTasks('⛔ **חסום — פעולה אנושית**', 'T-043')).toEqual([]);
    expect(citedTasks('⛔ חסומה — F-052 (אנטומיית מסך חסרה)', 'T-066')).toEqual([]);
  });

  it('never reports the row as its own blocker', () => {
    expect(citedTasks('⛔ חסום. חסם: **T-043**', 'T-043')).toEqual([]);
  });

  it('does not report the same task twice', () => {
    expect(citedTasks('⛔ חסום. חסם: T-043 ועוד T-043', 'T-007')).toEqual(['T-043']);
  });
});

describe('staleTaskBlocks', () => {
  const blocked = (id: string, blockers: string) => taskRow(id, `⛔ חסום. חסם: ${blockers}`);

  it('flags a ⛔ cell whose declared blocker is finished — the block has already lifted', () => {
    const rows = [blocked('T-007', '**T-043**'), taskRow('T-043', '✅ הקבצים נחתו')];
    expect(staleTaskBlocks(rows)).toEqual([
      { taskId: 'T-007', blockerId: 'T-043', blockerState: 'done' },
    ]);
  });

  it('flags a declared blocker that was cancelled — a dead blocker blocks nothing', () => {
    const rows = [blocked('T-036', 'T-008'), taskRow('T-008', '🚫 בוטלה')];
    expect(staleTaskBlocks(rows)).toEqual([
      { taskId: 'T-036', blockerId: 'T-008', blockerState: 'cancelled' },
    ]);
  });

  it('stays silent while the declared blocker is still blocked or open', () => {
    const rows = [
      blocked('T-007', 'T-043'),
      taskRow('T-043', '⛔ **חסום — פעולה אנושית**'),
      blocked('T-036', 'T-037'),
      taskRow('T-037', '⬜'),
    ];
    expect(staleTaskBlocks(rows)).toEqual([]);
  });

  it('stays silent for a blocker in review — 🟣 is not yet delivered', () => {
    const rows = [blocked('T-036', 'T-037'), taskRow('T-037', '🟣 ממתין לסקירה')];
    expect(staleTaskBlocks(rows)).toEqual([]);
  });

  it('stays silent for an unknown task rather than guessing it closed', () => {
    expect(staleTaskBlocks([blocked('T-007', 'T-999')])).toEqual([]);
  });

  it('ignores a row that is not blocked but declares a finished task', () => {
    const rows = [taskRow('T-070', '✅ נסגרה. חסם: T-043'), taskRow('T-043', '✅')];
    expect(staleTaskBlocks(rows)).toEqual([]);
  });

  it('never reads a malformed row, as either side of the pair', () => {
    const malformed: RowShape = { id: 'T-042', cells: ['T-042'], expected: 8, ok: false };
    expect(staleTaskBlocks([malformed, taskRow('T-043', '✅')])).toEqual([]);
    expect(staleTaskBlocks([blocked('T-007', 'T-042'), malformed])).toEqual([]);
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
