import { describe, expect, it } from 'vitest';
import {
  splitRow,
  rowShape,
  excerpt,
  classify,
  continuationOf,
  WORKSTREAMS,
  WORK_KINDS,
  LAYERS,
  IMPROVEMENT_TAGS,
  CROSS_CUTTING,
  TASK_COLUMNS,
} from './planTable';

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
      /* 🔵 **⟦20/09 · `C-0742` · `F-308`⟧ «בעבודה» — במקרא ו⛔ לא כאן.**
         🔴 **והמקרה שהכריע הוא `T-184`:** בלי הגליף, הראשון ה**מוכר** בתא שלה
         הוא `⛔` שיושב ב**פרוזה**, ⇒ שורה **בעבודה** דווחה `blocked`. */
      ['🔵 **חצי ⓐ נמסר** — ⛔ החצי השני עדיין פתוח', 'open'],
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

import { cancelledStatusGaps } from './planTable';
import type { CancelledStatusGap } from './planTable';

describe('cancelledStatusGaps', () => {
  // ⛔ Unlike `taskRow` above, this needs the TASK cell (cells[2]) populated too, since
  // the rule reads prose ("בוטלה") from the task cell and the glyph from the status cell.
  const row = (id: string, task: string, status: string): RowShape => ({
    id,
    cells: ['', '', task, '', status, '', '', ''],
    expected: 8,
    ok: true,
  });

  it('flags a task cell that OPENS with "🚫 בוטלה" while the status cell is still ⛔ — the six-row F-125/C-0370 bug, mechanised', () => {
    const rows = [row('T-160', '🚫 **בוטלה 23/08** — מתארת את הזירה הישנה.', '⛔ C-0370 ⟨מואַרך⟩')];
    expect(cancelledStatusGaps(rows)).toEqual<CancelledStatusGap[]>([
      { id: 'T-160', state: 'blocked' },
    ]);
  });

  it('flags it on an ⬜ open status cell too — the marker is not only about ⛔', () => {
    const rows = [row('T-999', '🚫 **בוטלה** בטעות ואיש לא עדכן את הסטטוס', '⬜')];
    expect(cancelledStatusGaps(rows)).toEqual<CancelledStatusGap[]>([
      { id: 'T-999', state: 'open' },
    ]);
  });

  it('stays silent once the status cell is flipped to 🚫 — the fix that C-0370 actually applied', () => {
    const rows = [row('T-160', '🚫 **בוטלה 23/08** — מתארת את הזירה הישנה.', '🚫 C-0370 ⟨מואַרך⟩')];
    expect(cancelledStatusGaps(rows)).toEqual([]);
  });

  it('stays silent when the status cell is ✅ done instead — also a valid closed state', () => {
    const rows = [row('T-070', '🚫 **בוטלה** בהחלטה אחת, נבנתה בפועל תחת שם אחר', '✅ נמסרה')];
    expect(cancelledStatusGaps(rows)).toEqual([]);
  });

  it('ignores a row whose task cell never mentions "בוטלה"', () => {
    const rows = [row('T-201', 'בלוק במקלדת ⛔ לעולם ⛔ אינו מוצג בלי המקרא הכתוב שלו', '⬜')];
    expect(cancelledStatusGaps(rows)).toEqual([]);
  });

  it('ignores a row that merely NARRATES something else\'s cancellation, ⛔ not its own — measured live: T-168 / T-175 / T-199 all say "…שבוטלה" mid-sentence about a rule/grid/sibling-task, and none of the three is itself cancelled', () => {
    const rows = [
      row('T-168', 'היא אוכפת חוקה שבוטלה (D-102). התיקון: לגזור את ALLOWED מסולם...', '⬜'),
      row('T-175', 'מחליפה את רשת האריחים שבוטלה. מוקד מרכזי קול...', '🟣 נמסרה'),
      row('T-199', 'משפטים נעשה מסלול חי — מחליפה את T-164 שבוטלה.', '⬜'),
    ];
    expect(cancelledStatusGaps(rows)).toEqual([]);
  });

  it('skips a malformed row', () => {
    const malformed: RowShape = { id: 'T-042', cells: ['בוטלה'], expected: 8, ok: false };
    expect(cancelledStatusGaps([malformed])).toEqual([]);
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


describe('excerpt', () => {
  it('leaves a short cell alone', () => {
    expect(excerpt('⬜', 150)).toBe('⬜');
  });

  it('collapses the whitespace a register cell carries', () => {
    expect(excerpt('  ⬜   ממתין\tלביצוע ', 150)).toBe('⬜ ממתין לביצוע');
  });

  it('re-escapes a pipe, because splitRow handed it back unescaped', () => {
    // The round trip that matters: `a \| b` in the register becomes `a | b` in `cells`,
    // and re-emitting THAT into a markdown table invents a column in the index.
    const cell = splitRow('| T-001 | a \\| b |')[1];
    expect(cell).toBe('a | b');
    expect(excerpt(cell ?? '', 150)).toBe('a \\| b');
  });

  it('escapes a backslash before it can eat the pipe that follows', () => {
    expect(excerpt('C:\\', 150)).toBe('C:\\\\');
  });

  it('closes a code span the cut left hanging', () => {
    // An unmatched backtick swallows the rest of the rendered row.
    expect(excerpt('see `lib/core/planTable.ts` and `app', 20)).toBe('see `lib/core/planTa…`');
  });

  it('cuts by code point, so a surrogate pair is never split', () => {
    // The registers are full of emoji. `'🔴🔴🔴'.slice(0, 2)` is half a character.
    const out = excerpt('🔴🟠🟡⚪', 2);
    expect(out).toBe('🔴🟠…');
    expect([...out].length).toBe(3);
  });

  it('marks that it cut, and does not mark that it did not', () => {
    expect(excerpt('abcdef', 3)).toBe('abc…');
    expect(excerpt('abc', 3)).toBe('abc');
  });
});


describe('classify', () => {
  it('reads a milestone, a workstream and a kind out of one cell', () => {
    expect(classify('M2 · story · נוחות')).toEqual({
      milestone: 'M2',
      workstream: 'story',
      kind: 'נוחות',
      layer: null,
      improvementTag: null,
      unknown: [],
    });
  });

  it('does not care about token order — the two vocabularies are disjoint', () => {
    expect(classify('story · M2 · נוחות')).toEqual(classify('M2 · story · נוחות'));
  });

  it('still reads the 200 rows that carry a bare milestone', () => {
    // ⛔ The tags are being added incrementally. An untagged row must classify
    // cleanly as "milestone known, axes unknown" — ⛔ never as malformed.
    expect(classify('M0')).toEqual({
      milestone: 'M0',
      workstream: null,
      kind: null,
      layer: null,
      improvementTag: null,
      unknown: [],
    });
  });

  it('reports an unrecognised token instead of swallowing it', () => {
    // This is the assertion that keeps the vocabulary closed. Without it, `ux`
    // and `נוחות` become two columns in the balance table that mean one thing.
    expect(classify('M2 · ux').unknown).toEqual(['ux']);
    expect(classify('M2 · ux').kind).toBeNull();
  });

  it('treats a second tag on the same axis as a contradiction, not a tag', () => {
    // A row that claims two workstreams would be counted twice and the balance
    // table would not add up to the register.
    const c = classify('M2 · story · arena');
    expect(c.workstream).toBe('story');
    expect(c.unknown).toEqual(['arena']);
  });

  it('ignores the em-dash the register writes for "no value"', () => {
    expect(classify('M1 · —').unknown).toEqual([]);
  });

  it('accepts every token in all four published vocabularies', () => {
    for (const w of WORKSTREAMS) expect(classify(`M0 · ${w}`).workstream).toBe(w);
    for (const k of WORK_KINDS) expect(classify(`M0 · ${k}`).kind).toBe(k);
    for (const l of LAYERS) expect(classify(`M0 · ${l}`).layer).toBe(l);
    for (const t of IMPROVEMENT_TAGS) expect(classify(`M0 · ${t}`).improvementTag).toBe(t);
  });

  /**
   * T-226 — `amirnet` must be a recognised workstream tag BEFORE the first row is
   * tagged with it (F-165/F-166): a tag outside `WORKSTREAM_SET` is reported as
   * `unknown` and the row falls into the "ללא זרימה" (no-flow) bucket in
   * `measure-plan-tables.mjs`, which is exactly the failure this task closes.
   */
  it('T-226: recognises `amirnet` as a workstream tag, not an unknown one', () => {
    const c = classify('M0 · amirnet · תשתית');
    expect(c.workstream).toBe('amirnet');
    expect(c.unknown).toEqual([]);
  });

  it('T-226: `amirnet` sits after `msgs` and is a feature stream, not cross-cutting', () => {
    // Position matches `36 § 6` (the ninth node) — ⛔ not `36 § 13`'s build order,
    // which `amirnet` is not part of. `loop`/`base`/`general` stay the only
    // cross-cutting tags; `amirnet` must not join them.
    expect(WORKSTREAMS.indexOf('amirnet')).toBe(WORKSTREAMS.indexOf('msgs') + 1);
    expect(CROSS_CUTTING.has('amirnet')).toBe(false);
  });

  /**
   * 🔴 **D-148 — the layer tag is the gate the animation skills hang on, so the
   * three things that would quietly kill it are asserted here and ⛔ nowhere else.**
   *
   * 1. It is **optional**. If an untagged row ever counted as a bad tag, 190 rows
   *    would light up at once and the balance table would stop being readable.
   * 2. It is **closed**. `שכבה B` or `layer B` must ⛔ not read as the real tag —
   *    a near-miss spelling that classifies as `unknown` is exactly what stops a
   *    row from silently buying a permission it was ⛔ never given.
   * 3. It is **disjoint** from the other two axes, so order stays irrelevant.
   */
  it('🔴 the layer tag is optional, closed, and order-free (D-148)', () => {
    // 1 · optional — ⛔ absent is ⛔ not an error
    expect(classify('M2 · arena · נוחות').layer).toBeNull();
    expect(classify('M2 · arena · נוחות').unknown).toEqual([]);

    // 2 · closed — a near-miss is reported, ⛔ never accepted
    expect(classify('M2 · arena · שכבה B').layer).toBeNull();
    expect(classify('M2 · arena · שכבה B').unknown).toEqual(['שכבה B']);
    expect(classify('M2 · arena · layer B').layer).toBeNull();

    // 3 · disjoint — order is irrelevant, exactly like the other two axes
    expect(classify('שכבה ב׳ · arena · M2')).toEqual(classify('M2 · arena · שכבה ב׳'));

    // and a second layer on one row is a contradiction, ⛔ not a tag
    const c = classify('M2 · arena · שכבה א׳ · שכבה ב׳');
    expect(c.layer).toBe('שכבה א׳');
    expect(c.unknown).toEqual(['שכבה ב׳']);
  });

  /**
   * 🔴 **T-271 (המשך של T-255) — `שיפור` נכנס בדיוק בדפוס `LAYERS` שמעליו, ואותם
   * שלושה תנאים נבדקים כאן ⛔ ולא רק בהשוואה למקור.**
   *
   * ① לפני התיקון `classify('M2 · story · נוחות · שיפור')` היה מחזיר
   * `unknown: ['שיפור']` — בדיוק כפי שהמשימה מדדה (הרצה 1). ② `שיפור` ⛔ אינו הופך
   * ל-`kind` — השורה נשארת מתויגת `נוחות` (גדר 4 של `D-146`), והוא נספר בשדה נפרד
   * משלו. ③ הוא **רשות**: שורה בלעדיו ⛔ אינה `unknown` ו⛔ אינה שגיאה — 190+ שורות
   * פתוחות שקיימות היום היו מתלקחות בבת אחת אחרת.
   */
  it('🔴 T-271: the שיפור tag is optional, closed, order-free, and never a kind', () => {
    // 1 · optional — ⛔ absent is ⛔ not an error
    expect(classify('M2 · story · נוחות').improvementTag).toBeNull();
    expect(classify('M2 · story · נוחות').unknown).toEqual([]);

    // 2 · present — recognised in its own field, ⛔ never in `unknown`, and the
    // `kind` axis is untouched (this is the exact scenario T-271's horn ① measured
    // as broken: `classify('M2 · story · נוחות · שיפור')` used to report `unknown`)
    const tagged = classify('M2 · story · נוחות · שיפור');
    expect(tagged.improvementTag).toBe('שיפור');
    expect(tagged.kind).toBe('נוחות');
    expect(tagged.unknown).toEqual([]);

    // 3 · closed — a near-miss is reported, ⛔ never accepted
    expect(classify('M2 · story · שיפורים').improvementTag).toBeNull();
    expect(classify('M2 · story · שיפורים').unknown).toEqual(['שיפורים']);

    // 4 · disjoint — order is irrelevant, exactly like the other axes
    expect(classify('שיפור · story · M2 · נוחות')).toEqual(
      classify('M2 · story · נוחות · שיפור'),
    );

    // 5 · ⛔ never added to WORK_KINDS — it is a fourth, separate axis
    expect((WORK_KINDS as readonly string[]).includes('שיפור')).toBe(false);

    // and a second improvement tag on one row is a contradiction, ⛔ not a tag
    const doubled = classify('M2 · story · נוחות · שיפור · שיפור');
    expect(doubled.improvementTag).toBe('שיפור');
    expect(doubled.unknown).toEqual(['שיפור']);
  });
});

describe('continuationOf', () => {
  it('reads the declared parent', () => {
    expect(continuationOf('**מסך הסיפור.** המשך של: T-183', 'T-186')).toBe('T-183');
  });

  it('ignores a task named in prose before the marker', () => {
    // The same defect `citedTasks` was written against: prose names tasks as
    // evidence. A tree built from footnotes is a wrong tree.
    const cell = 'T-999 כבר נמסרה ולכן זה אפשרי. המשך של: T-183';
    expect(continuationOf(cell, 'T-186')).toBe('T-183');
  });

  it('returns null when no parent is declared', () => {
    expect(continuationOf('**מסך הסיפור** (T-183 רלוונטית)', 'T-186')).toBeNull();
  });

  it('never lets a row be its own parent', () => {
    expect(continuationOf('המשך של: T-186', 'T-186')).toBeNull();
  });
});
