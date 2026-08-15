import { describe, expect, it } from 'vitest';
import { formatGateReport, reasonFamily, summarizeGate, type GateOutcome } from './gateReport';

/**
 * Three outcomes, hand-written, because the point of the suite is the SHAPE of the
 * summary and ⛔ not the content of data/generated/. The real batch files are asserted
 * against in scripts/measure-gate.test.ts, where they belong.
 */
const OUTCOMES: readonly GateOutcome[] = [
  { file: 'batch-a.jsonl', line: 1, headword: 'always', ok: true, reasons: [] },
  {
    file: 'batch-a.jsonl',
    line: 2,
    headword: 'yacht',
    ok: false,
    reasons: ['example neutral: level drift on "yacht"'],
  },
  {
    file: 'batch-b.jsonl',
    line: 1,
    headword: 'kettle',
    ok: false,
    reasons: ['example supportive: level drift on "kettle"', 'item 0: leaks the answer'],
  },
];

const COUNTS = { sentencesGated: 6, itemStemsGated: 9 };

describe('reasonFamily', () => {
  it('folds the two example kinds onto one family', () => {
    expect(reasonFamily('example supportive: over 14 words')).toBe('example: over 14 words');
    expect(reasonFamily('example neutral: over 14 words')).toBe('example: over 14 words');
  });

  it('folds every item index onto one family', () => {
    expect(reasonFamily('item 0: leaks the answer')).toBe('item: leaks the answer');
    expect(reasonFamily('item 7: leaks the answer')).toBe('item: leaks the answer');
  });

  it('drops the quoted payload, so a drift on 40 different words is ONE line and not 40', () => {
    expect(reasonFamily('example neutral: level drift on "kettle", "spoon"')).toBe('example: level drift');
    expect(reasonFamily('example supportive: level drift on "yacht"')).toBe('example: level drift');
  });

  it('leaves a reason that carries neither index nor payload untouched', () => {
    expect(reasonFamily('translation: contains nikud (R-007)')).toBe('translation: contains nikud (R-007)');
  });
});

describe('summarizeGate', () => {
  it('counts rows read, passed and rejected', () => {
    const report = summarizeGate(OUTCOMES, COUNTS);
    expect(report.rowsRead).toBe(3);
    expect(report.rowsPassed).toBe(1);
    expect(report.rowsRejected).toBe(2);
  });

  it('carries the sentence and stem counts through — D-035 ⓑ asks how many SENTENCES were re-gated', () => {
    const report = summarizeGate(OUTCOMES, COUNTS);
    expect(report.sentencesGated).toBe(6);
    expect(report.itemStemsGated).toBe(9);
  });

  it('histograms by family, most common first, ties broken by name so the file is stable', () => {
    const report = summarizeGate(OUTCOMES, COUNTS);
    expect(report.reasonHistogram).toEqual([
      { reason: 'example: level drift', count: 2 },
      { reason: 'item: leaks the answer', count: 1 },
    ]);
  });

  it('keeps every rejected row with its file and line, so the report is auditable row by row', () => {
    const report = summarizeGate(OUTCOMES, COUNTS);
    expect(report.rejectedRows.map((row) => `${row.file}:${row.line}`)).toEqual([
      'batch-a.jsonl:2',
      'batch-b.jsonl:1',
    ]);
  });

  it('reports zero rejections as an empty histogram — ⛔ "no rejects" is a measurement, not a missing report', () => {
    // `.slice(0, 1)` and ⛔ not `[OUTCOMES[0]]`: noUncheckedIndexedAccess types the
    // index access as `GateOutcome | undefined`. Same single passing row either way.
    const report = summarizeGate(OUTCOMES.slice(0, 1), { sentencesGated: 2, itemStemsGated: 3 });
    expect(report.rowsRejected).toBe(0);
    expect(report.reasonHistogram).toEqual([]);
  });
});

describe('formatGateReport', () => {
  it('states every number a reader would quote', () => {
    const text = formatGateReport(summarizeGate(OUTCOMES, COUNTS));
    expect(text).toContain('3 rows read');
    expect(text).toContain('6 example sentences');
    expect(text).toContain('9 item stems');
    expect(text).toContain('2 rows rejected');
  });

  it('names each rejected row by file, line and headword', () => {
    const text = formatGateReport(summarizeGate(OUTCOMES, COUNTS));
    expect(text).toContain('batch-b.jsonl:1 — "kettle"');
  });
});
