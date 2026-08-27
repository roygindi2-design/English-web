import { describe, expect, it } from 'vitest';
import { CRITICAL_MS } from '@/lib/core/battle';
import { meanSecondsHe, summarize } from '@/lib/core/arenaSummary';

const cast = (wordId: string, correct: boolean, responseMs: number) => ({
  wordId, correct, responseMs, critical: correct && responseMs < CRITICAL_MS,
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
