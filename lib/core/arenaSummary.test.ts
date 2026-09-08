import { describe, expect, it } from 'vitest';
import { CRITICAL_MS } from '@/lib/core/battle';
import type { ArenaWordKind } from '@/lib/core/arenaWords';
import { firstMetHe, meanSecondsHe, summarize } from '@/lib/core/arenaSummary';

const cast = (wordId: string, correct: boolean, responseMs: number, kind: ArenaWordKind = 'known') => ({
  wordId, correct, responseMs, critical: correct && responseMs < CRITICAL_MS, kind,
});

describe('summarize — 37 § 10', () => {
  it('⛔ אפס הטלות ⛔ אינו NaN', () => {
    const s = summarize([]);
    expect(s.total).toBe(0);
    expect(s.correct).toBe(0);
    expect(s.meanResponseMs).toBe(0);
    expect(s.bestStreak).toBe(0);
    expect(s.slow).toEqual([]);
  });

  it('נכונות ורצף מרבי — הרצף ⛔ אינו הרצף האחרון', () => {
    const s = summarize([
      cast('a', true, 900), cast('b', true, 900), cast('c', true, 900),
      cast('d', false, 900), cast('e', true, 900),
    ]);
    expect(s.correct).toBe(4);
    expect(s.total).toBe(5);
    expect(s.bestStreak).toBe(3);
  });

  it('«איטית» = נכונה שאינה קריטית (§ 5), ⛔ ולא סף שהומצא', () => {
    const s = summarize([
      cast('a', true, CRITICAL_MS - 1),
      cast('b', true, CRITICAL_MS),
      cast('c', false, 9_000),
    ]);
    expect(s.slow.map((c) => c.wordId)).toEqual(['b']);
  });

  it('הממוצע מעוגל, והפורמט הוא «1.8 ש׳»', () => {
    expect(summarize([cast('a', true, 1_750), cast('b', true, 1_850)]).meanResponseMs).toBe(1_800);
    expect(meanSecondsHe(1_800)).toBe('1.8 ש׳');
    expect(meanSecondsHe(0)).toBe('0.0 ש׳');
  });
});

describe('firstMet — T-282 · 37 § 10 · קריאה בלבד', () => {
  it('הטלות על מילים `unfiltered`, פעם אחת למילה, נכונות ושגויות כאחד', () => {
    const s = summarize([
      cast('a', true, 900),                       // known
      cast('b', false, 900, 'unfiltered'),        // met, wrong
      cast('c', true, 900, 'unfiltered'),         // met, right
      cast('b', true, 900, 'base'),               // the requeued copy — ⛔ not a second meeting
      cast('d', true, 900, 'base'),
    ]);
    expect(s.firstMet.map((c) => c.wordId)).toEqual(['b', 'c']);
  });

  it('⛔ מילה אחת ⛔ נספרת פעמיים גם אם הוטלה פעמיים כ-`unfiltered`', () => {
    const s = summarize([cast('b', false, 900, 'unfiltered'), cast('b', true, 900, 'unfiltered')]);
    expect(s.firstMet.map((c) => c.wordId)).toEqual(['b']);
  });

  it('⛔ אפס הטלות ⇒ רשימה ריקה, ⛔ לא undefined', () => {
    expect(summarize([]).firstMet).toEqual([]);
  });

  it('«פגשת 4 מילים חדשות» מהרנדר, ו«מילה אחת» ליחיד', () => {
    expect(firstMetHe(4)).toBe('פגשת 4 מילים חדשות');
    expect(firstMetHe(1)).toBe('פגשת מילה אחת חדשה');
  });
});
